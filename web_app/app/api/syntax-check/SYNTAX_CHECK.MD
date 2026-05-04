# Syntax Check API — Mechanism Documentation

## Overview

The Syntax Check API (`/api/syntax-check`) performs **server-side compilation** of source code to detect syntax errors in real-time, before code is submitted for execution. It invokes the actual compiler/interpreter for each language, captures error output, parses compiler messages into structured `SyntaxError` objects, and returns them to the client where Monaco Editor renders them as inline squiggly underlines and gutter markers.

---

## Architecture

```
User types in Monaco Editor
        │
        ▼
useLocalSyntaxCheck.ts (debounced, 500ms)
        │
        ▼
POST /api/syntax-check { source, languageId }
        │
        ▼
route.ts — language switch
        │
        ├─ Python  → checkPython()  → python3 -m py_compile
        ├─ C       → checkC()       → gcc -fsyntax-only -Wall -Wextra -std=c17
        ├─ C++     → checkCpp()      → g++ -fsyntax-only -Wall -Wextra -std=c++17
        ├─ Java    → checkJava()     → javac -Xdiags:verbose
        └─ C#      → checkCSharp()  → dotnet build
        │
        ▼
Compiler output (stdout/stderr) ──parser──► SyntaxError[]
        │
        ▼
NextResponse.json({ errors: [...] })
        │
        ▼
useLocalSyntaxCheck.ts — maps to Monaco markers
        │
        ▼
Monaco Editor renders error decorations
```

---

## Supported Languages & Compilers

| Language | Tool        | Flags                                   |
|----------|-------------|-----------------------------------------|
| Python   | `python3`   | `-m py_compile`                         |
| C        | `gcc`       | `-fsyntax-only -Wall -Wextra -std=c17`  |
| C++      | `g++`       | `-fsyntax-only -Wall -Wextra -std=c++17`|
| Java     | `javac`     | `-Xdiags:verbose`                       |
| C#       | `dotnet`    | `build` (with implicit restore)         |

---

## Phase 1 — Temp File Creation

For each language (except C#), the source code is written to a **temp file** in `os.tmpdir()`:

```
/tmp/syntax_check_<timestamp>.{py|c|cpp|java}
```

For C#, a **temp directory** is created with a `.csproj` project file and `Program.cs`, then `dotnet build` runs inside it:

```
/tmp/csharp-syntax-XXXXX/
├── SyntaxCheck.csproj    (minimal .NET 8 console project)
└── Program.cs           (user's source code)
```

C# requires the project file because `dotnet build` cannot operate on a standalone `.cs` file.

---

## Phase 2 — Compilation

The compiler is invoked via `execSync` with `2>&1` to merge stderr into stdout, and `|| true` (for C#) to prevent `execSync` from throwing on non-zero exit codes.

**Key behavior differences by language:**

### Python — `python3 -m py_compile`
- Only detects **syntactic** errors (parsing/indentation).
- Does **not** detect **semantic** errors (e.g., undefined variables, type mismatches).
- On error, Python writes to **stderr** and exits non-zero.
- `execSync` throws; output is in `err.stderr`.

### C / C++ — `gcc -fsyntax-only` / `g++ -fsyntax-only`
- Stops after parsing/type-checking, **does not produce binary output**.
- `-Wall -Wextra` enables verbose warnings.
- GCC errors come in many formats:

  ```
  file:line:col: error: message
  file:line:col: fatal error: message      ← "fatal" prefix
  file:line:col: warning: message
  file:line:col: fatal warning: message    ← "fatal" + "warning"
  file:line:col: note: message
  ```
- **Important:** GCC stops after the **first fatal error** and does not report subsequent errors in the same compilation unit.

### Java — `javac -Xdiags:verbose`
- Writes errors to **stdout** (not stderr).
- **Important:** `javac` exits with code `0` even when compilation errors exist — the error output is in `err.stdout` of the caught exception, **not** in the successful return value.
- Output format:

  ```
  file.java:line: error: message
      code line
          ^ caret
  ```

### C# — `dotnet build`
- Requires `dotnet restore` before `dotnet build` (without `--no-restore`).
- First run triggers NuGet package restore (~3s); subsequent runs are faster (packages cached).
- Output format:

  ```
  file.cs(line,col): error CSxxxx: message
  ```

---

## Phase 3 — Error Output Parsing

Each language has a dedicated parser regex that extracts `(line, column, severity, message)` from compiler output.

### `parseGccOutput` (C / C++)

Regex: `/^.+:(\d+):(\d+):\s*(?:fatal\s+)?(error|warning|note):\s*(.+)$/gm`

Handles all GCC output variants including `fatal error:` and `fatal warning:`.

```typescript
{
  line: parseInt(match[1]),
  column: parseInt(match[2]),
  endLine: line,
  endColumn: column + 1,
  severity: severity === 'error' ? 'error' : severity === 'warning' ? 'warning' : 'info',
  message: match[4].trim(),
}
```

### `parseJavaOutput` (Java)

Regex: `/^.+[/\\](\w+\.java):(\d+):\s*(.+)$/gm`

- Captures line number and full message.
- Extracts column from `column N` text within the message.
- Determines severity by checking for `error`, `warning`, or `note` keywords.

```typescript
{
  line,
  column,         // extracted from "column N" or defaults to 1
  endLine: line,
  endColumn: column + 1,
  severity: 'error' | 'warning' | 'info',
  message: msg.replace(/\b(error|warning|note):\s*/gi, '').trim(),
}
```

### `parsePythonOutput` (Python)

Three format parsers:

1. **"Sorry: ErrorType: message (file.py, line N)"** — used by some Python implementations.
2. **Traceback format** — `File "file.py", line N` with the error type on the next line.
3. **Inline format** — `SyntaxError: message` with `line N` extracted from context.

```typescript
{
  line,
  column: 1,
  endLine: line,
  endColumn: 1000,
  severity: 'error',
  message: 'SyntaxError: unexpected EOF while parsing',
}
```

### `parseDotnetOutput` (C#)

Regex: `/^.+[/\\](\w+\.cs)\((\d+),(\d+)\):\s*(error|warning)\s+(CS\d+):\s*(.+)$/gm`

Extracts error code (e.g., `CS1002`) and prepends it to the message.

```typescript
{
  line,
  column,
  endLine: line,
  endColumn: column + 1,
  severity: 'error' | 'warning',
  code: 'CS1002',
  message: 'CS1002: ; expected',
}
```

---

## Phase 4 — Cleanup

After compilation, all temp files and directories are deleted in the `finally` block:

- **Python, C, C++, Java:** `fs.unlinkSync(filepath)` on the temp file.
- **C#:** `fs.rmSync(tmpDir, { recursive: true, force: true })` on the temp directory.

---

## Error Response Shape

```typescript
interface SyntaxError {
  line: number;
  column: number;
  endLine: number;
  endColumn: number;
  severity: 'error' | 'warning' | 'info';
  message: string;
  code?: string;  // C# only (e.g., "CS1002")
}
```

API response:
```json
{
  "errors": [
    {
      "line": 4,
      "column": 5,
      "endLine": 4,
      "endColumn": 6,
      "severity": "error",
      "message": "expected initializer before 'int'"
    }
  ]
}
```

---

## Known Limitations

1. **C / C++ — first fatal error only:** GCC stops after the first `fatal error` and does not report subsequent errors. Users must fix errors one at a time.
2. **C# — slow first run:** The first `dotnet build` per session triggers NuGet restore (~3–5s). Timeout is set to 10s.
3. **Python — syntax only:** `py_compile` only detects syntactic errors. Semantic errors (undefined names, type mismatches) are not caught.
4. **Java — exit code 0 with errors:** `javac` exits with code 0 even on errors. The parser must run in the `catch` block using `err.stdout`.
5. **C# — .NET SDK required:** The server must have `dotnet` SDK installed. Without it, the route silently returns `errors: []`.

---

## Debugging

Each function logs at the `[syntax-check]` prefix:

- `[syntax-check] POST - languageId: ...` — API entry, shows language and source length.
- `[syntax-check] check{Lang} - raw output: ...` — raw compiler output.
- `[syntax-check] check{Lang} - parsed errors: ...` — after regex parsing.
- `[syntax-check] lang: ... source: ... errors: ...` — final return from API.
- `[useLocalSyntaxCheck] got N errors for lang: ...` — client receives N errors.

Remove these `console.log` statements before deploying to production.

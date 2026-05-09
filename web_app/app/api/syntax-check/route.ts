import { NextRequest, NextResponse } from 'next/server';
import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

export interface SyntaxError {
  line: number;
  column: number;
  endLine: number;
  endColumn: number;
  severity: 'error' | 'warning' | 'info';
  message: string;
  code?: string;
}

const SYNTAX_CHECK_TIMEOUT_MS = 5000;

function createTempFile(source: string, extension: string): string {
  const tmpDir = os.tmpdir();
  const filename = `syntax_check_${Date.now()}.${extension}`;
  const filepath = path.join(tmpDir, filename);
  fs.writeFileSync(filepath, source, 'utf-8');
  return filepath;
}

function cleanupTempFile(filepath: string): void {
  try {
    if (fs.existsSync(filepath)) {
      fs.unlinkSync(filepath);
    }
  } catch {
    // ignore cleanup errors
  }
}

function parseGccOutput(output: string): SyntaxError[] {
  const errors: SyntaxError[] = [];
  // GCC format: file:line:column: message
  // GCC format: file:line:column: error: message
  // GCC format: file:line:column: fatal error: message
  // GCC format: file:line:column: fatal warning: message
  // GCC format: file:line:column: note: message
  const gccRegex = /^.+:(\d+):(\d+):\s*(?:fatal\s+)?(error|warning|note):\s*(.+)$/gm;
  let match;
  while ((match = gccRegex.exec(output)) !== null) {
    const line = parseInt(match[1], 10);
    const column = parseInt(match[2], 10);
    const severity = match[3] as 'error' | 'warning' | 'info';
    const message = match[4].trim();

    errors.push({
      line,
      column: column > 0 ? column : 1,
      endLine: line,
      endColumn: column + 1,
      severity: severity === 'error' ? 'error' : severity === 'warning' ? 'warning' : 'info',
      message,
    });
  }
  return errors;
}

function parseJavaOutput(output: string): SyntaxError[] {
  const errors: SyntaxError[] = [];
  // Java compiler format: file.java:line: column: message
  const javaRegex = /^.+[/\\](\w+\.java):(\d+):\s*(.+)$/gm;
  let match;
  while ((match = javaRegex.exec(output)) !== null) {
    const line = parseInt(match[2], 10);
    const msg = match[3].trim();

    let column = 1;
    const colMatch = msg.match(/column\s*(\d+)/i);
    if (colMatch) column = parseInt(colMatch[1], 10);

    let severity: 'error' | 'warning' | 'info' = 'error';
    if (msg.toLowerCase().includes('warning')) severity = 'warning';
    else if (msg.toLowerCase().includes('note')) severity = 'info';

    errors.push({
      line,
      column,
      endLine: line,
      endColumn: column + 1,
      severity,
      message: msg.replace(/\b(error|warning|note):\s*/gi, '').trim(),
    });
  }
  return errors;
}

function parsePythonOutput(output: string): SyntaxError[] {
  const errors: SyntaxError[] = [];

  // Format 1: "Sorry: ErrorType: message (file.py, line N)"
  // e.g. "Sorry: IndentationError: unindent does not match... (test.py, line 3)"
  const sorryMatch = output.match(/^Sorry:\s*(\w+Error):\s*(.+?)\s*\(([^,]+),\s*line\s*(\d+)\)/i);
  if (sorryMatch) {
    const [, errorType, message, , lineStr] = sorryMatch;
    errors.push({
      line: parseInt(lineStr, 10),
      column: 1,
      endLine: parseInt(lineStr, 10),
      endColumn: 1000,
      severity: 'error',
      message: `${errorType}: ${message}`,
    });
    return errors;
  }

  // Format 2: standard Python traceback "  File "file.py", line N"
  // or "(file.py)" style
  const lines = output.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Match:   File "file.py", line N
    const fileMatch = line.match(/File\s+"?([^":]+)"?,\s*line\s+(\d+)/i);
    if (fileMatch) {
      const lineNum = parseInt(fileMatch[2], 10);
      let message = '';
      let severity: 'error' | 'warning' | 'info' = 'error';

      for (let j = i + 1; j < Math.min(i + 5, lines.length); j++) {
        const msgLine = lines[j].trim();
        if (msgLine) {
          const errMatch = msgLine.match(/^(\w+Error):\s*(.+)/i);
          if (errMatch) {
            message = `${errMatch[1]}: ${errMatch[2]}`;
            break;
          }
        }
      }

      if (!message) {
        const errMatch = output.match(/^(\w+Error):\s*(.+)/im);
        if (errMatch) {
          message = `${errMatch[1]}: ${errMatch[2]}`;
        }
      }

      if (message) {
        errors.push({
          line: lineNum,
          column: 1,
          endLine: lineNum,
          endColumn: 1000,
          severity,
          message,
        });
      }
    }
  }

  // Format 3: inline "ErrorType: message" without file context
  if (errors.length === 0) {
    const inlineMatch = output.match(/^(\w+Error):\s*(.+)/im);
    if (inlineMatch) {
      const lineMatch = output.match(/line\s*(\d+)/i);
      errors.push({
        line: lineMatch ? parseInt(lineMatch[1], 10) : 1,
        column: 1,
        endLine: lineMatch ? parseInt(lineMatch[1], 10) : 1,
        endColumn: 1000,
        severity: 'error',
        message: `${inlineMatch[1]}: ${inlineMatch[2]}`,
      });
    }
  }

  return errors;
}

async function checkPython(source: string): Promise<SyntaxError[]> {
  const filepath = createTempFile(source, 'py');
  console.log('[syntax-check] checkPython - source:', JSON.stringify(source), 'filepath:', filepath);
  try {
    const result = execSync(`python3 -m py_compile "${filepath}"`, {
      timeout: SYNTAX_CHECK_TIMEOUT_MS,
      encoding: 'utf-8',
    });
    console.log('[syntax-check] checkPython - no error, stdout:', JSON.stringify(result));
    return parsePythonOutput(result);
  } catch (err: unknown) {
    const error = err as { stderr?: string; stdout?: string; status?: number; message?: string };
    const stderr = error.stderr ?? '';
    const stdout = error.stdout ?? '';
    const output = stderr || stdout;
    console.log('[syntax-check] checkPython - raw output:', JSON.stringify(output), 'status:', error.status, 'message:', error.message);
    console.log('[syntax-check] checkPython - stderr bytes:', stderr.length, 'stdout bytes:', stdout.length);
    const errors = parsePythonOutput(output);
    console.log('[syntax-check] checkPython - parsed errors:', JSON.stringify(errors));
    return errors;
  } finally {
    cleanupTempFile(filepath);
  }
}

async function checkC(source: string): Promise<SyntaxError[]> {
  const filepath = createTempFile(source, 'c');
  try {
    const result = execSync(`gcc -fsyntax-only -Wall -Wextra -std=c17 -x c "${filepath}" 2>&1`, {
      timeout: SYNTAX_CHECK_TIMEOUT_MS,
      encoding: 'utf-8',
    });
    console.log('[syntax-check] checkC - no error, stdout:', JSON.stringify(result));
    return parseGccOutput(result);
  } catch (err: unknown) {
    const error = err as { stderr?: string; stdout?: string; status?: number };
    const stderr = error.stderr ?? '';
    const stdout = error.stdout ?? '';
    const output = stderr || stdout;
    console.log('[syntax-check] checkC - raw output:', JSON.stringify(output), 'status:', error.status, 'stderr len:', stderr.length, 'stdout len:', stdout.length);
    const errors = parseGccOutput(output);
    console.log('[syntax-check] checkC - parsed errors:', JSON.stringify(errors));
    return errors;
  } finally {
    cleanupTempFile(filepath);
  }
}

async function checkCpp(source: string): Promise<SyntaxError[]> {
  const filepath = createTempFile(source, 'cpp');
  try {
    const result = execSync(`g++ -fsyntax-only -Wall -Wextra -std=c++17 -x c++ "${filepath}" 2>&1`, {
      timeout: SYNTAX_CHECK_TIMEOUT_MS,
      encoding: 'utf-8',
    });
    console.log('[syntax-check] checkCpp - no error, stdout:', JSON.stringify(result));
    return parseGccOutput(result);
  } catch (err: unknown) {
    const error = err as { stderr?: string; stdout?: string; status?: number };
    const stderr = error.stderr ?? '';
    const stdout = error.stdout ?? '';
    const output = stderr || stdout;
    console.log('[syntax-check] checkCpp - raw output:', JSON.stringify(output), 'status:', error.status, 'stderr len:', stderr.length, 'stdout len:', stdout.length);
    const errors = parseGccOutput(output);
    console.log('[syntax-check] checkCpp - parsed errors:', JSON.stringify(errors));
    return errors;
  } finally {
    cleanupTempFile(filepath);
  }
}

function extractJavaClassName(source: string): string | null {
  // Match: public class ClassName { or public class ClassName<T> {
  const match = source.match(/\bpublic\s+class\s+(\w[\w]*)\s*[<{]/);
  return match ? match[1] : null;
}

async function checkJava(source: string): Promise<SyntaxError[]> {
  const tmpDir = os.tmpdir();
  const className = extractJavaClassName(source);
  let filepath: string;

  if (className) {
    // Name file after the public class so javac doesn't error "class X should be in file X.java"
    filepath = path.join(tmpDir, `${className}.java`);
  } else {
    filepath = path.join(tmpDir, `syntax_check_${Date.now()}.java`);
  }

  console.log('[syntax-check] checkJava - className:', className, 'filepath:', filepath);
  fs.writeFileSync(filepath, source, 'utf-8');

  try {
    const result = execSync(`javac -Xdiags:verbose "${filepath}" 2>&1`, {
      timeout: SYNTAX_CHECK_TIMEOUT_MS,
      encoding: 'utf-8',
    });
    console.log('[syntax-check] checkJava - no-error stdout:', JSON.stringify(result));
    return parseJavaOutput(result);
  } catch (err: unknown) {
    const error = err as { stderr?: string; stdout?: string; status?: number; code?: string };
    const stderr = error.stderr ?? '';
    const stdout = error.stdout ?? '';
    const output = stderr || stdout;
    console.log('[syntax-check] checkJava - raw output:', JSON.stringify(output), 'status:', error.status, 'code:', error.code, 'stderr len:', stderr.length, 'stdout len:', stdout.length);
    const errors = parseJavaOutput(output);
    console.log('[syntax-check] checkJava - parsed errors:', JSON.stringify(errors));
    return errors;
  } finally {
    cleanupTempFile(filepath);
  }
}

async function checkCSharp(source: string): Promise<SyntaxError[]> {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'csharp-syntax-'));
  const filepath = path.join(tmpDir, 'Program.cs');
  const projectPath = path.join(tmpDir, 'SyntaxCheck.csproj');
  console.log('[syntax-check] checkCSharp - tmpDir:', tmpDir);

  try {
    const projectContent = `<Project Sdk="Microsoft.NET.Sdk">
  <PropertyGroup>
    <OutputType>Exe</OutputType>
    <TargetFramework>net8.0</TargetFramework>
    <ImplicitUsings>enable</ImplicitUsings>
    <Nullable>enable</Nullable>
  </PropertyGroup>
</Project>`;
    fs.writeFileSync(projectPath, projectContent, 'utf-8');
    fs.writeFileSync(filepath, source, 'utf-8');

    // Restore and build in one command (restore runs fast when packages are cached)
    const result = execSync(`cd "${tmpDir}" && dotnet build 2>&1 || true`, {
      timeout: SYNTAX_CHECK_TIMEOUT_MS,
      encoding: 'utf-8',
    });

    console.log('[syntax-check] checkCSharp - raw stdout:', JSON.stringify(result));
    return parseDotnetOutput(result);
  } catch (err: unknown) {
    const error = err as { stderr?: string; stdout?: string; status?: number };
    const stderr = error.stderr ?? '';
    const stdout = error.stdout ?? '';
    const output = stderr || stdout;
    console.log('[syntax-check] checkCSharp - raw output:', JSON.stringify(output), 'status:', error.status, 'stderr len:', stderr.length, 'stdout len:', stdout.length);
    const errors = parseDotnetOutput(output);
    console.log('[syntax-check] checkCSharp - parsed errors:', JSON.stringify(errors));
    return errors;
  } finally {
    try {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    } catch {
      // ignore
    }
  }
}

function parseDotnetOutput(output: string): SyntaxError[] {
  const errors: SyntaxError[] = [];
  // dotnet format: file(N,col): error CSxxxx: message
  // dotnet format: file(N,N): error CSxxxx: message
  const dotnetRegex = /^.+[/\\](\w+\.cs)\((\d+),(\d+)\):\s*(error|warning)\s+(CS\d+):\s*(.+)$/gm;
  const seen = new Set<string>();
  let match;
  while ((match = dotnetRegex.exec(output)) !== null) {
    const line = parseInt(match[2], 10);
    const column = parseInt(match[3], 10);
    const severity = match[4] as 'error' | 'warning';
    const code = match[5];
    const message = match[6].trim();

    const key = `${line}:${column}:${code}:${message}`;
    if (seen.has(key)) continue;
    seen.add(key);

    errors.push({
      line,
      column: column > 0 ? column : 1,
      endLine: line,
      endColumn: column + 1,
      severity,
      message: `${code}: ${message}`,
      code,
    });
  }
  return errors;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { source, languageId } = body as { source: string; languageId: string };

    console.log('[syntax-check] POST - languageId:', JSON.stringify(languageId), 'source len:', source?.length);

    if (!source || typeof source !== 'string') {
      return NextResponse.json(
        { error: 'Missing or invalid source code' },
        { status: 400 }
      );
    }

    if (!languageId || typeof languageId !== 'string') {
      return NextResponse.json(
        { error: 'Missing or invalid languageId' },
        { status: 400 }
      );
    }

    const lang = languageId.toLowerCase();
    let errors: SyntaxError[] = [];

    switch (lang) {
      case 'python':
        errors = await checkPython(source);
        break;
      case 'c':
      case 'nc':
        errors = await checkC(source);
        break;
      case 'cpp':
      case 'ncpp':
      case 'c++':
        errors = await checkCpp(source);
        break;
      case 'java':
        errors = await checkJava(source);
        break;
      case 'csharp':
      case 'c#':
        errors = await checkCSharp(source);
        break;
      default:
        return NextResponse.json(
          { error: `Unsupported language: ${languageId}`, supportedLanguages: ['python', 'c', 'cpp', 'c++', 'java', 'csharp'] },
          { status: 400 }
        );
    }

    console.log('[syntax-check] lang:', lang, 'source:', JSON.stringify(source), 'errors:', JSON.stringify(errors));
    return NextResponse.json({ errors });
  } catch (err: unknown) {
    console.error('[syntax-check] Unexpected error:', err);
    const error = err as { message?: string };
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

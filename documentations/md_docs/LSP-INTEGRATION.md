# LSP Integration Guide

## Mục lục

1. [Tổng quan kiến trúc](#tổng-quan-kiến-trúc)
2. [Kết nối WebSocket (Khuyến nghị)](#kết-nối-websocket-khuyến-nghị)
3. [REST API](#rest-api)
4. [Tích hợp Monaco Editor](#tích-hợp-monaco-editor)
5. [API Endpoints Reference](#api-endpoints-reference)
6. [WebSocket Events Reference](#websocket-events-reference)
7. [Troubleshooting](#troubleshooting)

---

## Tổng quan kiến trúc

```
┌─────────────┐     ┌───────────────┐     ┌─────────────────────────┐
│   Frontend  │────▶│  API Gateway  │────▶│  LSP Service (NestJS)   │
│   Monaco    │     │               │     │                         │
│   Editor    │◀────│               │◀────│  ┌─────────────────┐   │
└─────────────┘     └───────────────┘     │  │ Language Servers │   │
        │                                   │  ├─────────────────┤   │
        │ WebSocket / HTTP                  │  │ • Python (pylsp)│   │
        │                                   │  │ • Java (JDT LS) │   │
        │                                   │  │ • C/C++ (clangd)│   │
        │                                   │  │ • C# (OmniSharp)│   │
        │                                   │  └─────────────────┘   │
        │                                   └─────────────────────────┘
```

### Supported Languages

| Ngôn ngữ | Language ID | LSP Server | Cài đặt |
|----------|-------------|------------|----------|
| Python | `python` | pylsp/pyright | pip install python-language-server |
| Java | `java` | Eclipse JDT LS | Tự động trong Docker |
| C/C++ | `c`, `cpp`, `c++` | clangd | apt install clangd |
| C# | `csharp`, `c#` | OmniSharp | dotnet tool install omnisharp |

---

## Kết nối WebSocket (Khuyến nghị)

WebSocket là phương thức được khuyến nghị vì:
- Real-time response cho completions
- Lower latency
- Server push notifications (diagnostics)

### 1. Kết nối cơ bản

```typescript
// lsp-client.ts
import { io, Socket } from 'socket.io-client';

interface LspClientOptions {
  url: string;
  languageId: string;
  uri?: string;
}

class LspClient {
  private socket: Socket | null = null;
  private options: LspClientOptions;
  private pendingRequests = new Map<string, Function>();

  constructor(options: LspClientOptions) {
    this.options = options;
  }

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      // Qua API Gateway
      this.socket = io(`${this.options.url}/lsp`, {
        transports: ['websocket'],
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 5,
      });

      this.socket.on('connect', () => {
        console.log('[LSP] Connected');

        // Initialize session
        this.socket?.emit('initialize', {
          languageId: this.options.languageId,
          uri: this.options.uri || `file:///tmp/untitled.${this.getExtension()}`,
        });
      });

      this.socket.on('initialized', (data) => {
        console.log('[LSP] Initialized:', data);
        resolve();
      });

      this.socket.on('error', (error) => {
        console.error('[LSP] Error:', error);
        reject(error);
      });

      // Handle diagnostics from server
      this.socket.on('textDocument/publishDiagnostics', (data) => {
        console.log('[LSP] Diagnostics:', data);
        this.handleDiagnostics(data);
      });
    });
  }

  private getExtension(): string {
    const extMap: Record<string, string> = {
      python: 'py',
      java: 'java',
      cpp: 'cpp',
      csharp: 'cs',
    };
    return extMap[this.options.languageId] || 'txt';
  }

  private handleDiagnostics(params: any): void {
    // Emit event for Monaco to show squiggles
    const event = new CustomEvent('lsp-diagnostics', {
      detail: params
    });
    window.dispatchEvent(event);
  }

  openDocument(text: string): Promise<void> {
    return this.emitAsync('open', {
      uri: this.options.uri,
      languageId: this.options.languageId,
      text,
    });
  }

  changeDocument(changes: Array<{ text: string; range?: unknown }>): Promise<void> {
    return this.emitAsync('change', { changes });
  }

  closeDocument(): Promise<void> {
    return this.emitAsync('close', {});
  }

  async getCompletions(
    position: { line: number; character: number },
    triggerKind = 1,
    triggerCharacter?: string
  ): Promise<any> {
    const response = await this.emitAsync('completion', {
      position,
      triggerKind,
      triggerCharacter,
    });

    return response.data?.completions || { items: [] };
  }

  async getHover(
    position: { line: number; character: number }
  ): Promise<any> {
    const response = await this.emitAsync('hover', { position });
    return response.data?.hover;
  }

  async getDefinition(
    position: { line: number; character: number }
  ): Promise<any> {
    const response = await this.emitAsync('definition', { position });
    return response.data?.definition;
  }

  async getReferences(
    position: { line: number; character: number },
    includeDeclaration = true
  ): Promise<any> {
    const response = await this.emitAsync('references', {
      position,
      includeDeclaration,
    });
    return response.data?.references;
  }

  async formatDocument(
    options = { tabSize: 2, insertSpaces: true }
  ): Promise<any> {
    const response = await this.emitAsync('format', { options });
    return response.data?.edits;
  }

  private emitAsync(event: string, data: unknown): Promise<any> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error(`Timeout waiting for ${event} response`));
      }, 30000);

      this.socket?.emit(event, data, (response: any) => {
        clearTimeout(timeout);
        resolve(response);
      });
    });
  }

  disconnect(): void {
    this.socket?.disconnect();
    this.socket = null;
  }

  on(event: string, callback: Function): void {
    this.socket?.on(event, callback);
  }

  off(event: string, callback?: Function): void {
    if (callback) {
      this.socket?.off(event, callback as any);
    } else {
      this.socket?.off(event);
    }
  }
}

export { LspClient };
```

### 2. Sử dụng với Monaco Editor

```typescript
// monaco-lsp.ts
import * as monaco from 'monaco-editor';
import { LspClient } from './lsp-client';

interface MonacoLspOptions {
  editor: monaco.editor.IStandaloneCodeEditor;
  languageId: string;
  apiUrl: string;
  documentUri?: string;
}

class MonacoLspIntegration {
  private client: LspClient;
  private editor: monaco.editor.IStandaloneCodeEditor;
  private disposables: monaco.IDisposable[] = [];

  constructor(options: MonacoLspOptions) {
    this.editor = options.editor;
    this.client = new LspClient({
      url: options.apiUrl,
      languageId: options.languageId,
      uri: options.documentUri || `file:///tmp/untitled.${this.getExtension(options.languageId)}`,
    });
  }

  private getExtension(langId: string): string {
    const map: Record<string, string> = {
      python: 'py',
      java: 'java',
      cpp: 'cpp',
      csharp: 'cs',
    };
    return map[langId] || 'txt';
  }

  async initialize(): Promise<void> {
    await this.client.connect();
    await this.client.openDocument(this.editor.getValue());

    this.setupCompletionProvider();
    this.setupHoverProvider();
    this.setupDefinitionProvider();
    this.setupReferenceProvider();
    this.setupChangeListener();
    this.setupDiagnosticsListener();
  }

  private setupCompletionProvider(): void {
    const provider: monaco.languages.CompletionItemProvider = {
      triggerCharacters: ['.', '(', ',', "'", '"', '/', '@', '#'],

      provideCompletionItems: async (model, position) => {
        try {
          const result = await this.client.getCompletions({
            line: position.lineNumber - 1,
            character: position.column - 1,
          }, 2); // 2 = TriggerCharacter

          return {
            suggestions: result.items.map((item: any) => this.mapCompletionItem(item)),
            incomplete: result.isIncomplete || false,
          };
        } catch (error) {
          console.error('Completion error:', error);
          return { suggestions: [], incomplete: false };
        }
      },

      resolveCompletionItem: async (item) => {
        try {
          const resolved = await this.client.getCompletionItemResolve(item);
          return { ...item, ...resolved } as monaco.languages.CompletionItem;
        } catch {
          return item;
        }
      },
    };

    const languageId = this.getLanguageId();
    this.disposables.push(
      monaco.languages.registerCompletionItemProvider(languageId, provider)
    );
  }

  private mapCompletionItem(item: any): monaco.languages.CompletionItem {
    const kindMap: Record<number, monaco.languages.CompletionItemKind> = {
      1: monaco.languages.CompletionItemKind.Text,
      2: monaco.languages.CompletionItemKind.Method,
      3: monaco.languages.CompletionItemKind.Function,
      4: monaco.languages.CompletionItemKind.Constructor,
      5: monaco.languages.CompletionItemKind.Field,
      6: monaco.languages.CompletionItemKind.Variable,
      7: monaco.languages.CompletionItemKind.Class,
      8: monaco.languages.CompletionItemKind.Interface,
      9: monaco.languages.CompletionItemKind.Module,
      10: monaco.languages.CompletionItemKind.Property,
      11: monaco.languages.CompletionItemKind.Unit,
      12: monaco.languages.CompletionItemKind.Value,
      13: monaco.languages.CompletionItemKind.Enum,
      14: monaco.languages.CompletionItemKind.Keyword,
      15: monaco.languages.CompletionItemKind.Snippet,
      16: monaco.languages.CompletionItemKind.Color,
      17: monaco.languages.CompletionItemKind.File,
      18: monaco.languages.CompletionItemKind.Reference,
      19: monaco.languages.CompletionItemKind.Folder,
      20: monaco.languages.CompletionItemKind.EnumMember,
      21: monaco.languages.CompletionItemKind.Constant,
      22: monaco.languages.CompletionItemKind.Struct,
      23: monaco.languages.CompletionItemKind.Event,
      24: monaco.languages.CompletionItemKind.Operator,
      25: monaco.languages.CompletionItemKind.TypeParameter,
    };

    return {
      label: item.label,
      kind: item.kind ? kindMap[item.kind] || monaco.languages.CompletionItemKind.Text : monaco.languages.CompletionItemKind.Text,
      detail: item.detail,
      documentation: item.documentation,
      insertText: item.insertText || item.label,
      insertTextRules: item.insertTextFormat === 2
        ? monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet
        : undefined,
      range: item.textEdit?.range,
      sortText: item.sortText,
      filterText: item.filterText,
      commitCharacters: item.commitCharacters,
    };
  }

  private setupHoverProvider(): void {
    const provider: monaco.languages.HoverProvider = {
      provideHover: async (model, position) => {
        try {
          const result = await this.client.getHover({
            line: position.lineNumber - 1,
            character: position.column - 1,
          });

          if (!result || !result.contents) return null;

          const contents = result.contents;
          if (typeof contents === 'string') {
            return { contents: new monaco.MarkdownString(contents) };
          }
          if (Array.isArray(contents)) {
            return {
              contents: contents.map(c =>
                typeof c === 'string'
                  ? new monaco.MarkdownString(c)
                  : new monaco.MarkdownString(c.value)
              ),
            };
          }
          return {
            contents: new monaco.MarkdownString(contents.value || ''),
          };
        } catch (error) {
          console.error('Hover error:', error);
          return null;
        }
      },
    };

    this.disposables.push(
      monaco.languages.registerHoverProvider(this.getLanguageId(), provider)
    );
  }

  private setupDefinitionProvider(): void {
    const provider: monaco.languages.DefinitionProvider = {
      provideDefinition: async (model, position) => {
        try {
          const result = await this.client.getDefinition({
            line: position.lineNumber - 1,
            character: position.column - 1,
          });

          if (!result) return null;

          // Map LSP location to Monaco locations
          return this.mapLocations(result);
        } catch (error) {
          console.error('Definition error:', error);
          return null;
        }
      },
    };

    this.disposables.push(
      monaco.languages.registerDefinitionProvider(this.getLanguageId(), provider)
    );
  }

  private setupReferenceProvider(): void {
    const provider: monaco.languages.ReferenceProvider = {
      provideReferences: async (model, position, context) => {
        try {
          const result = await this.client.getReferences({
            line: position.lineNumber - 1,
            character: position.column - 1,
            includeDeclaration: context.includeDeclaration,
          });

          if (!result) return [];
          return this.mapLocations(result);
        } catch (error) {
          console.error('References error:', error);
          return [];
        }
      },
    };

    this.disposables.push(
      monaco.languages.registerReferenceProvider(this.getLanguageId(), provider)
    );
  }

  private mapLocations(locations: any): monaco.languages.Location[] {
    if (!locations) return [];
    if (!Array.isArray(locations)) locations = [locations];

    return locations.map((loc: any) => {
      const uri = loc.uri || loc.targetUri;
      const range = loc.range || loc.targetRange;

      if (!range) return null;

      return {
        uri: monaco.Uri.parse(uri),
        range: {
          startLineNumber: range.start.line + 1,
          startColumn: range.start.character + 1,
          endLineNumber: range.end.line + 1,
          endColumn: range.end.character + 1,
        },
      };
    }).filter(Boolean) as monaco.languages.Location[];
  }

  private setupChangeListener(): void {
    let version = 1;
    let updateTimeout: NodeJS.Timeout | null = null;

    this.disposables.push(
      this.editor.onDidChangeModelContent(() => {
        version++;

        // Debounce changes to reduce network traffic
        if (updateTimeout) {
          clearTimeout(updateTimeout);
        }

        updateTimeout = setTimeout(async () => {
          try {
            await this.client.changeDocument([{ text: this.editor.getValue() }], version);
          } catch (error) {
            console.error('Change document error:', error);
          }
        }, 300);
      })
    );
  }

  private setupDiagnosticsListener(): void {
    const handleDiagnostics = (event: CustomEvent) => {
      const { diagnostics, uri } = event.detail;

      if (!diagnostics || !Array.isArray(diagnostics)) return;

      const model = this.editor.getModel();
      if (!model) return;

      const markers: monaco.editor.IMarkerData[] = diagnostics.map((d: any) => ({
        severity: this.mapSeverity(d.severity),
        startLineNumber: d.range.start.line + 1,
        startColumn: d.range.start.character + 1,
        endLineNumber: d.range.end.line + 1,
        endColumn: d.range.end.character + 1,
        message: d.message,
        source: d.source,
        code: d.code,
      }));

      monaco.editor.setModelMarkers(model, 'lsp', markers);
    };

    window.addEventListener('lsp-diagnostics', handleDiagnostics as EventListener);
    this.disposables.push({
      dispose: () => window.removeEventListener('lsp-diagnostics', handleDiagnostics as EventListener),
    });
  }

  private mapSeverity(severity: number): monaco.MarkerSeverity {
    const map: Record<number, monaco.MarkerSeverity> = {
      1: monaco.MarkerSeverity.Hint,
      2: monaco.MarkerSeverity.Info,
      3: monaco.MarkerSeverity.Warning,
      4: monaco.MarkerSeverity.Error,
    };
    return map[severity] || monaco.MarkerSeverity.Info;
  }

  private getLanguageId(): string {
    const langMap: Record<string, string> = {
      python: 'python',
      java: 'java',
      cpp: 'cpp',
      csharp: 'csharp',
    };
    return langMap[this.client['options'].languageId] || 'plaintext';
  }

  async formatDocument(): Promise<void> {
    try {
      const edits = await this.client.formatDocument({ tabSize: 2, insertSpaces: true });

      if (!edits || !Array.isArray(edits)) return;

      const model = this.editor.getModel();
      if (!model) return;

      const validEdits = edits
        .map((edit: any) => ({
          range: {
            startLineNumber: edit.range.start.line + 1,
            startColumn: edit.range.start.character + 1,
            endLineNumber: edit.range.end.line + 1,
            endColumn: edit.range.end.character + 1,
          },
          text: edit.newText,
        }))
        .filter((edit: any) => edit.range.startLineNumber > 0);

      model.pushEditOperations([], validEdits, () => null);
    } catch (error) {
      console.error('Format error:', error);
    }
  }

  dispose(): void {
    this.disposables.forEach(d => d.dispose());
    this.client.closeDocument();
    this.client.disconnect();
  }
}

export { MonacoLspIntegration };
```

### 3. Ví dụ sử dụng trong React

```tsx
// components/CodeEditor.tsx
import React, { useEffect, useRef, useState } from 'react';
import * as monaco from 'monaco-editor';
import { MonacoLspIntegration } from './monaco-lsp';

interface CodeEditorProps {
  languageId: string;
  initialCode?: string;
  onCodeChange?: (code: string) => void;
}

export const CodeEditor: React.FC<CodeEditorProps> = ({
  languageId,
  initialCode = '',
  onCodeChange,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const lspRef = useRef<MonacoLspIntegration | null>(null);
  const [isLspReady, setIsLspReady] = useState(false);
  const [lspError, setLspError] = useState<string | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Initialize Monaco Editor
    const editor = monaco.editor.create(containerRef.current, {
      value: initialCode,
      language: mapLanguage(languageId),
      theme: 'vs-dark',
      automaticLayout: true,
      minimap: { enabled: true },
      fontSize: 14,
      lineNumbers: 'on',
      renderWhitespace: 'selection',
      tabSize: 2,
      insertSpaces: true,
      wordWrap: 'on',
    });

    editorRef.current = editor;

    // Initialize LSP integration
    const lsp = new MonacoLspIntegration({
      editor,
      languageId,
      apiUrl: import.meta.env.VITE_API_URL || 'http://localhost:5000',
    });

    lspRef.current = lsp;

    lsp.initialize()
      .then(() => {
        setIsLspReady(true);
        console.log(`[LSP] ${languageId} language server ready`);
      })
      .catch((error) => {
        console.error('[LSP] Failed to initialize:', error);
        setLspError(`Failed to connect to ${languageId} language server`);
      });

    // Handle code changes
    editor.onDidChangeModelContent(() => {
      onCodeChange?.(editor.getValue());
    });

    // Format on save (Ctrl+Shift+F)
    editor.addCommand(
      monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyF,
      () => lsp.formatDocument()
    );

    return () => {
      lsp.dispose();
      editor.dispose();
    };
  }, [languageId]);

  return (
    <div className="code-editor-container">
      <div className="editor-toolbar">
        <span className="language-badge">{languageId}</span>
        {isLspReady && (
          <span className="lsp-status lsp-ready">
            <span className="status-dot"></span>
            LSP Ready
          </span>
        )}
        {lspError && (
          <span className="lsp-status lsp-error" title={lspError}>
            <span className="status-dot"></span>
            LSP Error
          </span>
        )}
      </div>
      <div ref={containerRef} className="editor-wrapper" />
    </div>
  );
};

function mapLanguage(langId: string): string {
  const map: Record<string, string> = {
    python: 'python',
    java: 'java',
    cpp: 'cpp',
    csharp: 'csharp',
    javascript: 'javascript',
    typescript: 'typescript',
  };
  return map[langId] || 'plaintext';
}
```

---

## REST API

Nếu không sử dụng WebSocket, có thể dùng REST API:

### Base URL
```
http://localhost:5000/api/lsp
```

### 1. Lấy trạng thái servers

```bash
GET /api/lsp/status
```

```json
{
  "success": true,
  "servers": [
    {
      "name": "python",
      "isRunning": true,
      "isInitialized": true,
      "serverInfo": { "name": "pylsp", "version": "1.7.0" }
    },
    {
      "name": "java",
      "isRunning": false,
      "isInitialized": false
    }
  ]
}
```

### 2. Mở document

```bash
POST /api/lsp/documents
Content-Type: application/json

{
  "uri": "file:///tmp/test.py",
  "languageId": "python",
  "text": "print('Hello')"
}
```

### 3. Cập nhật document

```bash
PUT /api/lsp/documents
Content-Type: application/json

{
  "uri": "file:///tmp/test.py",
  "version": 2,
  "changes": [{ "text": "print('Hello World')" }]
}
```

### 4. Completions

```bash
POST /api/lsp/completions
Content-Type: application/json

{
  "languageId": "python",
  "uri": "file:///tmp/test.py",
  "position": { "line": 0, "character": 5 },
  "triggerKind": 2,
  "triggerCharacter": "."
}
```

### 5. Hover

```bash
POST /api/lsp/hover
Content-Type: application/json

{
  "languageId": "python",
  "uri": "file:///tmp/test.py",
  "position": { "line": 0, "character": 0 }
}
```

### 6. Format Document

```bash
POST /api/lsp/format
Content-Type: application/json

{
  "languageId": "python",
  "uri": "file:///tmp/test.py",
  "options": {
    "tabSize": 4,
    "insertSpaces": true
  }
}
```

---

## API Endpoints Reference

### REST Endpoints

| Method | Endpoint | Mô tả |
|--------|----------|--------|
| GET | `/api/lsp/status` | Lấy trạng thái tất cả LSP servers |
| POST | `/api/lsp/documents` | Mở một document |
| PUT | `/api/lsp/documents` | Cập nhật nội dung document |
| DELETE | `/api/lsp/documents/:uri` | Đóng document |
| POST | `/api/lsp/completions` | Lấy danh sách gợi ý completions |
| POST | `/api/lsp/completions/resolve` | Resolve completion item details |
| POST | `/api/lsp/hover` | Lấy thông tin hover |
| POST | `/api/lsp/definition` | Go to definition |
| POST | `/api/lsp/references` | Tìm tất cả references |
| POST | `/api/lsp/format` | Format document |
| POST | `/api/lsp/servers/:languageId/restart` | Restart một LSP server |

---

## WebSocket Events Reference

### Client → Server

| Event | Payload | Mô tả |
|-------|---------|--------|
| `initialize` | `{ languageId, uri }` | Khởi tạo session |
| `open` | `{ uri, languageId, text }` | Mở document |
| `change` | `{ changes }` | Cập nhật nội dung |
| `close` | `{}` | Đóng document |
| `completion` | `{ position, triggerKind?, triggerCharacter? }` | Yêu cầu completions |
| `hover` | `{ position }` | Yêu cầu hover info |
| `definition` | `{ position }` | Yêu cầu definition |
| `references` | `{ position, includeDeclaration? }` | Tìm references |
| `format` | `{ options? }` | Format document |
| `ping` | `{}` | Ping server |

### Server → Client

| Event | Payload | Mô tả |
|-------|---------|--------|
| `initialized` | `{ success, message }` | Session đã khởi tạo |
| `opened` | `{ success, message }` | Document đã mở |
| `changed` | `{ success, newVersion }` | Document đã cập nhật |
| `closed` | `{ success, message }` | Document đã đóng |
| `completion` | `{ success, completions?, error? }` | Kết quả completions |
| `hover` | `{ success, hover?, error? }` | Kết quả hover |
| `definition` | `{ success, definition?, error? }` | Kết quả definition |
| `references` | `{ success, references?, error? }` | Kết quả references |
| `format` | `{ success, edits?, error? }` | Kết quả format |
| `pong` | `{ success }` | Pong response |
| `error` | `{ success: false, error }` | Lỗi |
| `textDocument/publishDiagnostics` | `{ uri, diagnostics }` | Diagnostics notifications |

---

## Troubleshooting

### 1. Monaco không hiển thị completions

**Nguyên nhân thường gặp:**
- LSP server chưa khởi động
- Kết nối WebSocket thất bại
- Document chưa được mở

**Kiểm tra:**
```typescript
// Kiểm tra LSP status
const status = await fetch('http://localhost:5000/api/lsp/status');
const data = await status.json();
console.log('LSP Status:', data);
```

### 2. Completions chậm

**Giải pháp:**
- Tăng debounce cho change listener
- Bật incremental sync thay vì full sync

### 3. Hover/Definition không hoạt động

**Kiểm tra:**
1. Server có đang chạy: `GET /api/lsp/status`
2. Document đã được mở chưa
3. Position có đúng format không (0-indexed)

### 4. Lỗi CORS

**Cấu hình API Gateway:**
```nginx
# nginx.conf
location /lsp/ {
  proxy_pass http://lsp-service:5000;
  proxy_http_version 1.1;
  proxy_set_header Upgrade $http_upgrade;
  proxy_set_header Connection "upgrade";
  proxy_set_header Host $host;
  proxy_set_header X-Real-IP $remote_addr;
}
```

### 5. Debug LSP Communication

**Bật debug mode:**
```typescript
const lspClient = new LspClient({
  url: 'http://localhost:5000',
  languageId: 'python',
  debug: true, // Enable debug logging
});
```

### 6. Health Check

```bash
# Kiểm tra LSP service
curl http://localhost:5000/api/lsp/status

# Kiểm tra container logs
docker logs code-runner-api | grep LSP
```

---

## Cấu hình môi trường

### Docker Environment Variables

```yaml
# docker-compose.yml
services:
  code-runner:
    environment:
      - LSP_PYTHON_ENABLED=true
      - LSP_JAVA_ENABLED=true
      - LSP_CPP_ENABLED=true
      - LSP_CSHARP_ENABLED=true
      - JDTLS_PATH=/usr/local/lsp/jdtls/bin/jdtls
      - CLANGD_PATH=/usr/bin/clangd
      - OMNISHARP_PATH=/root/.dotnet/tools/omnisharp
```

### API Gateway Configuration

```typescript
// Ví dụ cho Express API Gateway
app.use('/lsp', createProxyMiddleware({
  target: 'http://lsp-service:5000',
  changeOrigin: true,
  ws: true, // Enable WebSocket proxying
}));
```

---

## Performance Tips

1. **Debounce document changes**: 300-500ms
2. **Chỉ gửi incremental changes**: Thay vì full document
3. **Cache completion items**: Với debounce nhỏ
4. **Lazy load LSP**: Chỉ khởi tạo khi user bắt đầu gõ
5. **Pre-warm servers**: Khởi động servers khi app load

---

## License

Document này là một phần của Code Runner project.

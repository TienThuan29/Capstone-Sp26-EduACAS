'use client';

import { useCallback, useRef, useState } from 'react';
import { JAVA_API_COMPLETIONS } from './java.lsp';
import { C_API_COMPLETIONS } from './c.lsp';
import { CPP_API_COMPLETIONS } from './cpp.lsp';
import { CSHARP_API_COMPLETIONS } from './csharp.lsp';
import { PYTHON_API_COMPLETIONS } from './python.lsp';
import { TYPESCRIPT_API_COMPLETIONS } from './typescript.lsp';
import { JAVASCRIPT_API_COMPLETIONS } from './javascript.lsp';

// Re-export shared types from the dedicated types module
export type { LspCompletionItem, LspCompletionResult, LspHoverResult } from './types';
export { MonacoKind } from './types';
import type { LspCompletionItem, LspCompletionResult, LspHoverResult } from './types';
import { MonacoKind } from './types';

// ─────────────────────────────────────────────────────────────────
// Language completion map
// ─────────────────────────────────────────────────────────────────

/** Map language IDs (lowercase) to their completion items */
const LANGUAGE_COMPLETIONS: Record<string, LspCompletionItem[]> = {
  java: JAVA_API_COMPLETIONS,
  c: C_API_COMPLETIONS,
  cpp: CPP_API_COMPLETIONS,
  csharp: CSHARP_API_COMPLETIONS,
  python: PYTHON_API_COMPLETIONS,
  typescript: TYPESCRIPT_API_COMPLETIONS,
  javascript: JAVASCRIPT_API_COMPLETIONS,
};

/** Languages that use our enhanced completions */
const SUPPORTED_LANGUAGES = new Set(Object.keys(LANGUAGE_COMPLETIONS));

// ─────────────────────────────────────────────────────────────────
// Document parsing utilities
// ─────────────────────────────────────────────────────────────────

/** Extract identifiers from the current document for local completions */
function extractDocumentIdentifiers(code: string, languageId: string): LspCompletionItem[] {
  const identifiers: LspCompletionItem[] = [];
  const seen = new Set<string>();

  const lang = languageId.toLowerCase();

  if (lang === 'java' || lang === 'cpp' || lang === 'csharp' || lang === 'c') {
    // Match variable declarations
    const varPattern = /\b(?:public|private|protected|static|final|abstract|volatile|transient|synchronized)\s+(?:[\w<>\[\],\s]+\s+)?(\w+)\s*(?==|\[|,|;|$|\))/g;

    // Match method names
    const methodPattern = /\b(?:public|private|protected|static|final|abstract|synchronized)\s+(?:[\w<>\[\],\s]+\s+)?(\w+)\s*\(/g;

    let match: RegExpExecArray | null;
    const allPatterns: [RegExp, number][] = [
      [varPattern, MonacoKind.Variable],
      [methodPattern, MonacoKind.Method],
    ];

    for (const [pattern, kind] of allPatterns) {
      pattern.lastIndex = 0;
      while ((match = pattern.exec(code)) !== null) {
        const name = match[1];
        if (!seen.has(name) && isIdentifier(name, lang) && !isKeyword(name, lang)) {
          seen.add(name);
          identifiers.push({
            label: name,
            kind,
            detail: kind === MonacoKind.Method ? `${name}(...)` : name,
          });
        }
      }
    }
  } else if (lang === 'python') {
    // Match Python variable declarations (no type, simple patterns)
    const varPattern = /^([a-zA-Z_][a-zA-Z0-9_]*)\s*=/gm;
    // Match Python function definitions
    const funcPattern = /^def\s+(\w+)\s*\(/gm;

    let match: RegExpExecArray | null;
    const allPatterns: [RegExp, number][] = [
      [varPattern, MonacoKind.Variable],
      [funcPattern, MonacoKind.Function],
    ];

    for (const [pattern, kind] of allPatterns) {
      pattern.lastIndex = 0;
      while ((match = pattern.exec(code)) !== null) {
        const name = match[1];
        if (!seen.has(name) && !PYTHON_KEYWORDS.has(name)) {
          seen.add(name);
          identifiers.push({
            label: name,
            kind,
            detail: kind === MonacoKind.Function ? `def ${name}(...)` : name,
          });
        }
      }
    }
  } else if (lang === 'typescript' || lang === 'javascript') {
    // Match const/let/var declarations
    const varPattern = /\b(?:const|let|var)\s+(\w+)\s*(?==|:|,|;|$|\))/g;
    // Match function declarations
    const funcPattern = /\b(?:function|async\s+function)\s+(\w+)\s*\(/g;
    // Match arrow functions assigned to const
    const arrowPattern = /\b(?:const|let|var)\s+(\w+)\s*=\s*(?:async\s+)?\(/g;

    let match: RegExpExecArray | null;
    const allPatterns: [RegExp, number][] = [
      [varPattern, MonacoKind.Variable],
      [funcPattern, MonacoKind.Function],
      [arrowPattern, MonacoKind.Variable],
    ];

    for (const [pattern, kind] of allPatterns) {
      pattern.lastIndex = 0;
      while ((match = pattern.exec(code)) !== null) {
        const name = match[1];
        if (!seen.has(name) && isIdentifier(name, lang)) {
          seen.add(name);
          identifiers.push({
            label: name,
            kind,
            detail: kind === MonacoKind.Function ? `function ${name}(...)` : name,
          });
        }
      }
    }
  }

  return identifiers;
}

/** Check if a string is a valid identifier */
function isIdentifier(str: string, lang: string): boolean {
  return /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(str) && str.length > 0;
}

/** Java / C / C++ / C# keywords */
function isKeyword(str: string, lang: string): boolean {
  if (lang === 'java') {
    return JAVA_KEYWORDS.has(str);
  }
  if (lang === 'c' || lang === 'cpp') {
    return C_KEYWORDS.has(str);
  }
  if (lang === 'csharp') {
    return CSHARP_KEYWORDS.has(str);
  }
  return false;
}

const JAVA_KEYWORDS = new Set([
  'abstract', 'assert', 'boolean', 'break', 'byte', 'case', 'catch', 'char', 'class', 'const',
  'continue', 'default', 'do', 'double', 'else', 'enum', 'extends', 'final', 'finally', 'float',
  'for', 'goto', 'if', 'implements', 'import', 'instanceof', 'int', 'interface', 'long', 'native',
  'new', 'package', 'private', 'protected', 'public', 'return', 'short', 'static', 'strictfp',
  'super', 'switch', 'synchronized', 'this', 'throw', 'throws', 'transient', 'try', 'void',
  'volatile', 'while', 'true', 'false', 'null', 'var', 'yield', 'record', 'sealed', 'permits',
  'non-sealed', 'open', 'module', 'requires', 'transitive', 'exports', 'opens', 'uses', 'provides',
]);

const C_KEYWORDS = new Set([
  'auto', 'break', 'case', 'char', 'const', 'continue', 'default', 'do', 'double', 'else',
  'enum', 'extern', 'float', 'for', 'goto', 'if', 'inline', 'int', 'long', 'register',
  'restrict', 'return', 'short', 'signed', 'sizeof', 'static', 'struct', 'switch', 'typedef',
  'union', 'unsigned', 'void', 'volatile', 'while', '_Alignas', '_Alignof', '_Atomic',
  '_Bool', '_Complex', '_Generic', '_Imaginary', '_Noreturn', '_Static_assert', '_Thread_local',
  'NULL',
]);

const CSHARP_KEYWORDS = new Set([
  'abstract', 'as', 'base', 'bool', 'break', 'byte', 'case', 'catch', 'char', 'checked',
  'class', 'const', 'continue', 'decimal', 'default', 'delegate', 'do', 'double', 'else',
  'enum', 'event', 'explicit', 'extern', 'false', 'finally', 'fixed', 'float', 'for',
  'foreach', 'goto', 'if', 'implicit', 'in', 'int', 'interface', 'internal', 'is', 'lock',
  'long', 'namespace', 'new', 'null', 'object', 'operator', 'out', 'override', 'params',
  'private', 'protected', 'public', 'readonly', 'ref', 'return', 'sbyte', 'sealed', 'short',
  'sizeof', 'stackalloc', 'static', 'string', 'struct', 'switch', 'this', 'throw', 'true',
  'try', 'typeof', 'uint', 'ulong', 'unchecked', 'unsafe', 'ushort', 'using', 'virtual',
  'void', 'volatile', 'while', 'async', 'await', 'dynamic', 'nameof', 'nameof', 'record',
  'var', 'when', 'with', 'init', 'required', 'file', 'scoped', 'not', 'and', 'or', 'not',
]);

const PYTHON_KEYWORDS = new Set([
  'False', 'None', 'True', 'and', 'as', 'assert', 'async', 'await', 'break', 'class',
  'continue', 'def', 'del', 'elif', 'else', 'except', 'finally', 'for', 'from', 'global',
  'if', 'import', 'in', 'is', 'lambda', 'nonlocal', 'not', 'or', 'pass', 'raise',
  'return', 'try', 'while', 'with', 'yield', '__name__', '__main__', '__import__',
]);

// ─────────────────────────────────────────────────────────────────
// Main hook
// ─────────────────────────────────────────────────────────────────

export function useLspClient(languageId: string) {
  const [status] = useState<'idle' | 'connecting' | 'connected' | 'error'>('idle');
  const [error] = useState<string | null>(null);
  const documentIdentifiersRef = useRef<LspCompletionItem[]>([]);

  const lang = languageId.toLowerCase();
  const isSupported = SUPPORTED_LANGUAGES.has(lang);

  /** Update local identifiers when document changes */
  const openDocument = useCallback(
    async (text: string) => {
      documentIdentifiersRef.current = extractDocumentIdentifiers(text, lang);
    },
    [lang]
  );

  /** Update local identifiers when document changes */
  const changeDocument = useCallback(
    (text: string) => {
      documentIdentifiersRef.current = extractDocumentIdentifiers(text, lang);
    },
    [lang]
  );

  /** Close document and clear local identifiers */
  const closeDocument = useCallback(async () => {
    documentIdentifiersRef.current = [];
  }, []);

  /** Get completions: language API + local document identifiers */
  const getCompletions = useCallback(
    async (
      _position: { line: number; character: number },
      _triggerKind?: number,
      _triggerCharacter?: string
    ): Promise<LspCompletionResult> => {
      const apiCompletions = LANGUAGE_COMPLETIONS[lang] ?? [];
      const localIdentifiers = documentIdentifiersRef.current;
      const allItems = [...apiCompletions, ...localIdentifiers];
      return { items: allItems, isIncomplete: false };
    },
    [lang]
  );

  /** Get hover info — not implemented */
  const getHover = useCallback(
    async (_position: { line: number; character: number }): Promise<LspHoverResult | null> => {
      return null;
    },
    []
  );

  /** Connect — no-op */
  const connect = useCallback(async (_langId: string) => {}, []);

  /** Disconnect — no-op */
  const disconnect = useCallback(() => {}, []);

  return {
    status,
    error,
    client: null,
    isSupported,
    connect,
    disconnect,
    openDocument,
    changeDocument,
    closeDocument,
    getCompletions,
    getHover,
  };
}

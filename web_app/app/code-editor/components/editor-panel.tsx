'use client';

import React, { useCallback, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import { loader } from '@monaco-editor/react';
import type { OnMount, OnChange } from '@monaco-editor/react';
import * as monaco from 'monaco-editor';
import { useEditorContext } from '@/contexts/EditorContext';
import { useCodeFormatter } from '@/hooks/formatter/useCodeFormatter';
import { useLspClient, MonacoKind, type LspCompletionItem } from '@/hooks/lsp/useLspClient';
import { useLocalSyntaxCheck } from '@/hooks/coding/useLocalSyntaxCheck';

// Ensure Monaco loads with correct worker paths so syntax highlighting works (e.g. in Next.js)
loader.config({
  paths: {
    vs: 'https://cdn.jsdelivr.net/npm/monaco-editor@0.52.2/min/vs',
  },
});

// Backend sometimes returns wrong monaco id (e.g. "nc" instead of "c"); map to correct Monaco language IDs
const MONACO_ID_FIXES: Record<string, string> = {
  nc: 'c',
  ncpp: 'cpp',
  'c++': 'cpp',
  cppp: 'cpp',
};

/** Monaco built-in language ids; fall back to language.id if backend monaco value is invalid */
const KNOWN_MONACO_IDS = new Set([
  'c', 'cpp', 'csharp', 'css', 'go', 'html', 'java', 'javascript', 'json',
  'markdown', 'php', 'python', 'r', 'ruby', 'rust', 'sql', 'typescript', 'xml', 'plaintext',
]);

function getMonacoLanguageId(monacoId: string | undefined, languageId: string): string {
  const raw = (monacoId ?? '').toLowerCase().trim();
  const fixed = MONACO_ID_FIXES[raw] ?? raw;
  if (KNOWN_MONACO_IDS.has(fixed)) return fixed;
  const fallback = (languageId || 'plaintext').toLowerCase().trim();
  return KNOWN_MONACO_IDS.has(fallback) ? fallback : 'plaintext';
}

// Dynamic import for Monaco Editor to handle SSR
const MonacoEditor = dynamic(() => import('@monaco-editor/react'), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center bg-gray-900">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-600 border-t-blue-500" />
        <span className="text-sm text-gray-400">Loading Editor...</span>
      </div>
    </div>
  ),
});

/** Map our LspCompletionItem to Monaco CompletionItem */
function mapToMonaco(item: LspCompletionItem): monaco.languages.CompletionItem {
  let range: monaco.IRange | undefined;
  if (item.textEdit?.range?.start && item.textEdit?.range?.end) {
    range = {
      startLineNumber: item.textEdit.range.start.line + 1,
      startColumn: item.textEdit.range.start.character + 1,
      endLineNumber: item.textEdit.range.end.line + 1,
      endColumn: item.textEdit.range.end.character + 1,
    };
  }

  return {
    label: item.label,
    kind: item.kind ? (MonacoKind as Record<number, monaco.languages.CompletionItemKind>)[item.kind] ?? monaco.languages.CompletionItemKind.Text : monaco.languages.CompletionItemKind.Text,
    detail: item.detail,
    documentation: item.documentation ? { value: item.documentation } : undefined,
    insertText: item.insertText ?? item.label,
    insertTextRules: item.insertTextFormat === 2
      ? monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet
      : undefined,
    range,
    sortText: item.sortText,
    filterText: item.filterText,
    commitCharacters: item.commitCharacters,
  } as monaco.languages.CompletionItem;
}

export function EditorPanel() {
  const { editorState, setCode, monacoEditorRef, handleEditorMountInternal } = useEditorContext();
  const { formatCode } = useCodeFormatter();

  const languageId = editorState.language.id;
  const monacoLanguage = getMonacoLanguageId(editorState.language.monaco, languageId);

  const monacoRef = useRef<typeof monaco | null>(null);

  const {
    isSupported,
    openDocument,
    changeDocument,
    getCompletions,
  } = useLspClient(languageId);

  const {
    debouncedCheck,
    triggerCheck,
    applyPendingMarkers,
    setModel,
    clear,
  } = useLocalSyntaxCheck(monacoRef, languageId);

  const handleEditorMount: OnMount = useCallback((editor, monacoInstance) => {
    // Store Monaco instance ref for syntax checking
    monacoRef.current = monacoInstance;
    // Notify anti-cheat guards via EditorContext
    handleEditorMountInternal(editor);

    // Set up the text model for syntax checking
    setModel(editor.getModel());
    applyPendingMarkers();

    // Trigger immediate syntax check on mount (shows errors for initial code)
    if (languageId) {
      triggerCheck(editor.getValue());
    }

    // Enable built-in TypeScript/JavaScript diagnostics for JS/TS (no network needed)
    const lang = monacoLanguage.toLowerCase();
    if (lang === 'javascript' || lang === 'typescript') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const tsDefaults = monacoInstance.languages.typescript as any;
      if (tsDefaults?.javaScriptDefaults) {
        tsDefaults.javaScriptDefaults.setDiagnosticsOptions({
          noSemanticValidation: false,
          noSyntaxValidation: false,
        });
        tsDefaults.javaScriptDefaults.setCompilerOptions({
          target: monacoInstance.languages.typescript.ScriptTarget.ES2020,
          allowNonTsExtensions: true,
          checkJs: lang === 'javascript',
          allowJs: lang === 'javascript',
        });
      }
    }

    // Open document for local identifier completions
    openDocument(editor.getValue());

    editor.addCommand(
      monacoInstance.KeyMod.CtrlCmd | monacoInstance.KeyCode.KeyS,
      () => {
        console.log('Save shortcut captured');
      }
    );

    // Register "Format Code" in the editor context menu
    editor.addAction({
      id: 'format-code-action',
      label: 'Format Code',
      keybindings: [
        monacoInstance.KeyMod.CtrlCmd | monacoInstance.KeyMod.Shift | monacoInstance.KeyCode.KeyF,
      ],
      contextMenuGroupId: '9_cutcopypaste',
      contextMenuOrder: 4,
      run: async (ed) => {
        const langId = editorState.language?.id ?? '';
        if (!langId) return;

        const currentCode = ed.getValue();
        const result = await formatCode({ source: currentCode, lang: langId });
        if (result !== null) {
          ed.setValue(result);
        }
      },
    });

    // Register completion provider for Java (and other supported languages)
    if (isSupported) {
      const completionProvider: monaco.languages.CompletionItemProvider = {
        triggerCharacters: ['.', '(', ',', "'", '"', '/', '@', '#'],
        provideCompletionItems: async (model, position) => {
          try {
            const result = await getCompletions({
              line: position.lineNumber - 1,
              character: position.column - 1,
            });
            return {
              suggestions: result.items.map(mapToMonaco),
              incomplete: result.isIncomplete ?? false,
            };
          } catch (err) {
            console.error('[EditorPanel] Completion error:', err);
            return { suggestions: [], incomplete: false };
          }
        },
      };

      monacoInstance.languages.registerCompletionItemProvider(monacoLanguage, completionProvider);
    }
  }, [languageId, formatCode, monacoLanguage, isSupported, openDocument, getCompletions, setModel, triggerCheck, applyPendingMarkers]);

  // Handle code changes — update context and trigger syntax check
  const handleEditorChange: OnChange = useCallback(
    async (value) => {
      if (value !== undefined) {
        setCode(value);
        changeDocument(value);

        // Debounce syntax check for non-JS/TS languages
        const lang = monacoLanguage.toLowerCase();
        if (lang !== 'javascript' && lang !== 'typescript') {
          debouncedCheck(value);
        }
      }
    },
    [setCode, changeDocument, monacoLanguage, debouncedCheck]
  );

  // Cleanup syntax check markers on unmount
  useEffect(() => {
    return () => {
      clear();
      monacoEditorRef.current = null;
    };
  }, [clear, monacoEditorRef]);

  return (
    <div className="relative h-full w-full">
      <MonacoEditor
        height="100%"
        language={monacoLanguage}
        value={editorState.code}
        theme={editorState.theme}
        onChange={handleEditorChange}
        onMount={handleEditorMount}
        options={{
          fontSize: editorState.fontSize,
          fontFamily: editorState.fontFamily,
          fontLigatures: true,
          minimap: { enabled: editorState.minimapEnabled, scale: 1 },
          scrollBeyondLastLine: false,
          lineNumbers: 'on',
          renderLineHighlight: 'all',
          automaticLayout: true,
          tabSize: editorState.tabSize,
          insertSpaces: true,
          wordWrap: editorState.wordWrap ? 'on' : 'off',
          folding: true,
          foldingStrategy: 'indentation',
          showFoldingControls: 'mouseover',
          cursorBlinking: editorState.cursorBlinking,
          cursorSmoothCaretAnimation: editorState.cursorSmoothCaretAnimation ? 'on' : 'off',
          smoothScrolling: true,
          padding: { top: 16, bottom: 16 },
          quickSuggestions: {
            other: true,
            comments: true,
            strings: true,
          },
          suggestOnTriggerCharacters: true,
          acceptSuggestionOnEnter: 'on',
          tabCompletion: 'on',
          parameterHints: { enabled: true },
          bracketPairColorization: { enabled: true },
          guides: {
            bracketPairs: true,
            indentation: true,
          },
          formatOnPaste: true,
          formatOnType: true,
        }}
      />
    </div>
  );
}

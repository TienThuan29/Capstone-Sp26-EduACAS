'use client';

import React, { useCallback, useRef, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { loader } from '@monaco-editor/react';
import type { OnMount, OnChange } from '@monaco-editor/react';
import type * as monaco from 'monaco-editor';
import { useEditorContext } from '@/contexts/EditorContext';
import { useCodeFormatter } from '@/hooks/formatter/useCodeFormatter';

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
};

/** Monaco built-in language ids; fall back to language.id if backend monaco value is invalid */
const KNOWN_MONACO_IDS = new Set([
  'c', 'cpp', 'csharp', 'css', 'go', 'html', 'java', 'javascript', 'json',
  'markdown', 'php', 'python', 'r', 'ruby', 'rust', 'sql', 'typescript', 'xml', 'plaintext',
]);

function getMonacoLanguageId(monaco: string | undefined, languageId: string): string {
  const raw = (monaco ?? '').toLowerCase().trim();
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

export function EditorPanel() {
  const { editorState, setCode } = useEditorContext();
  const { formatCode, isFormatting } = useCodeFormatter();
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const previousCodeRef = useRef(editorState.code);

  const handleEditorMount: OnMount = useCallback((editor, monaco) => {
    editorRef.current = editor;
    editor.focus();

    editor.addCommand(
      monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS,
      () => {
        console.log('Save shortcut captured');
      }
    );

    // Register "Format Code" in the editor context menu
    editor.addAction({
      id: 'format-code-action',
      label: 'Format Code',
      keybindings: [
        monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyF,
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
  }, [editorState.language?.id, formatCode]);

  // Handle code changes
  const handleEditorChange: OnChange = useCallback(
    (value) => {
      if (value !== undefined) {
        previousCodeRef.current = value;
        setCode(value);
      }
    },
    [setCode]
  );

  // Update previous code ref when language changes (code resets)
  useEffect(() => {
    previousCodeRef.current = editorState.code;
  }, [editorState.language, editorState.code]);

  const monacoLanguage = getMonacoLanguageId(
    editorState.language.monaco,
    editorState.language.id
  );

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

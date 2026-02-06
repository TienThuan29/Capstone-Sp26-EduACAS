'use client';

import React, { useCallback, useRef, useEffect } from 'react';
import dynamic from 'next/dynamic';
import type { OnMount, OnChange } from '@monaco-editor/react';
import type * as monaco from 'monaco-editor';
import { useEditorContext } from '../../../hooks/editor/EditorContext';
import { useAntiCheat } from '../../../hooks/editor/useAntiCheat';
import { LANGUAGE_CONFIG } from '../types';
import { WarningModal } from './warning-modal';

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
  const { editorState, setCode, isExamMode } = useEditorContext();
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const previousCodeRef = useRef(editorState.code);

  const {
    showFocusWarning,
    showPasteWarning,
    lastPastedText,
    handlePaste,
    dismissFocusWarning,
    dismissPasteWarning,
  } = useAntiCheat({
    isExamMode,
    pasteThreshold: 50,
  });

  const handleEditorMount: OnMount = useCallback((editor, monaco) => {
    editorRef.current = editor;
    // Focus the editor
    editor.focus();
    // Add paste detection
    editor.onDidPaste((e) => {
      const model = editor.getModel();
      if (model) {
        const pastedText = model.getValueInRange(e.range);
        // handlePaste(pastedText);
      }
    });

    // Custom keyboard shortcuts
    editor.addCommand(
      monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS,
      () => {
        // Prevent default save behavior
        console.log('Save shortcut captured');
      }
    );
  }, [handlePaste]);

  // Handle code changes
  const handleEditorChange: OnChange = useCallback(
    (value) => {
      if (value !== undefined) {
        // Detect large pastes by comparing with previous code
        const lengthDiff = value.length - previousCodeRef.current.length;
        if (lengthDiff > 50) {
          // Could be a paste - the onDidPaste handler will catch actual pastes
        }
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

  return (
    <div className="relative h-full w-full">
      <MonacoEditor
        height="100%"
        language={LANGUAGE_CONFIG[editorState.language].monacoLanguage}
        value={editorState.code}
        theme={editorState.theme}
        onChange={handleEditorChange}
        onMount={handleEditorMount}
        options={{
          fontSize: editorState.fontSize,
          fontFamily: "'JetBrains Mono', 'Fira Code', 'Consolas', monospace",
          fontLigatures: true,
          minimap: { enabled: true, scale: 1 },
          scrollBeyondLastLine: false,
          lineNumbers: 'on',
          renderLineHighlight: 'all',
          automaticLayout: true,
          tabSize: 4,
          insertSpaces: true,
          wordWrap: 'off',
          folding: true,
          foldingStrategy: 'indentation',
          showFoldingControls: 'mouseover',
          cursorBlinking: 'smooth',
          cursorSmoothCaretAnimation: 'on',
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

      {/* Paste Warning Modal */}
      {/* <WarningModal
        isOpen={showPasteWarning}
        onClose={dismissPasteWarning}
        title="Large Paste Detected"
        message={`Pasting large code blocks (${lastPastedText.length} characters) is monitored. This activity has been logged for review.`}
        variant="warning"
      /> */}
    </div>
  );
}

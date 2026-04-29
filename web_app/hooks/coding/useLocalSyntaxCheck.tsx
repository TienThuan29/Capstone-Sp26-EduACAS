'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import axios from 'axios';
import * as monaco from 'monaco-editor';

export interface SyntaxError {
  line: number;
  column: number;
  endLine: number;
  endColumn: number;
  severity: 'error' | 'warning' | 'info';
  message: string;
  code?: string;
}

export interface MonacoMarker {
  startLineNumber: number;
  startColumn: number;
  endLineNumber: number;
  endColumn: number;
  message: string;
  severity: monaco.MarkerSeverity;
  source?: string;
  code?: string;
}

const SEVERITY_TO_MONACO: Record<SyntaxError['severity'], monaco.MarkerSeverity> = {
  error: monaco.MarkerSeverity.Error,
  warning: monaco.MarkerSeverity.Warning,
  info: monaco.MarkerSeverity.Info,
};

const CHECK_DEBOUNCE_MS = 800;

function toMonacoMarker(err: SyntaxError): MonacoMarker {
  return {
    startLineNumber: err.line,
    startColumn: err.column,
    endLineNumber: err.endLine || err.line,
    endColumn: err.endColumn || err.column + 1,
    message: err.message,
    severity: SEVERITY_TO_MONACO[err.severity] ?? monaco.MarkerSeverity.Error,
    source: 'syntax-check',
    code: err.code,
  };
}

export function useLocalSyntaxCheck(
  monacoRef: React.MutableRefObject<typeof monaco | null>,
  languageId: string
) {
  const [isChecking, setIsChecking] = useState(false);
  const [diagnostics, setDiagnostics] = useState<SyntaxError[]>([]);
  const editorModelRef = useRef<monaco.editor.ITextModel | null>(null);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingMarkersRef = useRef<MonacoMarker[]>([]);
  const currentSourceRef = useRef<string>('');

  const applyPendingMarkers = useCallback(() => {
    if (!monacoRef.current || !editorModelRef.current) return;
    monacoRef.current.editor.setModelMarkers(
      editorModelRef.current,
      'syntax-check',
      pendingMarkersRef.current
    );
  }, [monacoRef]);

  const checkSyntax = useCallback(
    async (source: string) => {
      if (!languageId || typeof languageId !== 'string') return;
      currentSourceRef.current = source;
      setIsChecking(true);
      try {
        const res = await axios.post<{ errors: SyntaxError[] }>('/api/syntax-check', {
          source,
          languageId,
        });

        const errors: SyntaxError[] = res.data.errors ?? [];
        console.log('[useLocalSyntaxCheck] got', errors.length, 'errors for lang:', languageId);
        const markers = errors.map(toMonacoMarker);

        pendingMarkersRef.current = markers;
        setDiagnostics(errors);
        setIsChecking(false);

        applyPendingMarkers();
      } catch (err) {
        if (axios.isAxiosError(err) && err.response) {
          console.error('[useLocalSyntaxCheck] API error:', err.response.status, err.response.data?.error);
        } else {
          console.error('[useLocalSyntaxCheck] Failed to check syntax:', err);
        }
        pendingMarkersRef.current = [];
        setDiagnostics([]);
        setIsChecking(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [languageId, applyPendingMarkers]
  );

  const debouncedCheck = useCallback(
    (source: string) => {
      if (!languageId) return;
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      debounceTimerRef.current = setTimeout(() => {
        void checkSyntax(source);
        debounceTimerRef.current = null;
      }, CHECK_DEBOUNCE_MS);
    },
    [checkSyntax, languageId]
  );

  const setModel = useCallback(
    (model: monaco.editor.ITextModel | null) => {
      if (editorModelRef.current && monacoRef.current) {
        monacoRef.current.editor.setModelMarkers(editorModelRef.current, 'syntax-check', []);
      }
      editorModelRef.current = model;
      if (model) {
        applyPendingMarkers();
      }
    },
    [monacoRef, applyPendingMarkers]
  );

  const clear = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
    pendingMarkersRef.current = [];
    currentSourceRef.current = '';
    setDiagnostics([]);
    if (editorModelRef.current && monacoRef.current) {
      monacoRef.current.editor.setModelMarkers(editorModelRef.current, 'syntax-check', []);
    }
  }, [monacoRef]);

  const triggerCheck = useCallback(
    (source: string) => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }
      void checkSyntax(source);
    },
    [checkSyntax]
  );

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      if (editorModelRef.current && monacoRef.current) {
        monacoRef.current.editor.setModelMarkers(editorModelRef.current, 'syntax-check', []);
      }
    };
  }, [monacoRef]);

  return {
    isChecking,
    diagnostics,
    checkSyntax,
    debouncedCheck,
    triggerCheck,
    applyPendingMarkers,
    setModel,
    clear,
  };
}

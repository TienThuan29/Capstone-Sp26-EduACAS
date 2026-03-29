'use client';

import { useState, useEffect, useRef } from 'react';
import { Modal, ModalHeader, ModalBody, Spinner, Badge, Button } from 'flowbite-react';
import { Monaco, Editor } from '@monaco-editor/react';
import { X, FileCode, Layers, Info, Cpu } from 'lucide-react';
import { useSubmission } from '@/hooks/submission/useSubmission';
import { useErrorGroup } from '@/hooks/error-group/useErrorGroup';
import type { ErrorGroupDetail, JPlagMatchDetailGroup } from '@/types/error-group';
import type { ProgrammingLanguage } from '@/types/language';

type SimilarityDiffModalProps = {
  pair: {
    groupId: string;
    sub1Id: string;
    sub2Id: string;
    name1: string;
    name2: string;
    score: number;
    problemTitle: string;
    language: ProgrammingLanguage;
  } | null;
  onClose: () => void;
};

export function SimilarityDiffModal({ pair, onClose }: SimilarityDiffModalProps) {
  const { getSubmissionById } = useSubmission();
  const { getErrorGroupDetail } = useErrorGroup();

  const [loading, setLoading] = useState(false);
  const [code1, setCode1] = useState('');
  const [code2, setCode2] = useState('');
  const [matchDetails, setMatchDetails] = useState<JPlagMatchDetailGroup | null>(null);
  const [activeMatchIdx, setActiveMatchIdx] = useState<number>(-1);
  const editor1Ref = useRef<any>(null);
  const editor2Ref = useRef<any>(null);
  const monacoRef = useRef<Monaco | null>(null);
  const activeDecorations1 = useRef<string[]>([]);
  const activeDecorations2 = useRef<string[]>([]);

  useEffect(() => {
    if (!pair) return;

    async function loadData() {
      setLoading(true);
      try {
        const [sub1, sub2, groupDetail] = await Promise.all([
          getSubmissionById(pair!.sub1Id),
          getSubmissionById(pair!.sub2Id),
          getErrorGroupDetail(pair!.groupId)
        ]);

        setCode1(sub1?.source || '// No source code available');
        setCode2(sub2?.source || '// No source code available');

        const specificMatch = groupDetail.jPlagResultsDetailed?.find(
          m => (m.submission1Id.toLowerCase() === pair!.sub1Id.toLowerCase() && m.submission2Id.toLowerCase() === pair!.sub2Id.toLowerCase()) ||
            (m.submission1Id.toLowerCase() === pair!.sub2Id.toLowerCase() && m.submission2Id.toLowerCase() === pair!.sub1Id.toLowerCase())
        );

        setMatchDetails(specificMatch || null);
      } catch (err) {
        console.error('Failed to load code comparison', err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [pair, getSubmissionById, getErrorGroupDetail]);

  const injectStyles = () => {
    if (!document.getElementById('jplag-highlight-styles')) {
      const style = document.createElement('style');
      style.id = 'jplag-highlight-styles';
      style.innerHTML = `
        .jplag-match-highlight {
          background: rgba(220, 38, 38, 0.12) !important;
          border-left: 5px solid #DC2626 !important;
          border-bottom: 2px solid rgba(220, 38, 38, 0.25) !important;
          width: 100% !important;
          display: block;
        }
        .jplag-match-highlight:hover {
          background: rgba(220, 38, 38, 0.2) !important;
        }
        .jplag-match-highlight-margin {
          background: #DC2626 !important;
          width: 10px !important;
          cursor: pointer;
        }
        .jplag-match-active-focus {
          border: 2px solid #DC2626 !important;
          box-shadow: 0 0 10px rgba(220, 38, 38, 0.6);
          z-index: 200 !important;
        }
      `;
      document.head.appendChild(style);
    }
  };

  const handleEditor1Mount = (editor: any, monaco: Monaco) => {
    if (!matchDetails || !matchDetails.details) return;
    injectStyles();
    monacoRef.current = monaco;
    const decorationsOriginal = matchDetails.details.map(d => ({
      range: new monaco.Range(Math.max(1, d.startLine1), 1, Math.max(1, d.endLine1), 1),
      options: {
        isWholeLine: true,
        className: 'jplag-match-highlight',
        marginClassName: 'jplag-match-highlight-margin',
        overviewRuler: { color: '#DC2626', position: 7 },
        zIndex: 100
      }
    }));

    editor1Ref.current = editor;
    editor.deltaDecorations([], decorationsOriginal);
    if (matchDetails.details.length > 0) {
      setTimeout(() => editor.revealLineInCenter(Math.max(1, matchDetails.details[0].startLine1)), 800);
    }
  };

  const handleEditor2Mount = (editor: any, monaco: Monaco) => {
    if (!matchDetails || !matchDetails.details) return;
    injectStyles();

    monacoRef.current = monaco;
    const decorationsModified = matchDetails.details.map(d => ({
      range: new monaco.Range(Math.max(1, d.startLine2), 1, Math.max(1, d.endLine2), 1),
      options: {
        isWholeLine: true,
        className: 'jplag-match-highlight',
        marginClassName: 'jplag-match-highlight-margin',
        overviewRuler: { color: '#DC2626', position: 7 },
        zIndex: 100
      }
    }));

    editor2Ref.current = editor;
    editor.deltaDecorations([], decorationsModified);
    if (matchDetails.details.length > 0) {
      setTimeout(() => editor.revealLineInCenter(Math.max(1, matchDetails.details[0].startLine2)), 800);
    }
  };

  const jumpToMatch = (detail: any, idx: number) => {
    setActiveMatchIdx(idx);
    const monaco = monacoRef.current;
    if (!monaco) return;

    if (editor1Ref.current) {
      editor1Ref.current.revealLineInCenter(detail.startLine1, 1);
      activeDecorations1.current = editor1Ref.current.deltaDecorations(activeDecorations1.current, [
        {
          range: new monaco.Range(detail.startLine1, 1, detail.endLine1, 1),
          options: { isWholeLine: true, className: 'jplag-match-active-focus', zIndex: 200 }
        }
      ]);
    }
    
    if (editor2Ref.current) {
      editor2Ref.current.revealLineInCenter(detail.startLine2, 1);
      activeDecorations2.current = editor2Ref.current.deltaDecorations(activeDecorations2.current, [
        {
          range: new monaco.Range(detail.startLine2, 1, detail.endLine2, 1),
          options: { isWholeLine: true, className: 'jplag-match-active-focus', zIndex: 200 }
        }
      ]);
    }
  };

  if (!pair) return null;

  return (
    <Modal show={!!pair} onClose={onClose} size="7xl" className="h-screen py-10">
      <ModalHeader className="border-b dark:border-gray-700 bg-white p-5 relative">
        <div className="flex justify-between items-center w-full pr-12 gap-10">
          {/* Section 1: Identity & Names (Left-aligned, grows to available space) */}
          <div className="flex items-center gap-6 min-w-0 flex-1">
            <div className="bg-[#1F4E79] p-2.5 rounded-xl text-white shadow-sm shrink-0">
              <FileCode className="h-6 w-6" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] mb-1">
                {pair.problemTitle}
              </span>
              <div className="flex items-center gap-4 min-w-0">
                <span className="text-xl font-extrabold text-[#1F4E79] dark:text-blue-300 whitespace-nowrap">
                  {pair.name1}
                </span>
                <span className="text-gray-400 font-medium text-sm italic shrink-0 px-1">vs</span>
                <span className="text-xl font-extrabold text-[#1F4E79] dark:text-blue-300 whitespace-nowrap">
                  {pair.name2}
                </span>
              </div>
            </div>
          </div>

          {/* Section 2: Metadata (Right-aligned, fixed size) */}
          <div className="flex items-center gap-8 shrink-0">
            {/* Language */}
            <div className="flex items-center gap-3 border-l pl-8 border-gray-200 dark:border-gray-700 h-10">
              <div className="bg-[#C9A24D]/10 p-1.5 rounded-lg shrink-0">
                <Cpu className="h-4 w-4 text-[#C9A24D]" />
              </div>
              <div className="flex flex-col leading-tight">
                <span className="text-[9px] font-black text-gray-400 uppercase tracking-tighter">Language</span>
                <span className="text-[11px] font-bold text-[#C9A24D] uppercase">
                  {pair.language.name}
                </span>
              </div>
            </div>

            {/* Similarity Badge */}
            <div className="flex items-center gap-3 px-5 py-2.5 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-700">
              <div
                className={`w-2.5 h-2.5 rounded-full animate-pulse shrink-0 ${
                  pair.score >= 80
                    ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]'
                    : pair.score >= 50
                    ? 'bg-orange-400 shadow-[0_0_8px_rgba(251,146,60,0.5)]'
                    : 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]'
                }`}
              />
              <div className="flex items-baseline gap-1.5 overflow-hidden">
                <span className="text-xl font-black text-gray-800 dark:text-gray-100 tabular-nums">
                  {pair.score}%
                </span>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Similarity</span>
              </div>
            </div>

            {/* Segments Badge */}
            {matchDetails && (
              <div className="flex items-center gap-3 px-5 py-2.5 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-700">
                <Layers className="h-5 w-5 text-gray-400 shrink-0" />
                <div className="flex items-baseline gap-1.5 overflow-hidden">
                  <span className="text-xl font-black text-gray-800 dark:text-gray-100 tabular-nums">
                    {matchDetails.details.length}
                  </span>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Segments</span>
                </div>
              </div>
            )}
          </div>
        </div>

        <button
          onClick={onClose}
          type="button"
          className="absolute top-6 right-4 p-2 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-xl text-gray-400 dark:hover:bg-gray-600 dark:hover:text-white transition-all shadow-sm hover:shadow-md"
        >
          <X className="h-5 w-5" />
          <span className="sr-only">Close modal</span>
        </button>
      </ModalHeader>
      <ModalBody className="p-0 h-[80vh] flex overflow-hidden">
        {loading ? (
          <div className="flex h-full w-full items-center justify-center bg-gray-50/50">
            <div className="flex flex-col items-center gap-4">
              <Spinner size="xl" color="info" />
              <p className="text-sm font-medium text-gray-500">Retrieving code highlights...</p>
            </div>
          </div>
        ) : (
          <>
            <div className="flex-1 flex flex-col md:flex-row border-r border-gray-200 overflow-hidden" style={{ height: '80vh' }}>
              {code1 && code2 ? (
                <>
                  <div className="w-full md:w-1/2 h-full border-r border-gray-200">
                    <div className="bg-gray-50 border-b px-4 py-1.5 text-[10px] font-bold text-gray-500 uppercase flex justify-between">
                      <span>{pair.name1}</span>
                      <span className="text-red-600">Left File</span>
                    </div>
                    <Editor
                      height="calc(100% - 31px)"
                      value={code1}
                      theme="light"
                      language={pair.language.monaco}
                      onMount={(editor, monaco) => {
                        handleEditor1Mount(editor, monaco);
                      }}
                      options={{
                        readOnly: true,
                        scrollBeyondLastLine: false,
                        minimap: { enabled: false },
                        automaticLayout: true,
                        wordWrap: 'on',
                        glyphMargin: true,
                        lineNumbersMinChars: 4,
                        fontSize: 13,
                        renderWhitespace: 'none',
                        folding: true,
                        selectionHighlight: false,
                        occurrencesHighlight: 'off',
                        renderLineHighlight: 'all'
                      }}
                    />
                  </div>
                  <div className="w-full md:w-1/2 h-full">
                    <div className="bg-gray-50 border-b px-4 py-1.5 text-[10px] font-bold text-gray-500 uppercase flex justify-between">
                      <span>{pair.name2}</span>
                      <span className="text-red-600">Right File</span>
                    </div>
                    <Editor
                      height="calc(100% - 31px)"
                      value={code2}
                      theme="light"
                      language={pair.language.monaco}
                      onMount={(editor, monaco) => {
                        handleEditor2Mount(editor, monaco);
                      }}
                      options={{
                        readOnly: true,
                        scrollBeyondLastLine: false,
                        minimap: { enabled: false },
                        automaticLayout: true,
                        wordWrap: 'on',
                        glyphMargin: true,
                        lineNumbersMinChars: 4,
                        fontSize: 13,
                        renderWhitespace: 'none',
                        folding: true,
                        selectionHighlight: false,
                        occurrencesHighlight: 'off',
                        renderLineHighlight: 'all'
                      }}
                    />
                  </div>
                </>
              ) : (
                <div className="flex h-full w-full items-center justify-center text-white p-8 bg-gray-900">
                  <p>Source code not loaded or empty (L: {code1?.length || 0}, R: {code2?.length || 0})</p>
                </div>
              )}
            </div>

            {/* Match Sidebar */}
            <div className="w-64 flex flex-col bg-gray-50 overflow-hidden border-l border-gray-200">
              <div className="p-4 border-b bg-white">
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-tight">Match Explorer</h3>
                <p className="text-[10px] text-gray-500 font-medium">Click to navigate between segments</p>
              </div>
              <div className="flex-1 overflow-y-auto p-2 space-y-2">
                {matchDetails?.details.map((d, idx) => (
                  <button
                    key={idx}
                    onClick={() => jumpToMatch(d, idx)}
                    className={`w-full text-left p-3 rounded-lg border transition-all group ${
                      activeMatchIdx === idx 
                        ? 'bg-red-50 border-red-400 shadow-sm ring-1 ring-red-400' 
                        : 'bg-white border-gray-200 hover:border-red-400 hover:shadow-sm'
                    }`}
                  >
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[11px] font-black text-red-600">SEGMENT #{idx + 1}</span>
                      <span className="text-[10px] bg-red-50 text-red-700 px-1.5 py-0.5 rounded font-bold uppercase">{d.tokens} tokens</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      <div>
                        <p className="text-gray-400 font-bold uppercase text-[9px]">Left</p>
                        <p className="font-mono bg-gray-50 rounded px-1 text-gray-700">L{d.startLine1}-{d.endLine1}</p>
                      </div>
                      <div>
                        <p className="text-gray-400 font-bold uppercase text-[9px]">Right</p>
                        <p className="font-mono bg-gray-50 rounded px-1 text-gray-700">L{d.startLine2}-{d.endLine2}</p>
                      </div>
                    </div>
                  </button>
                )) || (
                  <div className="h-full flex items-center justify-center text-xs text-gray-400 italic p-4 text-center">
                    No matching segments found for this specific pair.
                  </div>
                )}
              </div>
              <div className="p-3 bg-white border-t">
                <div className="flex items-center gap-2 text-[10px] text-gray-500 font-bold">
                  <div className="w-3 h-3 rounded bg-red-100 border-l-4 border-red-600"></div>
                  <span>High Similarity Detected</span>
                </div>
              </div>
            </div>
          </>
        )}
      </ModalBody>
    </Modal>
  );
}

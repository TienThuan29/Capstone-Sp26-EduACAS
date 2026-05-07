'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Panel,
  Group,
  Separator,
} from 'react-resizable-panels';
import { PanelLeftClose, PanelLeft, ArrowLeftIcon, RefreshCw, Play } from 'lucide-react';
import { Button, Spinner, Badge, Label, TextInput, Tooltip, Modal, ModalHeader, ModalBody, ModalFooter } from 'flowbite-react';
import clsx from 'clsx';
import { useEditorContext } from '@/contexts/EditorContext';
import { EditorPanel } from '@/app/code-editor/components/editor-panel';
import { ProblemPanel } from '@/app/code-editor/components/problem-panel';
import type { SubmissionResponse } from '@/types/submission';
import { useSubmissionLecturer } from '@/hooks/submission/useSubmissionLecturer';
import { usePublicTests } from '@/hooks/coding/usePublicTests';
import { useCustomTest } from '@/hooks/coding/useCustomTest';
import { useToast } from '@/hooks/useToast';
import { formatDate } from '@/utils/datetime-utils';
import type { TestResultResponse } from '@/types/submission';
import { MaterialSelector } from '@/components/ui/MaterialSelector';
import type { Material } from '@/types/material';
import { useMaterial } from '@/hooks/material/useMaterial';

function LecturerNoteTab({
  submissionId,
  classroomId,
  initialFeedback,
  initialMaterial,
  onFeedbackChange,
  onMaterialChange,
  saveFeedback,
  showSuccess,
  showError,
  problemTitle,
}: {
  submissionId: string;
  classroomId: string;
  initialFeedback: string;
  initialMaterial: string[];
  onFeedbackChange: (v: string) => void;
  onMaterialChange: (v: string[]) => void;
  saveFeedback: (
    id: string,
    feedback: string,
    material: string[],
    send: boolean,
    problemTitle?: string
  ) => Promise<void>;
  showSuccess: (msg: string) => void;
  showError: (msg: string) => void;
  problemTitle?: string;
}) {
  const [sendingFeedback, setSendingFeedback] = useState(false);
  const { getMaterialsByClassroom } = useMaterial();
  const [materials, setMaterials] = useState<Material[]>([]);
  const [materialsLoading, setMaterialsLoading] = useState(false);

  useEffect(() => {
    if (!classroomId) return;
    setMaterialsLoading(true);
    getMaterialsByClassroom(classroomId)
      .then((mats) => setMaterials(mats))
      .catch(() => setMaterials([]))
      .finally(() => setMaterialsLoading(false));
  }, [classroomId, getMaterialsByClassroom]);

  const handleSave = async () => {
    setSendingFeedback(true);
    try {
      await saveFeedback(submissionId, initialFeedback, initialMaterial, false, problemTitle);
      showSuccess('Feedback saved successfully.');
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Failed to save feedback.');
    } finally {
      setSendingFeedback(false);
    }
  };

  return (
    <div className="flex h-full flex-col gap-4 overflow-y-auto p-4">
      {/* Feedback textarea */}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-gray-300">
          Feedback for Student
        </label>
        <p className="text-xs text-gray-500">
          Write feedback to help the student understand their mistakes and how to improve.
        </p>
        <textarea
          value={initialFeedback}
          onChange={(e) => onFeedbackChange(e.target.value)}
          placeholder="e.g. Your solution has a correct approach but fails on edge cases where input size is large. Consider using a more efficient algorithm..."
          rows={6}
          className="resize-none rounded-md border border-gray-700 bg-gray-800 p-3 text-sm text-gray-200 placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>

      {/* Material recommendation */}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-gray-300">
          Recommended Materials
        </label>
        <p className="text-xs text-gray-500">
          Select materials from the classroom to recommend to the student.
        </p>
        <MaterialSelector
          materials={materials ?? []}
          selectedIds={initialMaterial}
          onChange={onMaterialChange}
          loading={materialsLoading}
        />
      </div>

      {/* Save button */}
      <div className="flex justify-end">
        <Button
          size="sm"
          color="blue"
          onClick={() => void handleSave()}
          disabled={sendingFeedback}
          className="cursor-pointer"
        >
          {sendingFeedback ? <Spinner size="sm" /> : null}
          Save Feedback
        </Button>
      </div>
    </div>
  );
}

function ResizeHandle({
  direction = 'horizontal',
}: {
  direction?: 'horizontal' | 'vertical';
}) {
  const isHorizontal = direction === 'horizontal';
  return (
    <Separator
      className={clsx(
        'group relative flex items-center justify-center bg-gray-800 transition-colors hover:bg-blue-600/50 data-resize-handle-active:bg-blue-600',
        isHorizontal ? 'w-2 cursor-col-resize' : 'h-2 cursor-row-resize',
      )}
    />
  );
}

type LecturerSubmissionWorkspaceProps = {
  submission: SubmissionResponse;
  submissionId: string;
  classroomId: string;
};

export function LecturerSubmissionWorkspace({
  submission,
  submissionId,
  classroomId,
}: LecturerSubmissionWorkspaceProps) {
  const router = useRouter();
  const { showSuccess, showError } = useToast();
  const { editorState, selectedCompiler, isLeftPanelCollapsed, toggleLeftPanel, setConsoleOutput, consoleOutput, customInput, setCustomInput, problem } = useEditorContext();
  const { reGradeSubmission, overrideSubmissionScore, saveLecturerFeedback } = useSubmissionLecturer();
  const { runPublicTests, isRunning: isRunningPublic, results: publicResults, error: publicError } = usePublicTests();
  const { runCustomTest, isRunning: isRunningCustom } = useCustomTest();

  const [currentSubmission, setCurrentSubmission] = useState(submission);
  const [regrading, setRegrading] = useState(false);
  const [scoreInput, setScoreInput] = useState(String(submission.finalScore ?? ''));
  const [savingScore, setSavingScore] = useState(false);
  const [showScoreModal, setShowScoreModal] = useState(false);
  const [sendFeedbackToStudent, setSendFeedbackToStudent] = useState(true);
  const [activeTab, setActiveTab] = useState<'testcases' | 'custom' | 'output'>('testcases');
  const [lecturerFeedback, setLecturerFeedback] = useState(submission.lecturerFeedback ?? '');
  const [materialRecommendation, setMaterialRecommendation] = useState<string[]>([]);

  const handleRunPublicTests = async () => {
    setConsoleOutput('');
    await runPublicTests();
  };

  const handleRegrade = async () => {
    if (!selectedCompiler) return;
    setRegrading(true);
    try {
      const result = await reGradeSubmission(
        submissionId,
        currentSubmission.languageId ?? '',
        currentSubmission.compilerId ?? '',
      );
      if (result.errorMessage) {
        showError(`Re-grading failed: ${result.errorMessage}`);
      } else {
        showSuccess(`Re-graded: ${result.finalScore} pts (${result.passedTestCases}/${result.totalTestCases} passed)`);
        setScoreInput(String(result.finalScore));
        setCurrentSubmission((prev) => ({ ...prev, finalScore: result.finalScore }));
      }
    } catch (err) {
      showError('Re-grading failed. Check console for details.');
    } finally {
      setRegrading(false);
    }
  };

  const handleSaveScore = () => {
    const score = parseFloat(scoreInput);
    if (isNaN(score) || score < 0) {
      showError('Please enter a valid non-negative score.');
      return;
    }
    if (submission.maxMark != null && score > submission.maxMark) {
      showError(`Score cannot exceed max mark (${submission.maxMark}).`);
      return;
    }
    setShowScoreModal(true);
  };

  const confirmSaveScore = async () => {
    const score = parseFloat(scoreInput);
    setSavingScore(true);
    try {
      await overrideSubmissionScore(submissionId, score, submission.maxMark ?? 0);
      await saveLecturerFeedback(
        submissionId,
        lecturerFeedback,
        materialRecommendation,
        sendFeedbackToStudent,
        problem?.title,
      );
      showSuccess('Score and feedback saved successfully.');
      setCurrentSubmission((prev) => ({ ...prev, finalScore: score }));
      setShowScoreModal(false);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to save score.';
      showError(msg);
    } finally {
      setSavingScore(false);
    }
  };

  const statusColor = (status: string) =>
    status === 'SUCCESS'
      ? 'success'
      : status === 'FAIL'
        ? 'failure'
        : 'warning';

  const testResults: TestResultResponse[] = publicResults ?? currentSubmission?.testResults ?? [];

  return (
    <div className="flex h-screen flex-col bg-gray-950 text-gray-100">
      {/* ── Header Toolbar ── */}
      <div className="flex shrink-0 items-center justify-between border-b border-gray-800 bg-gray-900 px-4 py-2">
        <div className="flex items-center gap-3">
          <Button
            size="sm"
            color="gray"
            onClick={() => router.back()}
            className="cursor-pointer border border-gray-700 bg-gray-800 text-gray-300 hover:bg-gray-700"
          >
            <ArrowLeftIcon className="h-4 w-4" />
          </Button>
          <span className="text-sm font-semibold text-white">Submission Review</span>
          {currentSubmission && (
            <>
              <span className="text-gray-500">|</span>
              <span className="text-sm text-gray-300">
                {currentSubmission.student?.fullname ?? currentSubmission.studentId ?? '—'}
              </span>
              <Badge color="info" size="sm">
                {currentSubmission.problem?.title ?? currentSubmission.problemId ?? '—'}
              </Badge>
              <span className="text-sm text-gray-400">
                Submitted: {formatDate(currentSubmission.submittedDate)}
              </span>
            </>
          )}
        </div>

        <div className="flex items-center gap-3">
          {/* Current / override score */}
          <div className="flex items-center gap-2">
            <Label className="text-sm text-gray-400">Score:</Label>
            <TextInput
              type="number"
              min={0}
              max={submission.maxMark}
              step={0.5}
              value={scoreInput}
              onChange={(e) => setScoreInput(e.target.value)}
              className="min-w-0! w-20! bg-gray-800 text-sm text-white [&&[type=number]]::-webkit-inner-spin-button"
              sizing="sm"
              title={submission.maxMark ? `Max mark: ${submission.maxMark}` : undefined}
            />
            {submission.maxMark != null && submission.maxMark > 0 && (
              <span className="text-xs text-gray-500">/ {submission.maxMark}</span>
            )}
            <Button
              size="sm"
              color="blue"
              onClick={() => void handleSaveScore()}
              disabled={savingScore}
              className="cursor-pointer"
            >
              {savingScore ? <Spinner size="sm" /> : 'Save'}
            </Button>
          </div>

          {/* Re-grade button */}
          <Tooltip content="Re-run hidden test cases on this submission">
            <Button
              size="sm"
              color="green"
              onClick={() => void handleRegrade()}
              disabled={regrading || !selectedCompiler}
              className="cursor-pointer"
            >
              {regrading ? <Spinner size="sm" className="mr-1" /> : <RefreshCw className="mr-1 h-4 w-4" />}
              Re-grade
            </Button>
          </Tooltip>
        </div>
      </div>

      {/* ── Main Workspace ── */}
      <div className="flex flex-1 overflow-hidden">
        <Group orientation="horizontal">
          {/* Problem Panel (Left) */}
          {!isLeftPanelCollapsed && (
            <>
              <Panel defaultSize={300} minSize={100} maxSize={600} id="problem-panel">
                <div className="relative flex h-full flex-col">
                  {/* Left panel tab bar */}
                  <div className="flex shrink-0 items-center justify-between border-b border-gray-700 bg-gray-900">
                    <div />
                    <Button
                      onClick={toggleLeftPanel}
                      className="mr-2 cursor-pointer rounded-md bg-gray-800 p-1.5 text-gray-400 transition-colors hover:bg-gray-700 hover:text-white"
                    >
                      <PanelLeftClose className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Tab content */}
                  <div className="flex-1 overflow-hidden">
                    <ProblemPanel
                      extraTabs={[{ id: "lecturerNote", label: "Lecturer Note" }]}
                      extraTabContent={{
                        lecturerNote: (
                          <LecturerNoteTab
                            submissionId={submissionId}
                            classroomId={classroomId}
                            initialFeedback={lecturerFeedback}
                            initialMaterial={materialRecommendation}
                            onFeedbackChange={setLecturerFeedback}
                            onMaterialChange={setMaterialRecommendation}
                            saveFeedback={saveLecturerFeedback}
                            showSuccess={showSuccess}
                            showError={showError}
                            problemTitle={problem?.title}
                          />
                        ),
                      }}
                    />
                  </div>
                </div>
              </Panel>
              <ResizeHandle direction="horizontal" />
            </>
          )}

          {/* Editor + Console */}
          <Panel
            defaultSize={isLeftPanelCollapsed ? 100 : 65}
            minSize={30}
            id="workspace-panel"
          >
            <div className="flex h-full flex-col">
              {isLeftPanelCollapsed && (
                <button
                  onClick={toggleLeftPanel}
                  className="absolute left-2 top-14 z-10 rounded-md bg-gray-800 p-1.5 text-gray-400 transition-colors hover:bg-gray-700 hover:text-white"
                  title="Expand panel"
                >
                  <PanelLeft className="h-4 w-4" />
                </button>
              )}

              {/* Language & Compiler selector bar */}
              <div className="flex shrink-0 items-center gap-3 border-b border-gray-800 bg-gray-900 px-4 py-2">
                <span className="text-sm text-gray-400">
                  {editorState.language?.name ?? '—'}
                </span>
                <span className="text-gray-600">|</span>
                <span className="text-sm text-gray-400">
                  Compiler: <span className="text-white">{selectedCompiler?.name ?? 'Auto'}</span>
                </span>
                <div className="ml-auto flex gap-2" />
              </div>

              {/* Editor + Bottom Panel Split */}
              <div className="flex-1 overflow-hidden">
                <Group orientation="vertical">
                  {/* Monaco Editor */}
                  <Panel defaultSize={60} minSize={30} id="editor-panel">
                    <EditorPanel />
                  </Panel>

                  <ResizeHandle direction="vertical" />

                  {/* Console / Results Panel */}
                  <Panel defaultSize={40} minSize={20} id="console-panel">
                    <div className="flex h-full flex-col bg-gray-900">
                      {/* Tab bar */}
                      <div className="flex shrink-0 items-center justify-between border-b border-gray-700 px-3">
                        <div className="flex">
                          {(['testcases', 'custom', 'output'] as const).map((tab) => (
                            <button
                              key={tab}
                              onClick={() => setActiveTab(tab)}
                              className={clsx(
                                'flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium transition-colors cursor-pointer border-b-2',
                                activeTab === tab
                                  ? 'border-blue-500 text-blue-500'
                                  : 'border-transparent text-gray-400 hover:text-gray-200'
                              )}
                            >
                              {tab === 'testcases' && <>Test Cases</>}
                              {tab === 'custom' && <>Custom Input</>}
                              {tab === 'output' && <>Output</>}
                            </button>
                          ))}
                        </div>
                        {activeTab === 'testcases' && testResults.length > 0 && (
                          <Badge color="info" size="sm">
                            {testResults.filter((r) => r.status === 'SUCCESS').length}/{testResults.length} passed
                          </Badge>
                        )}
                      </div>

                      {/* Tab content */}
                      <div className="flex-1 overflow-hidden">
                        {/* ── Test Cases ── */}
                        {activeTab === 'testcases' && (
                          <div className="flex h-full flex-col">
                            <div className="flex shrink-0 items-center justify-between gap-2 border-b border-gray-800 px-4 py-2">
                              <span className="text-xs text-gray-400">
                                {testResults.length > 0
                                  ? `${testResults.filter((r) => r.status === 'SUCCESS').length} / ${testResults.length} passed`
                                  : 'Public test cases from problem'}
                              </span>
                              <Button
                                size="xs"
                                color="gray"
                                onClick={() => void handleRunPublicTests()}
                                disabled={isRunningPublic || !selectedCompiler}
                                className="cursor-pointer border border-gray-700 bg-gray-800 text-gray-300 hover:bg-gray-700"
                              >
                                {isRunningPublic ? <Spinner size="sm" className="mr-1" /> : <Play className="mr-1 h-3.5 w-3.5" />}
                                Run
                              </Button>
                            </div>
                            <div className="flex-1 overflow-y-auto p-4">
                              {publicError && (
                                <p className="mb-3 rounded border border-red-800 bg-red-900/30 p-2 text-sm text-red-400">
                                  {publicError}
                                </p>
                              )}
                              {testResults.length === 0 ? (
                                <p className="py-8 text-center text-sm text-gray-500">
                                  No test results. Click &ldquo;Run&rdquo; to execute public test cases.
                                </p>
                              ) : (
                                <div className="overflow-x-auto">
                                  <table className="min-w-full text-sm">
                                    <thead>
                                      <tr className="border-b border-gray-700 text-left text-gray-400">
                                        <th className="pb-2 pr-4">#</th>
                                        <th className="pb-2 pr-4">Status</th>
                                        <th className="pb-2 pr-4">Input</th>
                                        <th className="pb-2 pr-4">Expected</th>
                                        <th className="pb-2 pr-4">Actual</th>
                                        <th className="pb-2">Time (ms)</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {testResults.map((r, i) => (
                                        <tr key={r.id ?? i} className="border-b border-gray-800">
                                          <td className="py-2 pr-4 font-medium text-gray-300">{i + 1}</td>
                                          <td className="py-2 pr-4">
                                            <Badge color={statusColor(r.status)} size="sm">{r.status}</Badge>
                                          </td>
                                          <td className="py-2 pr-4 font-mono text-xs text-gray-400" style={{ wordBreak: 'break-all', maxWidth: '120px' }}>
                                            {r.input || '—'}
                                          </td>
                                          <td className="py-2 pr-4 font-mono text-xs text-green-400" style={{ wordBreak: 'break-all', maxWidth: '120px' }}>
                                            {r.expectedOutput || '—'}
                                          </td>
                                          <td className="py-2 pr-4 font-mono text-xs text-yellow-400" style={{ wordBreak: 'break-all', maxWidth: '120px' }}>
                                            {r.actualOutput ?? '—'}
                                          </td>
                                          <td className="py-2 text-gray-400">{r.executionTimeMs ?? '—'}</td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* ── Custom Input ── */}
                        {activeTab === 'custom' && (
                          <div className="flex h-full flex-col p-4">
                            <label className="mb-2 text-sm font-medium text-gray-300">
                              Custom Test Input
                            </label>
                            <textarea
                              value={customInput}
                              onChange={(e) => setCustomInput(e.target.value)}
                              placeholder="Enter your custom test input here..."
                              className="min-h-[100px] flex-1 resize-none rounded-md border border-gray-700 bg-gray-800 p-3 font-mono text-sm text-gray-200 placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                            <div className="mt-3 flex items-center justify-between gap-2">
                              <p className="text-xs text-gray-500">
                                Enter custom input and click &ldquo;Run&rdquo; to test the code.
                              </p>
                              <Button
                                size="sm"
                                color="blue"
                                onClick={() => { setConsoleOutput(''); void runCustomTest(); }}
                                disabled={isRunningCustom || !selectedCompiler}
                                className="cursor-pointer"
                              >
                                {isRunningCustom ? (
                                  <><Spinner size="sm" className="mr-1" />Running...</>
                                ) : (
                                  <><Play className="mr-1 h-3.5 w-3.5" />Run</>
                                )}
                              </Button>
                            </div>
                          </div>
                        )}

                        {/* ── Output ── */}
                        {activeTab === 'output' && (
                          <div className="flex h-full flex-col p-4">
                            <div className="mb-2 flex items-center justify-between">
                              <span className="text-sm font-medium text-gray-300">Console Output</span>
                            </div>
                            <div className="flex-1 overflow-y-auto rounded-md border border-gray-700 bg-black p-3">
                              {consoleOutput ? (
                                <pre className="font-mono text-sm text-green-400 whitespace-pre-wrap">
                                  {consoleOutput}
                                </pre>
                              ) : (
                                <span className="text-sm text-gray-500">
                                  Run a custom test to see output here...
                                </span>
                              )}
                            </div>
                          </div>
                        )}

                      </div>
                    </div>
                  </Panel>
                </Group>
              </div>

              {/* Footer */}
              <div className="flex shrink-0 items-center justify-between border-t border-gray-800 bg-gray-900 px-4 py-2 text-xs text-gray-500">
                <span>{editorState.code.length} characters</span>
                <span>{editorState.language?.name ?? '—'}</span>
              </div>
            </div>
          </Panel>
        </Group>
      </div>

      {/* Save Score Confirmation Modal */}
      <Modal
        show={showScoreModal}
        onClose={() => setShowScoreModal(false)}
        size="md"
        popup
      >
        <ModalHeader />
        <ModalBody>
          <div className="flex flex-col gap-5">
            <div>
              <p className="text-base font-medium text-gray-300">
                Save score for this submission?
              </p>
              <p className="mt-1 text-sm text-gray-500">
                The score <span className="font-semibold text-white">{scoreInput}</span>
                {submission.maxMark != null && submission.maxMark > 0 && (
                  <span className="text-gray-500"> / {submission.maxMark}</span>
                )}
                {' '}will be saved and the submission will be marked as graded.
              </p>
            </div>

            <div className="flex items-start gap-3 rounded-lg border border-blue-800/50 bg-blue-900/20 p-3">
              <input
                id="send-feedback-checkbox"
                type="checkbox"
                checked={sendFeedbackToStudent}
                onChange={(e) => setSendFeedbackToStudent(e.target.checked)}
                className="mt-0.5 h-4 w-4 cursor-pointer rounded border-gray-600 bg-gray-700 text-blue-500 focus:ring-blue-600 focus:ring-offset-gray-800"
              />
              <label htmlFor="send-feedback-checkbox" className="cursor-pointer">
                <span className="text-sm font-medium text-gray-200">
                  Send feedback to student
                </span>
                <p className="mt-0.5 text-xs text-gray-400">
                  Notify the student about the feedback you have written in the Lecturer Note tab.
                </p>
              </label>
            </div>

            {sendFeedbackToStudent && (
              <div className="rounded-md border border-gray-700 bg-gray-800/50 p-3">
                <p className="mb-1 text-xs font-medium text-gray-400">Feedback preview:</p>
                <p className="text-sm text-gray-300">
                  {lecturerFeedback.trim() || <span className="italic text-gray-500">No feedback written yet</span>}
                </p>
              </div>
            )}
          </div>
        </ModalBody>
        <ModalFooter>
          <Button
            color="gray"
            onClick={() => setShowScoreModal(false)}
            className="cursor-pointer"
          >
            Cancel
          </Button>
          <Button
            color="blue"
            onClick={() => void confirmSaveScore()}
            disabled={savingScore}
            className="cursor-pointer"
          >
            {savingScore ? <Spinner size="sm" /> : null}
            {savingScore ? 'Saving...' : 'Save Score'}
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
}

'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Spinner,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeadCell,
  TableRow,
  Badge,
  Button,
  Tooltip,
  Accordion,
  AccordionPanel,
  AccordionTitle,
  AccordionContent,
  Card,
  Alert,
  Label,
  Select,
  HR,
} from 'flowbite-react';
import {
  MagnifyingGlassIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ArrowPathIcon,
  EyeIcon,
  CodeBracketSquareIcon,
  Cog6ToothIcon,
} from '@heroicons/react/24/outline';
import type { Examination } from '@/types/examination';
import type { ClassroomStudentResponse } from '@/types/classroom';
import type { ErrorGroupSummary } from '@/types/error-group';
import type { TestCaseResponse } from '@/types/problem';
import type { ProgrammingLanguage } from '@/types/language';
import { useStudentClassroom } from '@/hooks/classroom/useStudentClassroom';
import { useErrorGroup } from '@/hooks/error-group/useErrorGroup';
import { useProblem } from '@/hooks/problem/useProblem';
import { useSubmission } from '@/hooks/submission/useSubmission';
import { formatDate } from '@/utils/datetime-utils';
import { SimilarityDiffModal } from './similarity-diff-modal';
import { useToast } from '@/hooks/useToast';
import { SimilarityTabSkeleton } from '@/components/ui/skeletons';

export type SimilarityTabContentProps = {
  examination: Examination;
};

export function SimilarityTabContent({ examination }: SimilarityTabContentProps) {
  const { getStudentsByClassId } = useStudentClassroom();
  const { getProblemsByIds } = useProblem();
  const {
    getErrorGroupsByProblem,
    getErrorGroupsByExam,
    generateErrorGroups,
    checkSimilarity,
    getRecommendedMinTokenMatch
  } = useErrorGroup();
  const { getLatestSubmissionsByExam } = useSubmission();
  const { showSuccess, showError, showWarning } = useToast();

  const [students, setStudents] = useState<ClassroomStudentResponse[]>([]);
  const [submissionIdToName, setSubmissionIdToName] = useState<Record<string, string>>({});
  const [problemDetails, setProblemDetails] = useState<Record<string, string>>({});
  const [testCaseMap, setTestCaseMap] = useState<Record<string, TestCaseResponse>>({});
  const [problemGroups, setProblemGroups] = useState<Record<string, ErrorGroupSummary[]>>({});
  const [loading, setLoading] = useState(true);
  const [actionLoadingPerProblem, setActionLoadingPerProblem] = useState<Record<string, boolean>>({});
  const [actionLoadingPerGroup, setActionLoadingPerGroup] = useState<Record<string, boolean>>({});
  const [selectedProblemId, setSelectedProblemId] = useState<string>('all');

  const [settingsModalProblemId, setSettingsModalProblemId] = useState<string | null>(null);
  const [similaritySettings, setSimilaritySettings] = useState<Record<string, {
    minTokenMatch?: number;
    minSimilarity: number;
    excludeBaseCode: boolean;
  }>>({});
  const [recommendLoading, setRecommendLoading] = useState(false);
  const [recommendedValue, setRecommendedValue] = useState<number | null>(null);

  const [diffModalPair, setDiffModalPair] = useState<{
    groupId: string;
    sub1Id: string;
    sub2Id: string;
    name1: string;
    name2: string;
    score: number;
    problemTitle: string;
    language: ProgrammingLanguage;
  } | null>(null);

  const classId = examination.classroom?.id;
  const examId = examination.id;
  const examProblems = useMemo(() => examination.examProblems ?? [], [examination.examProblems]);

  const studentIdToName = useMemo(() => students.reduce<Record<string, string>>(
    (acc, s) => ({ ...acc, [s.studentId]: s.fullname || s.email || s.studentId }),
    {}
  ), [students]);

  const fetchData = useCallback(async () => {
    if (!classId || !examId) return;
    setLoading(true);
    try {
      const studentRes = await getStudentsByClassId(classId);
      setStudents(studentRes);

      const submissionGroups = await getLatestSubmissionsByExam(examId);
      const subMap: Record<string, string> = {};
      submissionGroups.forEach((group: any) => {
        group.submissions?.forEach((s: any) => {
          subMap[s.id] = s.student?.fullname || s.studentId || s.id;
        });
      });
      setSubmissionIdToName(subMap);

      const allGroups = await getErrorGroupsByExam(examId);
      const groupMap: Record<string, ErrorGroupSummary[]> = {};

      allGroups.forEach((group: ErrorGroupSummary) => {
        if (!groupMap[group.problemId]) {
          groupMap[group.problemId] = [];
        }
        groupMap[group.problemId].push(group);
      });

      setProblemGroups(groupMap);
    } catch (err) {
      console.error('Failed to load similarity data', err);
    } finally {
      setLoading(false);
    }
  }, [classId, examId, getStudentsByClassId, getErrorGroupsByExam, getLatestSubmissionsByExam]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    const fetchProblemTitles = async () => {
      const ids = examProblems.map(p => p.problemId);
      if (ids.length === 0) return;
      try {
        const details = await getProblemsByIds(ids);
        const titleMap = details.reduce<Record<string, string>>((acc, p) => ({
          ...acc,
          [p.id]: p.title
        }), {});
        setProblemDetails(titleMap);

        const tcMap = details.reduce<Record<string, TestCaseResponse>>((acc, p) => {
          if (p.testCases) {
            p.testCases.forEach(tc => {
              acc[tc.id] = tc;
            });
          }
          return acc;
        }, {});
        setTestCaseMap(tcMap);
      } catch (err) {
        console.error('Failed to fetch problem titles', err);
      }
    };
    fetchProblemTitles();
  }, [examProblems, getProblemsByIds]);

  const handleGenerateGroups = async (problemId: string) => {
    try {
      setActionLoadingPerProblem(prev => ({ ...prev, [problemId]: true }));
      const count = await generateErrorGroups({ examId, problemId });

      if (count === 0) {
        showWarning("No error groups created because there aren't at least 2 submissions with the same error signature.");
      } else {
        showSuccess(`Successfully classified submissions into ${count} groups.`);
      }

      const groups = await getErrorGroupsByProblem(examId, problemId);
      setProblemGroups(prev => ({ ...prev, [problemId]: groups }));
    } catch (err) {
      console.error('Failed to generate groups', err);
      showError("Failed to classify students. Please try again.");
    } finally {
      setActionLoadingPerProblem(prev => ({ ...prev, [problemId]: false }));
    }
  };

  const handleScanSimilarityForProblem = async (problemId: string) => {
    try {
      setActionLoadingPerProblem(prev => ({ ...prev, [problemId]: true }));
      const groups = problemGroups[problemId] || [];
      const groupIds = groups.map(g => g.id);

      if (groupIds.length === 0) {
        showWarning("No groups available to scan similarity.");
        return;
      }

      const settings = similaritySettings[problemId];

      await checkSimilarity({
        examId,
        problemId,
        groupIds: groupIds.length > 0 ? groupIds : undefined,
        minTokenMatch: settings?.minTokenMatch,
        minSimilarity: settings?.minSimilarity,
        excludeBaseCode: settings?.excludeBaseCode,
      });

      showSuccess("Scan completed successfully.");
      await fetchData();
    } catch (err) {
      console.error('Failed to scan similarity', err);
      showError("Failed to scan.");
    } finally {
      setActionLoadingPerProblem(prev => ({ ...prev, [problemId]: false }));
    }
  };

  const handleOpenSettings = (problemId: string) => {
    setSettingsModalProblemId(problemId);
    setRecommendedValue(null);
    if (!similaritySettings[problemId]) {
      setSimilaritySettings(prev => ({
        ...prev,
        [problemId]: {
          minTokenMatch: undefined,
          minSimilarity: 0,
          excludeBaseCode: true,
        }
      }));
    }
  };

  const handleRecommendMinTokenMatch = async () => {
    if (!settingsModalProblemId) return;
    setRecommendLoading(true);
    try {
      const recommended = await getRecommendedMinTokenMatch(examId, settingsModalProblemId);
      setRecommendedValue(recommended);
      setSimilaritySettings(prev => ({
        ...prev,
        [settingsModalProblemId]: {
          ...prev[settingsModalProblemId],
          minTokenMatch: recommended,
        }
      }));
      showSuccess(`Recommended MinTokenMatch: ${recommended}`);
    } catch (err) {
      console.error('Failed to get recommendation', err);
      showError("Failed to calculate recommendation.");
    } finally {
      setRecommendLoading(false);
    }
  };

  const renderSignature = (signature: string) => {
    if (!signature) return null;
    
    let parts: string[] = [];
    if (signature.includes('###')) {
      parts = signature.split('###');
    } else {
      parts = signature.split('_').reduce((acc: string[], curr: string) => {
        if (acc.length > 0 && (curr.startsWith('ERROR|') || acc[acc.length - 1].split('|').length < 3)) {
          acc[acc.length - 1] += '_' + curr;
        } else {
          acc.push(curr);
        }
        return acc;
      }, []);
    }

    return (
      <div className="text-xs font-mono text-gray-600 bg-gray-50 p-2.5 rounded border border-gray-200 dark:bg-gray-900 dark:border-gray-800 space-y-1 w-full max-w-4xl mt-2 line-clamp-4 hover:line-clamp-none transition-all">
        <div className="font-bold text-gray-800 dark:text-gray-200 mb-1">Failed test cases:</div>
        {parts.map((p, idx) => {
          const signatureParts = p.split('|');
          if (signatureParts.length < 2) {
            return <div key={idx} className="text-red-600 dark:text-red-400 whitespace-pre-wrap">{p}</div>;
          }

          const tcId = signatureParts[0].trim();
          const status = signatureParts[1].trim();
          const actualOutput = signatureParts.length > 2 ? signatureParts[2].trim().replace(/\n/g, ' ') : 'NoOutput';
          const tc = testCaseMap[tcId];

          if (!tc) {
            return (
              <div key={idx} className="text-red-600 dark:text-red-400 break-words border-b border-gray-100 dark:border-gray-800 pb-1 last:border-0 last:pb-0">
                <span className="font-semibold text-gray-800 dark:text-gray-200">TC:</span> {tcId} <span className="mx-2 text-gray-300">|</span>
                <span className="font-semibold text-[#1F4E79] dark:text-blue-400">Status:</span> {status} <span className="mx-2 text-gray-300">|</span>
                <span className="font-semibold text-red-700 dark:text-red-300">Actual:</span> {actualOutput}
              </div>
            );
          }

          const cleanInput = tc.inputData.replace(/\n/g, ' ');
          const cleanExpected = tc.expectedOutput.replace(/\n/g, ' ');

          return (
            <div key={idx} className="text-red-600 dark:text-red-400 break-words border-b border-gray-100 dark:border-gray-800 pb-1 last:border-0 last:pb-0">
              <span className="font-semibold text-gray-800 dark:text-gray-200">Input:</span> {cleanInput} <span className="mx-2 text-gray-300">|</span>
              <span className="font-semibold text-green-700 dark:text-green-400">Expected:</span> {cleanExpected} <span className="mx-2 text-gray-300">|</span>
              <span className="font-semibold text-[#1F4E79] dark:text-blue-400">Status:</span> {status} <span className="mx-2 text-gray-300">|</span>
              <span className="font-semibold text-red-700 dark:text-red-300">Actual:</span> {actualOutput}
            </div>
          );
        })}
      </div>
    );
  };

  if (loading) {
    return <SimilarityTabSkeleton />;
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end gap-4">
        <div className="min-w-[200px]">
          <Label htmlFor="problem-filter" className="mb-1 block">
            Problem
          </Label>
          <Select
            id="problem-filter"
            value={selectedProblemId}
            onChange={(e) => setSelectedProblemId(e.target.value)}
            className="w-full cursor-pointer"
          >
            <option value="all">All problems</option>
            {examProblems.map(p => (
              <option key={p.problemId} value={p.problemId}>
                {problemDetails[p.problemId] || `Problem ${p.problemId}`}
              </option>
            ))}
          </Select>
        </div>
        <div className="ml-auto text-xs text-gray-500 self-center">
          {selectedProblemId === 'all'
            ? `Showing all ${examProblems.length} problems`
            : `Showing selected problem`}
        </div>
      </div>
      <HR />

      {examProblems
        .filter(ep => selectedProblemId === 'all' || ep.problemId === selectedProblemId)
        .map((ep, idx) => {
          const groups = problemGroups[ep.problemId] || [];
          const problemTitle = problemDetails[ep.problemId] || ep.problemId;
          const isActionLoading = actionLoadingPerProblem[ep.problemId];

          return (
            <div key={ep.problemId} className="space-y-4">
              <div className="flex items-center justify-between border-b border-gray-100 pb-2 dark:border-gray-700">
                <div>
                  <h4 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <CodeBracketSquareIcon className="h-5 w-5 text-[#1F4E79]" />
                    {problemTitle}
                  </h4>
                  <p className="text-xs text-gray-500">Max mark: {ep.mark}</p>
                </div>
                <div className="flex gap-2">
                  <Tooltip content="Similarity Settings">
                    <Button
                      size="xs"
                      color="light"
                      className="cursor-pointer"
                      onClick={() => handleOpenSettings(ep.problemId)}
                    >
                      <Cog6ToothIcon className="h-4 w-4" />
                    </Button>
                  </Tooltip>
                  <Button
                    size="xs"
                    color="light"
                    className="cursor-pointer"
                    onClick={() => fetchData()}
                    disabled={isActionLoading}
                  >
                    <ArrowPathIcon className={`h-4 w-4 ${isActionLoading ? 'animate-spin' : ''}`} />
                  </Button>
                  <Button
                    size="sm"
                    className="cursor-pointer bg-[#1F4E79] hover:bg-[#2A6BA3]"
                    onClick={() => handleGenerateGroups(ep.problemId)}
                    disabled={isActionLoading}
                  >
                    {isActionLoading ? <Spinner size="sm" className="mr-2" /> : <MagnifyingGlassIcon className="mr-2 h-4 w-4" />}
                    Find Similar Errors
                  </Button>
                  <Button
                    size="sm"
                    color="dark"
                    className="cursor-pointer font-semibold shadow-sm hover:shadow-md transition-all"
                    onClick={() => handleScanSimilarityForProblem(ep.problemId)}
                    disabled={isActionLoading || groups.length === 0}
                  >
                    {isActionLoading ? <Spinner size="sm" className="mr-2" /> : <ArrowPathIcon className="mr-2 h-4 w-4" />}
                    Scan similarity
                  </Button>
                </div>
              </div>

              {groups.length === 0 ? (
                <div className="rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 py-12 text-center dark:border-gray-700 dark:bg-gray-800/30">
                  <ExclamationTriangleIcon className="mx-auto h-10 w-10 text-gray-400" />
                  <p className="mt-2 text-sm text-gray-500">No error groups analyzed yet for <span className="font-semibold">{problemTitle}</span>.</p>
                  <p className="text-xs text-gray-400">Click "Find Similar Errors" to start classification.</p>
                </div>
              ) : (
                <div className="grid gap-6">
                  {groups.map((group, gIdx) => (
                    <Card key={group.id} className="border-l-4 border-l-[#C9A24D]">
                      <div className="space-y-4">
                        <div className="flex flex-wrap items-start justify-between gap-4">
                          <div className="space-y-1">
                            <h5 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                              Group {gIdx + 1}
                            </h5>
                            {renderSignature(group.errorSignature)}
                          </div>

                          {group.jPlagStatus === 'COMPLETED' ? (
                            <div className="flex items-center gap-2 px-3 py-1 bg-green-50 text-green-700 border border-green-100 rounded-full text-[10px] font-bold uppercase tracking-wider dark:bg-green-900/20 dark:border-green-800 dark:text-green-400">
                              <CheckCircleIcon className="h-3 w-3" />
                              <span>Scanned</span>
                            </div>
                          ) : group.jPlagStatus === 'RUNNING' ? (
                            <div className="flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-700 border border-blue-100 rounded-full text-[10px] font-bold uppercase tracking-wider animate-pulse dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-400">
                              <Spinner size="xs" color="info" />
                              <span>Scanning</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 px-3 py-1 bg-gray-50 text-gray-500 border border-gray-100 rounded-full text-[10px] font-bold uppercase tracking-wider dark:bg-gray-800/50 dark:border-gray-700 dark:text-gray-500">
                              <span>Not Scanned</span>
                            </div>
                          )}
                        </div>

                        <div className="flex flex-wrap gap-2 text-sm">
                          <span className="font-medium text-gray-700 dark:text-gray-300">Students:</span>
                          {group.submissionIds.map((sid, sidx) => (
                            <span key={sid} className="text-gray-600 dark:text-gray-400">
                              {submissionIdToName[sid] || studentIdToName[sid] || sid}{sidx < group.submissionIds.length - 1 ? ',' : ''}
                            </span>
                          ))}
                        </div>

                        {group.jPlagStatus === 'COMPLETED' && group.jPlagResults && group.jPlagResults.length > 0 && (
                          <div className="overflow-x-auto mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                            <Table hoverable striped>
                              <TableHead>
                                <TableRow>
                                  <TableHeadCell>Student 1</TableHeadCell>
                                  <TableHeadCell>Student 2</TableHeadCell>
                                  <TableHeadCell className="text-center">Similarity</TableHeadCell>
                                  <TableHeadCell className="text-center">Compare Code</TableHeadCell>
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                {group.jPlagResults
                                  .sort((a, b) => b.similarityScore - a.similarityScore)
                                  .map((match, mIdx) => {
                                    const score = Math.round(match.similarityScore * 100);
                                    const name1 = submissionIdToName[match.submission1Id] || studentIdToName[match.submission1Id] || match.submission1Id;
                                    const name2 = submissionIdToName[match.submission2Id] || studentIdToName[match.submission2Id] || match.submission2Id;

                                    return (
                                      <TableRow key={`${match.submission1Id}-${match.submission2Id}`}>
                                        <TableCell className="font-medium">{name1}</TableCell>
                                        <TableCell className="font-medium">{name2}</TableCell>
                                        <TableCell className="text-center font-bold text-base">
                                          <span
                                            className={
                                              score > 80 ? 'text-red-700' :
                                                score > 50 ? 'text-yellow-600' :
                                                  'text-green-600'
                                            }
                                          >
                                            {score}%
                                          </span>
                                        </TableCell>
                                        <TableCell className="text-center">
                                          <div className="flex justify-center">
                                            <Tooltip content="Compare detailed code highlights">
                                              <Button
                                                size="xs"
                                                outline
                                                color="dark"
                                                onClick={() => setDiffModalPair({
                                                  groupId: group.id,
                                                  sub1Id: match.submission1Id,
                                                  sub2Id: match.submission2Id,
                                                  name1,
                                                  name2,
                                                  score,
                                                  problemTitle,
                                                  language: examination.programmingLanguage
                                                })}
                                              >
                                                <EyeIcon className="h-4 w-4" />
                                              </Button>
                                            </Tooltip>
                                          </div>
                                        </TableCell>
                                      </TableRow>
                                    );
                                  })}
                              </TableBody>
                            </Table>
                          </div>
                        )}

                        {group.jPlagStatus === 'COMPLETED' && (!group.jPlagResults || group.jPlagResults.length === 0) && (
                          <Alert color="success" className="mt-2">
                            Excellent! JPlag scan completed and detected NO significant similarities within this group.
                          </Alert>
                        )}
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          );
        })}

      <SimilarityDiffModal
        pair={diffModalPair}
        onClose={() => setDiffModalPair(null)}
      />

      {settingsModalProblemId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 bg-gradient-to-r from-[#1F4E79]/10 to-[#C9A24D]/10">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[#1F4E79] rounded-lg">
                  <Cog6ToothIcon className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">Similarity Settings</h3>
                  <p className="text-xs text-gray-500">{problemDetails[settingsModalProblemId] || settingsModalProblemId}</p>
                </div>
              </div>
            </div>

            <div className="px-6 py-5 space-y-6">
              <div className="space-y-3">
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Minimum Token Match
                </label>
                <p className="text-xs text-gray-500 leading-relaxed">
                  The minimum number of consecutive code structures that must match to be flagged as plagiarism.
                  A lower value increases detection sensitivity, while a higher value reduces false positives.
                </p>
                <input
                  type="number"
                  min={3}
                  max={50}
                  value={similaritySettings[settingsModalProblemId]?.minTokenMatch ?? ''}
                  onChange={(e) => {
                    const val = e.target.value ? parseInt(e.target.value) : undefined;
                    setSimilaritySettings(prev => ({
                      ...prev,
                      [settingsModalProblemId!]: {
                        ...prev[settingsModalProblemId!],
                        minTokenMatch: val,
                      }
                    }));
                  }}
                  placeholder="Auto (system calculates)"
                  className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white text-sm py-2.5 px-3 focus:ring-[#1F4E79] focus:border-[#1F4E79]"
                />
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    className="cursor-pointer bg-[#C9A24D] hover:bg-[#B08A3E] text-white whitespace-nowrap"
                    onClick={handleRecommendMinTokenMatch}
                    disabled={recommendLoading}
                  >
                    {recommendLoading ? <Spinner size="sm" className="mr-1" /> : null}
                    Suggest
                  </Button>
                  {recommendedValue !== null && (
                    <span className="text-xs text-green-600 dark:text-green-400 font-medium">
                      Recommended value: <span className="font-bold">{recommendedValue}</span>
                    </span>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Minimum Similarity Threshold
                </label>
                <p className="text-xs text-gray-500 leading-relaxed">
                  Only pairs with similarity above this threshold will appear in results.
                </p>
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min={0}
                    max={100}
                    step={5}
                    value={Math.round((similaritySettings[settingsModalProblemId]?.minSimilarity ?? 0) * 100)}
                    onChange={(e) => {
                      setSimilaritySettings(prev => ({
                        ...prev,
                        [settingsModalProblemId!]: {
                          ...prev[settingsModalProblemId!],
                          minSimilarity: parseInt(e.target.value) / 100,
                        }
                      }));
                    }}
                    className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 accent-[#1F4E79]"
                  />
                  <span className="text-sm font-bold text-[#1F4E79] dark:text-blue-400 min-w-[45px] text-right">
                    {Math.round((similaritySettings[settingsModalProblemId]?.minSimilarity ?? 0) * 100)}%
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Exclude Base Code
                </label>
                <p className="text-xs text-gray-500 leading-relaxed">
                  When enabled, the code template provided by the lecturer will be excluded from the comparison,
                  ensuring only student-written code is analyzed.
                </p>
                <div className="flex items-center gap-3 pt-1">
                  <button
                    type="button"
                    role="switch"
                    aria-checked={similaritySettings[settingsModalProblemId]?.excludeBaseCode ?? true}
                    onClick={() => {
                      setSimilaritySettings(prev => ({
                        ...prev,
                        [settingsModalProblemId!]: {
                          ...prev[settingsModalProblemId!],
                          excludeBaseCode: !(prev[settingsModalProblemId!]?.excludeBaseCode ?? true),
                        }
                      }));
                    }}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[#1F4E79] focus:ring-offset-2 ${(similaritySettings[settingsModalProblemId]?.excludeBaseCode ?? true)
                      ? 'bg-[#1F4E79]'
                      : 'bg-gray-300 dark:bg-gray-600'
                      }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-lg transition-transform ${(similaritySettings[settingsModalProblemId]?.excludeBaseCode ?? true) ? 'translate-x-6' : 'translate-x-1'
                        }`}
                    />
                  </button>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {(similaritySettings[settingsModalProblemId]?.excludeBaseCode ?? true) ? 'Enabled (Recommended)' : 'Disabled'}
                  </span>
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-700 flex justify-end gap-3 bg-gray-50 dark:bg-gray-800/50">
              <Button
                size="sm"
                color="light"
                className="cursor-pointer"
                onClick={() => setSettingsModalProblemId(null)}
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

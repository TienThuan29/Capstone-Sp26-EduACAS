"use client";

import React, { useState, useEffect } from 'react';
import { Button, Card, Badge, Spinner, Textarea } from 'flowbite-react';
import {
  ClockIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';
import { QuizAttemptResponse, QuizQuestion } from '@/types/quiz';
import { useQuizAttempt } from '@/hooks/quiz/useQuizAttempt';
import { useToast } from '@/hooks/useToast';
import ReactMarkdown from 'react-markdown';

interface QuizTakingViewProps {
  attempt: QuizAttemptResponse | null;
  onSubmitted: () => void;
  readOnly?: boolean;
  onBack?: () => void;
}

export const QuizTakingView: React.FC<QuizTakingViewProps> = ({ attempt, onSubmitted, readOnly = false, onBack }) => {
  const initialAnswers = React.useMemo(() => {
    const answers: Record<string, string> = {};
    if (attempt?.answers) {
      Object.entries(attempt.answers).forEach(([k, v]) => {
        answers[k.toLowerCase()] = v;
      });
    }
    return answers;
  }, [attempt?.answers]);

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>(initialAnswers);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { updateAnswer, submitAttempt } = useQuizAttempt();
  const { showSuccess, showError } = useToast();

  const questions = attempt?.questions || [];
  const currentQuestion = questions[currentQuestionIndex];

  const handleAutoSubmit = React.useCallback(async () => {
    if (attempt && !isSubmitting && !readOnly && attempt.status === 'INPROGRESS') {
      setIsSubmitting(true);
      try {
        const result = await submitAttempt(attempt.id);
        if (result) {
          showSuccess("Time's up! Your quiz has been submitted.");
          onSubmitted();
        }
      } catch {
        showError("Failed to auto-submit quiz.");
      } finally {
        setIsSubmitting(false);
      }
    }
  }, [attempt, isSubmitting, submitAttempt, showSuccess, showError, onSubmitted, readOnly]);

  useEffect(() => {
    if (!attempt || !attempt.endTime || readOnly || attempt.status !== 'INPROGRESS') return;

    const endTime = new Date(attempt.endTime).getTime();

    const updateTimer = () => {
      const now = new Date().getTime();
      const diff = endTime - now;
      if (diff <= 0) {
        setTimeLeft(0);
        return true;
      }
      setTimeLeft(diff);
      return false;
    };

    if (updateTimer()) {
      handleAutoSubmit();
      return;
    }

    const timer = setInterval(() => {
      if (updateTimer()) {
        clearInterval(timer);
        handleAutoSubmit();
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [attempt, handleAutoSubmit, readOnly]);

  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const isTimeCritical = timeLeft < 60000;

  const handleAnswerSelect = async (questionId: string, selectedOption: string) => {
    if (isSubmitting || readOnly) return;

    let newValue = selectedOption;
    const currentQ = questions.find(q => q.id === questionId);

    if (currentQ?.type === 'MULTIPLE_CHOICE') {
      const currentSelections = selectedAnswers[questionId.toLowerCase()] ? selectedAnswers[questionId.toLowerCase()].split(',') : [];
      if (currentSelections.includes(selectedOption)) {
        newValue = currentSelections.filter(id => id !== selectedOption).join(',');
      } else {
        newValue = [...currentSelections, selectedOption].join(',');
      }
    }

    setSelectedAnswers(prev => ({ ...prev, [questionId.toLowerCase()]: newValue }));
    if (attempt) {
      await updateAnswer(attempt.id, { questionId, selectedOptionId: newValue });
    }
  };

  const handleTextChange = async (questionId: string, text: string) => {
    if (isSubmitting || readOnly) return;
    setSelectedAnswers(prev => ({ ...prev, [questionId.toLowerCase()]: text }));
    if (attempt) {
      await updateAnswer(attempt.id, { questionId, textAnswer: text });
    }
  };

  const handleSubmit = async () => {
    if (!attempt || isSubmitting) return;
    if (confirm("Are you sure you want to submit your quiz?")) {
      setIsSubmitting(true);
      try {
        const result = await submitAttempt(attempt.id);
        if (result) {
          showSuccess("Quiz submitted successfully!");
          onSubmitted();
        }
      } catch {
        showError("Failed to submit quiz.");
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  if (!attempt) return null;

  if (!currentQuestion) {
    return (
      <div className="flex justify-center items-center py-20">
        <Spinner size="xl" />
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6 min-h-[calc(100vh-200px)] animate-in fade-in duration-500 max-w-7xl mx-auto px-2 sm:px-4">
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb { background: #475569; }
      `}</style>

      <div className="w-full lg:w-72 flex flex-col gap-4">
        <Card className="border-none shadow-md bg-white dark:bg-gray-800 ring-1 ring-gray-200 dark:ring-gray-700">
          <div className="space-y-5">
            <div className="border-b border-gray-100 dark:border-gray-700 pb-3">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white line-clamp-2 leading-snug">
                {attempt.quizTitle}
              </h3>
              <div className="flex items-center gap-2 mt-2">
                <Badge color="info" size="xs" className="px-2 py-0.5 font-medium rounded-md">Attempt: {attempt.attemptNumber}</Badge>
                <Badge color="gray" size="xs" className="px-2 py-0.5 font-medium rounded-md">{questions.length} Questions</Badge>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-500 dark:text-gray-400 font-semibold uppercase tracking-tight">Progress</span>
                <span className="font-bold text-[#1F4E79] dark:text-blue-400">
                  {Object.keys(selectedAnswers).length} / {questions.length}
                </span>
              </div>
              <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-1.5 shadow-inner">
                <div
                  className="bg-[#1F4E79] dark:bg-blue-500 h-1.5 rounded-full transition-all duration-500"
                  style={{ width: `${questions.length > 0 ? (Object.keys(selectedAnswers).length / questions.length) * 100 : 0}%` }}
                />
              </div>
            </div>

            <div className="grid grid-cols-5 sm:grid-cols-10 lg:grid-cols-5 gap-1.5 max-h-[250px] overflow-y-auto pr-1.5 custom-scrollbar">
              {questions.map((q, idx) => {
                let bgColorClass = 'bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-600';

                if (readOnly && attempt?.questionResults) {
                  const isCorrect = attempt.questionResults[q.id.toLowerCase()];
                  bgColorClass = isCorrect
                    ? 'bg-green-500 text-white dark:bg-green-600'
                    : 'bg-red-500 text-white dark:bg-red-600';
                } else if (selectedAnswers[q.id.toLowerCase()]) {
                  bgColorClass = 'bg-[#1F4E79] text-white dark:bg-blue-600';
                }

                return (
                  <button
                    key={q.id}
                    onClick={() => setCurrentQuestionIndex(idx)}
                    className={`
                      flex items-center justify-center aspect-square text-xs font-bold rounded-lg border-2 transition-all duration-200
                      ${currentQuestionIndex === idx
                        ? 'border-gray-900 dark:border-white ring-2 ring-gray-100 dark:ring-gray-900/30 scale-105 z-10'
                        : 'border-transparent'}
                      ${bgColorClass}
                    `}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>

            <div className="pt-1">
              {!readOnly ? (
                <Button
                  color="info"
                  className="w-full bg-[#1F4E79] hover:bg-[#2A6BA3] dark:bg-blue-600 dark:hover:bg-blue-700 text-white font-extrabold shadow-sm transition-all rounded-lg uppercase tracking-widest text-xs"
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? <Spinner size="sm" className="mr-2" /> : null}
                  SUBMIT QUIZ
                </Button>
              ) : (
                <Button
                  color="gray"
                  className="w-full font-extrabold shadow-sm transition-all rounded-lg uppercase tracking-widest text-xs"
                  onClick={onBack}
                >
                  BACK TO LIST
                </Button>
              )}
            </div>
          </div>
        </Card>
      </div>

      <div className="flex-1 flex flex-col gap-4">
        <Card className="flex-1 border-none shadow-lg bg-white dark:bg-gray-800 ring-1 ring-gray-100 dark:ring-gray-700 overflow-hidden relative">
          {!readOnly && (
            <div className="absolute top-4 right-4 z-20 pointer-events-none">
              <div className={`
                flex items-center gap-2 px-3 py-1.5 rounded-xl font-mono text-lg font-black shadow-sm border-2 pointer-events-auto transition-all duration-300
                ${isTimeCritical
                  ? 'text-white bg-red-600 border-red-400 animate-pulse'
                  : timeLeft < 300000
                    ? 'text-red-600 bg-red-50 dark:bg-red-950/20 border-red-100 dark:border-red-900/40'
                    : 'text-[#1F4E79] bg-gray-50 dark:bg-gray-900/60 border-gray-100 dark:border-gray-800 dark:text-blue-400'}
              `}>
                <ClockIcon className={`h-4 w-4 ${isTimeCritical ? 'text-white' : 'text-[#1F4E79] dark:text-blue-400'}`} />
                {formatTime(timeLeft)}
              </div>
            </div>
          )}

          <div className="space-y-6 pt-2">
            <div className="relative group">
              <style>{`
                .question-content img {
                  max-width: 100%;
                  height: auto;
                  border-radius: 0.75rem;
                  margin: 1.5rem auto;
                  display: block;
                  box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
                  border: 1px solid rgba(0,0,0,0.05);
                }
              `}</style>
              <div className="max-h-[550px] overflow-y-auto pr-2 custom-scrollbar p-1">
                <div className="bg-gray-50 dark:bg-gray-700/20 p-5 sm:p-7 rounded-xl border-l-[6px] border-[#1F4E79] dark:border-blue-500 shadow-sm relative">
                  <div className="absolute top-2 right-4">
                    <Badge color="indigo" size="xs" className="opacity-80 font-bold uppercase tracking-widest">
                      {currentQuestion.type === 'MULTIPLE_CHOICE'
                        ? `MULTIPLE CHOICE (SELECT ${currentQuestion.correctCount})`
                        : currentQuestion.type.replace('_', ' ')}
                    </Badge>
                  </div>
                  <div className="question-content text-base sm:text-lg leading-relaxed text-gray-800 dark:text-gray-100 prose prose-slate dark:prose-invert max-w-none font-medium">
                    <ReactMarkdown>{currentQuestion.content}</ReactMarkdown>
                  </div>
                </div>
              </div>
              <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-white dark:from-gray-800 to-transparent pointer-events-none rounded-b-xl opacity-30"></div>
            </div>

            {currentQuestion.type === 'ESSAY' ? (
              <div className="space-y-4">
                {readOnly ? (
                  <div className={`p-5 rounded-xl border-2 min-h-[150px] whitespace-pre-wrap text-base transition-all duration-300 ${selectedAnswers[currentQuestion.id.toLowerCase()]
                    ? (questions[currentQuestionIndex].id === currentQuestion.id && (selectedAnswers[currentQuestion.id.toLowerCase()]?.trim().toLowerCase() === currentQuestion.textAnswer?.trim().toLowerCase())
                      ? 'bg-green-50 border-green-200 text-green-900 dark:bg-green-900/10 dark:border-green-800 dark:text-green-100'
                      : 'bg-red-50 border-red-200 text-red-900 dark:bg-red-900/10 dark:border-red-800 dark:text-red-100')
                    : 'bg-gray-50 border-gray-200 text-gray-500 italic dark:bg-gray-800 dark:border-gray-700'
                    }`}>
                    <div className="text-[10px] uppercase tracking-widest font-bold opacity-50 mb-2">Student's Input</div>
                    {selectedAnswers[currentQuestion.id.toLowerCase()] || "No answer provided."}
                  </div>
                ) : (
                  <div className="relative">
                    <Textarea
                      id="essay-answer"
                      placeholder="Type your answer here..."
                      required
                      rows={8}
                      value={selectedAnswers[currentQuestion.id.toLowerCase()] || ''}
                      onChange={(e) => handleTextChange(currentQuestion.id, e.target.value)}
                      disabled={isSubmitting}
                      className="focus:ring-[#1F4E79] dark:focus:ring-blue-500 border-2 rounded-xl text-base"
                    />
                    <div className="absolute bottom-2 right-3 text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                      {(selectedAnswers[currentQuestion.id.toLowerCase()] || '').length} characters
                    </div>
                  </div>
                )}

                {readOnly && (
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 rounded-xl space-y-2">
                    <h4 className="text-sm font-bold text-blue-800 dark:text-blue-300 flex items-center gap-1.5 uppercase tracking-wider">
                      Correct Answer
                    </h4>
                    <div className="text-gray-700 dark:text-gray-300 text-sm whitespace-pre-wrap leading-relaxed italic">
                      {currentQuestion.textAnswer || "No reference answer provided for this question."}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-2">
                {currentQuestion.options.map((option, idx) => {
                  const label = String.fromCharCode(65 + idx);
                  const currentRawSelection = selectedAnswers[currentQuestion.id.toLowerCase()] || "";
                  const selections = currentRawSelection.split(',').filter(Boolean);
                  const isSelected = selections.includes(option.id);
                  const isCorrect = option.isCorrect;

                  let borderStyle = 'border-gray-50 hover:border-blue-100 bg-white dark:bg-gray-800 dark:border-gray-700 hover:shadow-md dark:hover:border-blue-900/40';
                  let iconStyle = 'border-gray-200 text-gray-400 group-hover:border-blue-300 group-hover:text-blue-500 dark:border-gray-600';
                  let textStyle = 'text-gray-700 dark:text-gray-300 font-medium';

                  if (isSelected && !readOnly) {
                    borderStyle = 'border-[#1F4E79] bg-blue-50/30 dark:border-blue-500 dark:bg-blue-900/20 shadow-sm scale-[1.01] z-10';
                    iconStyle = 'bg-[#1F4E79] border-[#1F4E79] text-white dark:bg-blue-500 dark:border-blue-500';
                    textStyle = 'text-[#1F4E79] dark:text-blue-100 font-bold';
                  } else if (readOnly) {
                    const hasSelectedAny = selections.length > 0;
                    const isMultiple = currentQuestion.type === 'MULTIPLE_CHOICE';

                    if (isCorrect && isSelected) {
                      borderStyle = 'border-green-500 bg-green-50 dark:bg-green-900/20 shadow-sm scale-[1.01] z-10';
                      iconStyle = 'bg-green-500 border-green-500 text-white shadow-[0_0_8px_rgba(34,197,94,0.4)]';
                      textStyle = 'text-green-700 dark:text-green-300 font-bold';
                    } else if (isCorrect && !isSelected) {
                      if (hasSelectedAny && !isMultiple) {
                        borderStyle = 'border-green-500/50 border-dashed bg-green-50/10 dark:bg-green-900/5';
                        iconStyle = 'bg-green-500/50 border-green-500/50 text-white';
                        textStyle = 'text-green-700/70 dark:text-green-400/70 font-medium italic';
                      } else {
                        borderStyle = 'border-amber-400 border-dashed bg-amber-50/30 dark:bg-amber-900/10 opacity-80';
                        iconStyle = 'bg-amber-400 border-amber-400 text-white';
                        textStyle = 'text-amber-700 dark:text-amber-300 font-medium italic';
                      }
                    } else if (!isCorrect && isSelected) {
                      borderStyle = 'border-red-500 bg-red-50 dark:bg-red-900/20 shadow-sm scale-[1.01] z-10';
                      iconStyle = 'bg-red-500 border-red-500 text-white';
                      textStyle = 'text-red-700 dark:text-red-300 font-bold';
                    }
                  }

                  return (
                    <button
                      key={option.id}
                      disabled={isSubmitting || readOnly}
                      onClick={() => handleAnswerSelect(currentQuestion.id, option.id)}
                      className={`group relative flex items-start gap-4 p-4 rounded-xl border-2 transition-all duration-200 text-left ${borderStyle}`}
                    >
                      <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border-[1.5px] font-bold text-xs transition-all duration-200 ${iconStyle}`}>
                        {label}
                      </div>
                      <div className="flex-1 pt-0.5">
                        <span className={`text-sm sm:text-base leading-relaxed transition-colors duration-200 ${textStyle}`}>
                          {option.content}
                        </span>
                      </div>

                      {isSelected && !readOnly && (
                        <div className="absolute top-2 right-2">
                          <div className="bg-[#1F4E79] dark:bg-blue-500 rounded-full p-0.5">
                            <CheckCircleIcon className="h-3.5 w-3.5 text-white" />
                          </div>
                        </div>
                      )}

                      {readOnly && (
                        <div className="absolute top-2 right-2">
                          {isCorrect && isSelected && (
                            <Badge color="success" size="xs" className="px-1.5 py-0.5 border border-green-200 uppercase tracking-tighter shadow-sm">Your Correct Pick</Badge>
                          )}
                          {isCorrect && !isSelected && (
                            (selections.length > 0 && currentQuestion.type !== 'MULTIPLE_CHOICE') ? (
                              <Badge color="success" size="xs" className="px-1.5 py-0.5 border border-green-200 opacity-60 uppercase tracking-tighter">Correct Answer</Badge>
                            ) : (
                              <Badge color="warning" size="xs" className="px-1.5 py-0.5 border border-amber-200 uppercase tracking-tighter shadow-sm">Missed Correct Answer</Badge>
                            )
                          )}
                          {!isCorrect && isSelected && (
                            <Badge color="failure" size="xs" className="px-1.5 py-0.5 border border-red-200 uppercase tracking-tighter text-red-600 shadow-sm">Your Answer</Badge>
                          )}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </Card>

        <div className="flex justify-between items-center mt-2 px-1">
          <Button
            color="gray"
            size="sm"
            disabled={currentQuestionIndex === 0}
            onClick={() => {
              setCurrentQuestionIndex(prev => prev - 1);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="cursor-pointer shadow-sm hover:shadow-md rounded-lg px-6 font-bold bg-gray-50 hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-700 border-gray-100 dark:border-gray-700 text-gray-700 dark:text-gray-100"
          >
            <ChevronLeftIcon className="h-4 w-4 mr-2" />
            Previous
          </Button>

          <div className="text-xs font-bold text-gray-400 uppercase tracking-widest tabular-nums italic opacity-80">
            {currentQuestionIndex + 1} <span className="opacity-30 mx-1">/</span> {questions.length}
          </div>

          <Button
            color="gray"
            size="sm"
            disabled={currentQuestionIndex === questions.length - 1}
            onClick={() => {
              setCurrentQuestionIndex(prev => prev + 1);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="cursor-pointer shadow-sm hover:shadow-md rounded-lg px-6 font-bold bg-gray-50 hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-700 border-gray-100 dark:border-gray-700 text-gray-700 dark:text-gray-100"
          >
            Next
            <ChevronRightIcon className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );
};

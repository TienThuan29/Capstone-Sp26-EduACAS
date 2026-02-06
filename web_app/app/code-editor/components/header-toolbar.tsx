'use client';

import React, { useState } from 'react';
import {
  ChevronDown,
  Sun,
  Moon,
  Timer,
  Play,
  Pause,
  RotateCcw,
  Plus,
  Minus,
  RefreshCw,
} from 'lucide-react';
import clsx from 'clsx';
import { useEditorContext } from '../../../hooks/editor/EditorContext';
import { useTimer } from '@/hooks/editor/useTimer';
import { ProgrammingLanguage, LANGUAGE_CONFIG } from '../types';
import { ConfirmModal } from './confirm-modal';
import { Button, Dropdown, DropdownItem } from 'flowbite-react';

export function HeaderToolbar() {
  const {
    editorState,
    setLanguage,
    setFontSize,
    toggleTheme,
    resetCode,
    timerSeconds,
    isTimerRunning,
    startTimer,
    stopTimer,
    resetTimer,
    isExamMode,
  } = useEditorContext();

  const { formatted, isLow, isCritical } = useTimer(timerSeconds);
  const [showResetModal, setShowResetModal] = useState(false);

  return (
    <>
      <div className="flex items-center justify-between border-b border-gray-700 bg-gray-900 px-4 py-2">
        {/* Left Section - Language Selector */}
        <div className="flex items-center gap-4">
          {/* Language Dropdown */}
          <Dropdown
            size='sm'
            className='border border-gray-400 cursor-pointer'
            label={LANGUAGE_CONFIG[editorState.language].label}
            dismissOnClick={true}
          >
            {(Object.keys(LANGUAGE_CONFIG) as ProgrammingLanguage[]).map(
              (lang) => (
                <DropdownItem
                  key={lang}
                  onClick={() => setLanguage(lang)}
                  className={clsx(
                    editorState.language === lang && 'bg-[#1F4E79] text-white'
                  )}
                >
                  {LANGUAGE_CONFIG[lang].label}
                </DropdownItem>
              )
            )}
          </Dropdown>

          {/* Font Size Controls - not change this button style */}
          <div className="flex items-center gap-1 rounded-md border border-gray-600 bg-gray-800">
            <button
              onClick={() => setFontSize(Math.max(10, editorState.fontSize - 2))}
              className="p-1.5 text-gray-400 transition-colors hover:text-white cursor-pointer"
              title="Decrease font size"
            >
              <Minus className="h-4 w-4" />
            </button>
            <span className="min-w-[3rem] text-center text-sm text-gray-300">
              {editorState.fontSize}px
            </span>
            <button
              onClick={() => setFontSize(Math.min(24, editorState.fontSize + 2))}
              className="p-1.5 text-gray-400 transition-colors hover:text-white cursor-pointer"
              title="Increase font size"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>

          {/* Reset Code Button */}
          <Button
            size='sm'
            onClick={() => setShowResetModal(true)}
            className="flex items-center gap-1.5 rounded-md border border-gray-600 bg-gray-800 px-3 py-1.5 text-sm text-gray-300 hover:bg-gray-700 hover:text-white cursor-pointer"
            title="Reset to boilerplate code"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Reset</span>
          </Button>
        </div>

        {/* Center Section - Timer */}
        <div className="flex items-center gap-2">
          <Timer
            className={clsx(
              'h-5 w-5',
              isCritical
                ? 'animate-pulse text-red-500'
                : isLow
                  ? 'text-yellow-500'
                  : 'text-gray-400'
            )}
          />
          <span
            className={clsx(
              'font-mono text-lg font-semibold',
              isCritical
                ? 'animate-pulse text-red-500'
                : isLow
                  ? 'text-yellow-500'
                  : 'text-gray-200'
            )}
          >
            {formatted}
          </span>
          {/* <div className="ml-2 flex items-center gap-1">
            {isTimerRunning ? (
              <button
                onClick={stopTimer}
                className="rounded p-1 text-gray-400 transition-colors hover:bg-gray-700 hover:text-white"
                title="Pause timer"
              >
                <Pause className="h-4 w-4" />
              </button>
            ) : (
              <button
                onClick={startTimer}
                className="rounded p-1 text-gray-400 transition-colors hover:bg-gray-700 hover:text-white"
                title="Start timer"
              >
                <Play className="h-4 w-4" />
              </button>
            )}
            {!isExamMode && (
              <button
                onClick={resetTimer}
                className="rounded p-1 text-gray-400 transition-colors hover:bg-gray-700 hover:text-white"
                title="Reset timer"
              >
                <RotateCcw className="h-4 w-4" />
              </button>
            )}
          </div> */}
        </div>

        {/* Right Section - Theme Toggle */}
        <div className="flex items-center gap-3">
          <Button
            size='sm'
            onClick={toggleTheme}
            className="flex items-center gap-1.5 rounded-md border border-gray-600 bg-gray-800 px-3 py-1.5 text-sm text-gray-300 transition-colors hover:bg-gray-700 hover:text-white"
            title={
              editorState.theme === 'vs-dark'
                ? 'Switch to light mode'
                : 'Switch to dark mode'
            }
          >
            {editorState.theme === 'vs-dark' ? (
              <>
                <Sun className="h-4 w-4" />
                <span>Light</span>
              </>
            ) : (
              <>
                <Moon className="h-4 w-4" />
                <span>Dark</span>
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Reset Confirmation Modal */}
      <ConfirmModal
        isOpen={showResetModal}
        onClose={() => setShowResetModal(false)}
        onConfirm={() => {
          resetCode();
          setShowResetModal(false);
        }}
        title="Reset Code"
        message="Are you sure you want to reset your code to the initial boilerplate? This action cannot be undone."
        confirmText="Reset Code"  
      />
    </>
  );
}

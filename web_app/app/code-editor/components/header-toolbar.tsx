'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sun, Moon, Plus, Minus, RefreshCw } from 'lucide-react';
import { Cog6ToothIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';
import { useEditorContext } from '@/contexts/EditorContext';
import { ConfirmModal } from './confirm-modal';
import { EditorSettingsModal } from './editor-settings-modal';
import { Button, Dropdown, DropdownItem } from 'flowbite-react';

export function HeaderToolbar() {
  const router = useRouter();
  const { editorState, setFontSize, toggleTheme, resetCode, examId, examClassroomId, selectedCompiler, setSelectedCompiler } =
    useEditorContext();

  const lang = editorState.language;
  const compilers = lang?.compilers ?? [];
  const activeCompiler = selectedCompiler ?? compilers[0] ?? null;
  const dropdownLabel = compilers.length > 0 && activeCompiler
    ? `${lang?.name ?? 'Language'} - ${activeCompiler.name}`
    : (lang?.name ?? 'Language');

  const [showResetModal, setShowResetModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);

  return (
    <>
      <div className="flex items-center justify-between border-b border-gray-700 bg-gray-900 px-4 py-2">
        {/* Left Section - Back + Language Selector */}
        <div className="flex items-center gap-4">
          
          {/* Language - Compiler (from examination) */}
          <Dropdown
            size="sm"
            className="border border-gray-400 cursor-pointer"
            label={dropdownLabel}
            dismissOnClick={true}
          >
            {compilers.length > 0 ? (
              compilers.map((compiler) => (
                <DropdownItem
                  key={compiler.id}
                  onClick={() => setSelectedCompiler(compiler)}
                  className={activeCompiler?.id === compiler.id ? 'bg-[#1F4E79] text-white cursor-default' : 'cursor-pointer'}
                >
                  {lang?.name ?? 'Language'} - {compiler.name}
                </DropdownItem>
              ))
            ) : (
              <DropdownItem className="bg-[#1F4E79] text-white cursor-default">
                {lang?.name ?? 'Language'}
              </DropdownItem>
            )}
          </Dropdown>

          {/* Font Size Controls - not change this button style */}
          <div className="flex items-center gap-1 rounded-md border border-gray-600 bg-gray-800">
            <button
              onClick={() => setFontSize(Math.max(1, editorState.fontSize - 2))}
              className="p-1.5 text-gray-400 transition-colors hover:text-white cursor-pointer"
              title="Decrease font size"
            >
              <Minus className="h-4 w-4" />
            </button>
            <span className="min-w-[3rem] text-center text-sm text-gray-300">
              {editorState.fontSize}px
            </span>
            <button
              onClick={() => setFontSize(Math.min(32, editorState.fontSize + 2))}
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

        {/* Right Section - Settings & Theme */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setShowSettingsModal(true)}
            className="rounded-md border border-gray-600 bg-gray-800 p-2 text-gray-400 transition-colors hover:bg-gray-700 hover:text-white cursor-pointer"
            title="Editor settings"
          >
            <Cog6ToothIcon className="h-5 w-5" />
          </button>
          <Button
            size='sm'
            onClick={toggleTheme}
            className="flex items-center gap-1.5 rounded-md border border-gray-600 bg-gray-800 px-3 py-1.5 text-sm text-gray-300 transition-colors hover:bg-gray-700 hover:text-white cursor-pointer"
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

          {examId && examClassroomId && (
            <Button
              size='sm'
              color='red'
              onClick={() => setShowLeaveModal(true)}
              className='cursor-pointer'
              title="Back to exam problems"
            >
              <ArrowLeftIcon className="h-4 w-4" />
              <span>Leave</span>
            </Button>
          )}
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

      {/* Leave / Back to exam – confirm before navigating away */}
      <ConfirmModal
        isOpen={showLeaveModal}
        onClose={() => setShowLeaveModal(false)}
        onConfirm={() => {
          setShowLeaveModal(false);
          if (examId && examClassroomId) {
            router.push(`/my-classroom/${examClassroomId}/exam/${examId}`);
          }
        }}
        title="Leave editor?"
        message="Your code may not be saved. Are you sure you want to go back to the exam problems?"
        confirmText="Leave"
        cancelText="Stay"
      />

      {/* Editor Settings Modal */}
      <EditorSettingsModal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
      />
    </>
  );
}

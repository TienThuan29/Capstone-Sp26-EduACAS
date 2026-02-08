'use client';

import React, { useState } from 'react';
import { Sun, Moon, Plus, Minus, RefreshCw } from 'lucide-react';
import { useEditorContext } from '@/contexts/EditorContext';
import { ConfirmModal } from './confirm-modal';
import { Button, Dropdown, DropdownItem } from 'flowbite-react';

export function HeaderToolbar() {
  const { editorState, setFontSize, toggleTheme, resetCode } =
    useEditorContext();

  const [showResetModal, setShowResetModal] = useState(false);

  return (
    <>
      <div className="flex items-center justify-between border-b border-gray-700 bg-gray-900 px-4 py-2">
        {/* Left Section - Language Selector */}
        <div className="flex items-center gap-4">
          {/* Language (from examination; single language) */}
          <Dropdown
            size='sm'
            className='border border-gray-400 cursor-pointer'
            label={editorState.language?.name ?? 'Language'}
            dismissOnClick={true}
          >
            <DropdownItem
              key={editorState.language?.id}
              className='bg-[#1F4E79] text-white cursor-default'
            >
              {editorState.language?.name ?? 'Language'}
            </DropdownItem>
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

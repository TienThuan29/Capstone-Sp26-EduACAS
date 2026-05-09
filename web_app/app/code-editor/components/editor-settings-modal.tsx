'use client';

import React from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { Button, Label, Select, Checkbox } from 'flowbite-react';
import { useEditorContext } from '@/contexts/EditorContext';

interface EditorSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const FONT_FAMILY_OPTIONS = [
  { value: "'JetBrains Mono', 'Fira Code', 'Consolas', monospace", label: 'JetBrains Mono' },
  { value: "'Fira Code', 'Consolas', monospace", label: 'Fira Code' },
  { value: "'Cascadia Code', 'Cascadia Mono', 'Consolas', monospace", label: 'Cascadia Code' },
  { value: "'Source Code Pro', 'Fira Code', Consolas, monospace", label: 'Source Code Pro' },
  { value: "'IBM Plex Mono', 'Fira Code', Consolas, monospace", label: 'IBM Plex Mono' },
  { value: "'Victor Mono', 'Fira Code', Consolas, monospace", label: 'Victor Mono' },
  { value: "'Ubuntu Mono', 'Consolas', monospace", label: 'Ubuntu Mono' },
  { value: "'Inconsolata', 'Consolas', monospace", label: 'Inconsolata' },
  { value: "'Hack', 'Fira Code', Consolas, monospace", label: 'Hack' },
  { value: "'Anonymous Pro', 'Consolas', monospace", label: 'Anonymous Pro' },
  { value: "'Space Mono', 'Consolas', monospace", label: 'Space Mono' },
  { value: "'Roboto Mono', 'Consolas', monospace", label: 'Roboto Mono' },
  { value: "'Consolas', 'Courier New', monospace", label: 'Consolas' },
  { value: "'Courier New', Courier, monospace", label: 'Courier New' },
  { value: "ui-monospace, 'Cascadia Code', 'Consolas', monospace", label: 'System monospace' },
];

const CURSOR_BLINKING_OPTIONS = [
  { value: 'smooth' as const, label: 'Smooth' },
  { value: 'blink' as const, label: 'Blink' },
  { value: 'solid' as const, label: 'Solid' },
  { value: 'phase' as const, label: 'Phase' },
  { value: 'expand' as const, label: 'Expand' },
];

const DEFAULT_EDITOR_SETTINGS = {
  fontSize: 14,
  theme: 'vs-dark' as const,
  tabSize: 4,
  wordWrap: false,
  minimapEnabled: true,
  fontFamily: "'JetBrains Mono', 'Fira Code', 'Consolas', monospace",
  cursorBlinking: 'smooth' as const,
  cursorSmoothCaretAnimation: true,
};

export function EditorSettingsModal({ isOpen, onClose }: EditorSettingsModalProps) {
  const {
    editorState,
    setFontSize,
    setTheme,
    setTabSize,
    setWordWrap,
    setMinimapEnabled,
    setFontFamily,
    setCursorBlinking,
    setCursorSmoothCaretAnimation,
    resetCode,
  } = useEditorContext();

  const handleResetToDefaults = () => {
    setFontSize(DEFAULT_EDITOR_SETTINGS.fontSize);
    setTheme(DEFAULT_EDITOR_SETTINGS.theme);
    setTabSize(DEFAULT_EDITOR_SETTINGS.tabSize);
    setWordWrap(DEFAULT_EDITOR_SETTINGS.wordWrap);
    setMinimapEnabled(DEFAULT_EDITOR_SETTINGS.minimapEnabled);
    setFontFamily(DEFAULT_EDITOR_SETTINGS.fontFamily);
    setCursorBlinking(DEFAULT_EDITOR_SETTINGS.cursorBlinking);
    setCursorSmoothCaretAnimation(DEFAULT_EDITOR_SETTINGS.cursorSmoothCaretAnimation);
    resetCode();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-xs"
        onClick={onClose}
        aria-hidden
      />
      <div
        className="relative z-10 w-full max-w-md rounded-sm border border-gray-700 bg-gray-800 p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white">Editor settings</h3>
          <Button
            size="xs"
            color="gray"
            onClick={onClose}
            className="text-gray-400 hover:bg-gray-700 hover:text-white cursor-pointer"
          >
            <span className="sr-only">Close</span>
            <XMarkIcon className="h-5 w-5" />
          </Button>
        </div>

        <div className="space-y-4">
          {/* Font size */}
          <div>
            <Label htmlFor="editor-font-size" className="text-gray-300">
              Font size
            </Label>
            <input
              type="number"
              id="editor-font-size"
              min={1}
              max={32}
              value={editorState.fontSize}
              onChange={(e) => {
                const v = Number(e.target.value);
                if (!Number.isNaN(v)) setFontSize(Math.min(32, Math.max(1, v)));
              }}
              className="mt-1 block w-full rounded-lg border border-gray-600 bg-gray-700 px-3 py-2 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          {/* Theme */}
          <div>
            <Label htmlFor="editor-theme" className="text-gray-300">
              Theme
            </Label>
            <Select
              id="editor-theme"
              value={editorState.theme}
              onChange={(e) => setTheme(e.target.value as 'vs-dark' | 'vs-light')}
              className="mt-1 border-gray-600 bg-gray-700 text-white cursor-pointer"
            >
              <option value="vs-dark">Dark</option>
              <option value="vs-light">Light</option>
            </Select>
          </div>

          {/* Tab size */}
          <div>
            <Label htmlFor="editor-tab-size" className="text-gray-300">
              Tab size
            </Label>
            <Select
              id="editor-tab-size"
              value={editorState.tabSize}
              onChange={(e) => setTabSize(Number(e.target.value))}
              className="mt-1 border-gray-600 bg-gray-700 text-white cursor-pointer"
            >
              <option value={2}>2 spaces</option>
              <option value={4}>4 spaces</option>
              <option value={8}>8 spaces</option>
            </Select>
          </div>

          {/* Word wrap */}
          <div className="flex items-center gap-2">
            <Checkbox
              id="editor-word-wrap"
              checked={editorState.wordWrap}
              onChange={(e) => setWordWrap(e.target.checked)}
              className="border-gray-500 bg-gray-700 text-blue-500 focus:ring-blue-600 cursor-pointer"
            />
            <Label htmlFor="editor-word-wrap" className="text-gray-300 cursor-pointer">
              Word wrap
            </Label>
          </div>

          {/* Minimap */}
          <div className="flex items-center gap-2">
            <Checkbox
              id="editor-minimap"
              checked={editorState.minimapEnabled}
              onChange={(e) => setMinimapEnabled(e.target.checked)}
              className="border-gray-500 bg-gray-700 text-blue-500 focus:ring-blue-600 cursor-pointer"
            />
            <Label htmlFor="editor-minimap" className="text-gray-300 cursor-pointer">
              Show minimap
            </Label>
          </div>

          {/* Font family */}
          <div>
            <Label htmlFor="editor-font-family" className="text-gray-300">
              Font family
            </Label>
            <Select
              id="editor-font-family"
              value={editorState.fontFamily}
              onChange={(e) => setFontFamily(e.target.value)}
              className="mt-1 border-gray-600 bg-gray-700 text-white cursor-pointer"
            >
              {FONT_FAMILY_OPTIONS.map((opt) => (
                <option key={opt.label} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </Select>
          </div>

          {/* Cursor blinking */}
          <div>
            <Label htmlFor="editor-cursor-blinking" className="text-gray-300">
              Cursor blinking
            </Label>
            <Select
              id="editor-cursor-blinking"
              value={editorState.cursorBlinking}
              onChange={(e) => setCursorBlinking(e.target.value as typeof editorState.cursorBlinking)}
              className="mt-1 border-gray-600 bg-gray-700 text-white cursor-pointer"
            >
              {CURSOR_BLINKING_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </Select>
          </div>

          {/* Smooth caret animation */}
          <div className="flex items-center gap-2">
            <Checkbox
              id="editor-cursor-smooth"
              checked={editorState.cursorSmoothCaretAnimation}
              onChange={(e) => setCursorSmoothCaretAnimation(e.target.checked)}
              className="border-gray-500 bg-gray-700 text-blue-500 focus:ring-blue-600 cursor-pointer"
            />
            <Label htmlFor="editor-cursor-smooth" className="text-gray-300 cursor-pointer">
              Smooth caret animation
            </Label>
          </div>
        </div>

        <div className="mt-6 flex justify-between gap-3">
          <Button
            type="button"
            onClick={handleResetToDefaults}
            color="yellow"
            outline
            className="cursor-pointer"
          >
            Reset
          </Button>
          <Button onClick={onClose} color="gray" className="cursor-pointer">
            Done
          </Button>
        </div>
      </div>
    </div>
  );
}

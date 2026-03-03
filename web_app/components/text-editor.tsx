"use client";

import { EditorContent } from "@tiptap/react";
import type { Editor } from "@tiptap/react";
import { TipTapToolbar } from "@/components/tiptap-toolbar";
import { Label } from "flowbite-react";

const EDITOR_PROSE_CLASS = `prose max-w-none p-4 min-h-[300px] 
  [&_.ProseMirror]:cursor-text [&_.ProseMirror]:outline-none
  [&_h1]:text-3xl [&_h1]:font-bold [&_h1]:text-blue-600 dark:[&_h1]:text-blue-400 [&_h1]:mb-4
  [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:text-blue-500 dark:[&_h2]:text-blue-300 [&_h2]:mb-3
  [&_h3]:text-xl [&_h3]:font-semibold [&_h3]:text-gray-700 dark:[&_h3]:text-gray-300 [&_h3]:mb-2
  [&_p]:text-gray-900 dark:[&_p]:text-gray-100
  [&_li]:text-gray-900 dark:[&_li]:text-gray-100
  [&_td]:text-gray-900 dark:[&_td]:text-gray-100
  [&_th]:text-gray-900 dark:[&_th]:text-gray-100
  [&_pre]:bg-gray-50 dark:[&_pre]:bg-transparent [&_pre]:p-4 [&_pre]:rounded-lg [&_pre]:border [&_pre]:border-gray-200 dark:[&_pre]:border-gray-600
  [&_code]:text-sm [&_code]:font-mono
  [&_pre_code]:bg-transparent [&_pre_code]:text-gray-900 dark:[&_pre_code]:text-gray-100
  [&_.hljs-keyword]:text-purple-600 dark:[&_.hljs-keyword]:text-purple-400
  [&_.hljs-string]:text-green-600 dark:[&_.hljs-string]:text-green-400
  [&_.hljs-comment]:text-gray-500 dark:[&_.hljs-comment]:text-gray-400 [&_.hljs-comment]:italic
  [&_.hljs-number]:text-orange-600 dark:[&_.hljs-number]:text-orange-400
  [&_.hljs-title]:text-blue-600 dark:[&_.hljs-title]:text-blue-400
  focus:outline-none`;

type TextEditorProps = {
  editor: Editor | null;
  isDark: boolean;
  label?: string;
  helperText?: string;
};

export function TextEditor({
  editor,
  isDark,
  label,
  helperText,
}: TextEditorProps) {
  if (!editor) return null;

  return (
    <div className="flex flex-col gap-1">
      {label && (
        <Label
          className={`block ${isDark ? "text-white" : "text-gray-900"}`}
        >
          {label}
        </Label>
      )}
      <div
        className={`flex flex-col rounded-lg border ${isDark ? "border-gray-600 bg-gray-700" : "border-gray-300 bg-white"}`}
      >
        <div className="border-b bg-gray-50 p-2 dark:border-gray-600 dark:bg-gray-700">
          <TipTapToolbar editor={editor} isDark={isDark} />
        </div>
        <div className="max-h-[600px] overflow-y-auto">
          <EditorContent
            editor={editor}
            className={`${EDITOR_PROSE_CLASS} ${isDark ? "prose-invert" : ""}`}
          />
        </div>
      </div>
      {helperText && (
        <p
          className={`text-xs ${isDark ? "text-gray-400" : "text-gray-500"}`}
        >
          {helperText}
        </p>
      )}
    </div>
  );
}

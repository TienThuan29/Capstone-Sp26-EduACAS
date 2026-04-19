// Shared types for LSP completion providers — no module dependencies
// to avoid circular import issues.

export interface LspCompletionItem {
  label: string;
  kind?: number;
  detail?: string;
  documentation?: string;
  insertText?: string;
  insertTextFormat?: number;
  textEdit?: {
    range: {
      start: { line: number; character: number };
      end: { line: number; character: number };
    };
    newText: string;
  };
  sortText?: string;
  filterText?: string;
  commitCharacters?: string[];
}

export interface LspCompletionResult {
  isIncomplete?: boolean;
  items: LspCompletionItem[];
}

export interface LspHoverResult {
  contents: string | { value: string } | { value: string }[];
}

// Monaco CompletionItemKind
export const MonacoKind = {
  Text: 1,
  Method: 2,
  Function: 3,
  Constructor: 4,
  Field: 5,
  Variable: 6,
  Class: 7,
  Interface: 9,
  Module: 8,
  Property: 10,
  Unit: 11,
  Value: 12,
  Enum: 13,
  Keyword: 14,
  Snippet: 15,
  Color: 16,
  File: 17,
  Reference: 19,
  Folder: 18,
  EnumMember: 20,
  Constant: 21,
  Struct: 22,
  Event: 23,
  Operator: 24,
  TypeParameter: 25,
};
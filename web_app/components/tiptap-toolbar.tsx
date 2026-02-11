import type { Editor } from '@tiptap/react';
import { useState } from 'react';
import * as prettier from 'prettier/standalone';
import * as prettierPluginBabel from 'prettier/plugins/babel';
import * as prettierPluginEstree from 'prettier/plugins/estree';
import * as prettierPluginTypescript from 'prettier/plugins/typescript';
import * as prettierPluginHtml from 'prettier/plugins/html';
import * as prettierPluginCss from 'prettier/plugins/postcss';
import * as prettierPluginMarkdown from 'prettier/plugins/markdown';

interface TipTapToolbarProps {
    editor: Editor;
    isDark: boolean;
}

export function TipTapToolbar({ editor, isDark }: TipTapToolbarProps) {
    const [showFontSize, setShowFontSize] = useState(false);
    const [formatting, setFormatting] = useState(false);

    const buttonClass = (isActive: boolean) => `
    px-3 py-1.5 rounded text-sm font-medium transition-colors flex items-center gap-1
    ${isActive
            ? 'bg-blue-600 text-white shadow-sm'
            : `${isDark ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-white text-gray-700 hover:bg-gray-200 border border-gray-300'}`
        }
  `;

    const fontSizes = ['12px', '14px', '16px', '18px', '20px', '24px', '28px', '32px', '36px', '48px'];

    const handleFormatCode = async () => {
        if (!editor) return;

        const { state } = editor;
        const { $from } = state.selection;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let codeBlock: any = null;
        let codeBlockDepth = -1;

        for (let d = $from.depth; d > 0; d--) {
            const node = $from.node(d);
            if (node.type.name === 'codeBlock') {
                codeBlock = node;
                codeBlockDepth = d;
                break;
            }
        }

        if (!codeBlock || codeBlockDepth === -1) {
            alert('Please place your cursor inside a code block to format.');
            return;
        }

        setFormatting(true);
        try {
            const code = codeBlock.textContent;
            const language = codeBlock.attrs.language || '';

            let parser = 'babel';
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const plugins: any[] = [prettierPluginBabel, prettierPluginEstree];

            const langLower = language.toLowerCase();
            if (['javascript', 'js', 'jsx'].includes(langLower)) {
                parser = 'babel';
            } else if (['typescript', 'ts', 'tsx'].includes(langLower)) {
                parser = 'typescript';
                plugins.push(prettierPluginTypescript);
            } else if (['json', 'json5'].includes(langLower)) {
                parser = 'json';
            } else if (['html', 'htm'].includes(langLower)) {
                parser = 'html';
                plugins.push(prettierPluginHtml);
            } else if (['css', 'scss', 'less'].includes(langLower)) {
                parser = 'css';
                plugins.push(prettierPluginCss);
            } else if (['markdown', 'md'].includes(langLower)) {
                parser = 'markdown';
                plugins.push(prettierPluginMarkdown);
            } else if (!language) {
                parser = 'babel';
            } else {
                parser = 'babel';
            }

            let formatted: string;
            try {
                formatted = await prettier.format(code, {
                    parser,
                    plugins,
                    semi: true,
                    singleQuote: true,
                    tabWidth: 2,
                    trailingComma: 'es5',
                });
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } catch (prettierError: any) {
                console.warn('Prettier formatting failed, using basic indentation:', prettierError.message);

                const lines = code.split('\n');
                let indentLevel = 0;
                formatted = lines.map((line: string) => {
                    const trimmed = line.trim();

                    if (trimmed.startsWith('}') || trimmed.startsWith(']') || trimmed.startsWith(')')) {
                        indentLevel = Math.max(0, indentLevel - 1);
                    }

                    const indented = '  '.repeat(indentLevel) + trimmed;

                    if (trimmed.endsWith('{') || trimmed.endsWith('[') || trimmed.endsWith('(')) {
                        indentLevel++;
                    }

                    return indented;
                }).join('\n');
            }

            const pos = $from.before(codeBlockDepth);
            const endPos = pos + codeBlock.nodeSize;

            editor.chain()
                .command(({ tr }) => {
                    tr.replaceWith(pos, endPos, codeBlock.type.create(
                        codeBlock.attrs,
                        state.schema.text(formatted.trim())
                    ));
                    return true;
                })
                .focus()
                .setTextSelection(pos + 1)
                .run();

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (error: any) {
            console.error('Format error:', error);
        } finally {
            setFormatting(false);
        }
    };

    return (
        <div className={`flex flex-wrap gap-1.5 border-b p-2.5 ${isDark ? 'border-gray-600 bg-gray-800' : 'border-gray-300 bg-gray-50'}`}>
            <div className="flex gap-1">
                <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleBold().run()}
                    className={buttonClass(editor.isActive('bold'))}
                    title="Bold (Ctrl+B)"
                >
                    <strong>B</strong>
                </button>
                <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleItalic().run()}
                    className={buttonClass(editor.isActive('italic'))}
                    title="Italic (Ctrl+I)"
                >
                    <em>I</em>
                </button>
                <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleUnderline().run()}
                    className={buttonClass(editor.isActive('underline'))}
                    title="Underline (Ctrl+U)"
                >
                    <u>U</u>
                </button>
                <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleStrike().run()}
                    className={buttonClass(editor.isActive('strike'))}
                    title="Strikethrough"
                >
                    <s>S</s>
                </button>
            </div>

            <div className={`w-px h-6 ${isDark ? 'bg-gray-600' : 'bg-gray-300'}`} />

            <div className="flex gap-1">
                <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                    className={buttonClass(editor.isActive('heading', { level: 1 }))}
                    title="Heading 1"
                >
                    H1
                </button>
                <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                    className={buttonClass(editor.isActive('heading', { level: 2 }))}
                    title="Heading 2"
                >
                    H2
                </button>
                <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                    className={buttonClass(editor.isActive('heading', { level: 3 }))}
                    title="Heading 3"
                >
                    H3
                </button>
            </div>

            <div className={`w-px h-6 ${isDark ? 'bg-gray-600' : 'bg-gray-300'}`} />

            <div className="relative flex gap-1 items-center">
                <label className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    Size:
                </label>
                <select
                    onChange={(e) => {
                        const size = e.target.value;
                        if (size) {
                            editor.chain().focus().setMark('textStyle', { fontSize: size }).run();
                        }
                    }}
                    className={`px-2 py-1 text-sm rounded border ${isDark ? 'bg-gray-700 text-gray-300 border-gray-600' : 'bg-white text-gray-700 border-gray-300'}`}
                    title="Font Size"
                >
                    <option value="">Default</option>
                    {fontSizes.map(size => (
                        <option key={size} value={size}>{size}</option>
                    ))}
                </select>
            </div>

            <div className={`w-px h-6 ${isDark ? 'bg-gray-600' : 'bg-gray-300'}`} />

            <div className="flex gap-1">
                <button
                    type="button"
                    onClick={() => editor.chain().focus().setTextAlign('left').run()}
                    className={buttonClass(editor.isActive({ textAlign: 'left' }))}
                    title="Align Left"
                >
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                        <path d="M1 2h14v2H1V2zm0 4h10v2H1V6zm0 4h14v2H1v-2zm0 4h10v2H1v-2z" />
                    </svg>
                </button>
                <button
                    type="button"
                    onClick={() => editor.chain().focus().setTextAlign('center').run()}
                    className={buttonClass(editor.isActive({ textAlign: 'center' }))}
                    title="Align Center"
                >
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                        <path d="M1 2h14v2H1V2zm2 4h10v2H3V6zm-2 4h14v2H1v-2zm2 4h10v2H3v-2z" />
                    </svg>
                </button>
                <button
                    type="button"
                    onClick={() => editor.chain().focus().setTextAlign('right').run()}
                    className={buttonClass(editor.isActive({ textAlign: 'right' }))}
                    title="Align Right"
                >
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                        <path d="M1 2h14v2H1V2zm4 4h10v2H5V6zm-4 4h14v2H1v-2zm4 4h10v2H5v-2z" />
                    </svg>
                </button>
                <button
                    type="button"
                    onClick={() => editor.chain().focus().setTextAlign('justify').run()}
                    className={buttonClass(editor.isActive({ textAlign: 'justify' }))}
                    title="Justify"
                >
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                        <path d="M1 2h14v2H1V2zm0 4h14v2H1V6zm0 4h14v2H1v-2zm0 4h14v2H1v-2z" />
                    </svg>
                </button>
            </div>

            <div className={`w-px h-6 ${isDark ? 'bg-gray-600' : 'bg-gray-300'}`} />

            <div className="flex gap-1">
                <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleBulletList().run()}
                    className={buttonClass(editor.isActive('bulletList'))}
                    title="Bullet List"
                >
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                        <circle cx="3" cy="4" r="1.5" />
                        <circle cx="3" cy="8" r="1.5" />
                        <circle cx="3" cy="12" r="1.5" />
                        <rect x="6" y="3" width="9" height="2" />
                        <rect x="6" y="7" width="9" height="2" />
                        <rect x="6" y="11" width="9" height="2" />
                    </svg>
                </button>
                <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleOrderedList().run()}
                    className={buttonClass(editor.isActive('orderedList'))}
                    title="Numbered List"
                >
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                        <text x="1" y="5" fontSize="5" fontWeight="bold">1.</text>
                        <text x="1" y="9" fontSize="5" fontWeight="bold">2.</text>
                        <text x="1" y="13" fontSize="5" fontWeight="bold">3.</text>
                        <rect x="6" y="3" width="9" height="2" />
                        <rect x="6" y="7" width="9" height="2" />
                        <rect x="6" y="11" width="9" height="2" />
                    </svg>
                </button>
            </div>

            <div className={`w-px h-6 ${isDark ? 'bg-gray-600' : 'bg-gray-300'}`} />

            <div className="flex gap-1">
                <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleCode().run()}
                    className={buttonClass(editor.isActive('code'))}
                    title="Inline Code"
                >
                    &lt;/&gt;
                </button>
                <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleCodeBlock().run()}
                    className={buttonClass(editor.isActive('codeBlock'))}
                    title="Code Block"
                >
                    {'{ }'}
                </button>
                {editor.isActive('codeBlock') && (
                    <button
                        type="button"
                        onClick={handleFormatCode}
                        disabled={formatting}
                        className={`${buttonClass(false)} ${formatting ? 'opacity-50 cursor-wait' : ''}`}
                        title="Format Code"
                    >
                        {formatting ? (
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" className="animate-spin">
                                <path d="M8 0a8 8 0 100 16A8 8 0 008 0zm0 14a6 6 0 110-12 6 6 0 010 12z" opacity="0.3" />
                                <path d="M14.5 8a6.5 6.5 0 00-6.5-6.5V0a8 8 0 018 8h-1.5z" />
                            </svg>
                        ) : (
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                                <path d="M3 2h10v2H3V2zm0 4h7v2H3V6zm0 4h10v2H3v-2zm0 4h7v2H3v-2z" opacity="0.5" />
                                <path d="M12.5 6L11 7.5 9.5 6 8 7.5l1.5 1.5L8 10.5 9.5 12l1.5-1.5L12.5 12 14 10.5 12.5 9 14 7.5 12.5 6z" />
                            </svg>
                        )}
                    </button>
                )}
            </div>

            <div className={`w-px h-6 ${isDark ? 'bg-gray-600' : 'bg-gray-300'}`} />

            <div className="flex gap-1">
                <button
                    type="button"
                    onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
                    className={buttonClass(false)}
                    title="Insert Table (3x3)"
                >
                    ⊞
                </button>
                {editor.isActive('table') && (
                    <>
                        <button
                            type="button"
                            onClick={() => editor.chain().focus().addColumnBefore().run()}
                            className={buttonClass(false)}
                            title="Add Column Before"
                        >
                            ←│
                        </button>
                        <button
                            type="button"
                            onClick={() => editor.chain().focus().addColumnAfter().run()}
                            className={buttonClass(false)}
                            title="Add Column After"
                        >
                            │→
                        </button>
                        <button
                            type="button"
                            onClick={() => editor.chain().focus().deleteColumn().run()}
                            className={buttonClass(false)}
                            title="Delete Column"
                        >
                            ⌫│
                        </button>
                        <button
                            type="button"
                            onClick={() => editor.chain().focus().addRowBefore().run()}
                            className={buttonClass(false)}
                            title="Add Row Before"
                        >
                            ↑─
                        </button>
                        <button
                            type="button"
                            onClick={() => editor.chain().focus().addRowAfter().run()}
                            className={buttonClass(false)}
                            title="Add Row After"
                        >
                            ─↓
                        </button>
                        <button
                            type="button"
                            onClick={() => editor.chain().focus().deleteRow().run()}
                            className={buttonClass(false)}
                            title="Delete Row"
                        >
                            ⌫─
                        </button>
                        <button
                            type="button"
                            onClick={() => editor.chain().focus().deleteTable().run()}
                            className={`${buttonClass(false)} text-red-600`}
                            title="Delete Table"
                        >
                            ⌫ Table
                        </button>
                    </>
                )}
            </div>



            <div className="flex gap-1">
                <button
                    type="button"
                    onClick={() => editor.chain().focus().undo().run()}
                    disabled={!editor.can().undo()}
                    className={`px-3 py-1.5 rounded text-sm transition-colors ${editor.can().undo()
                        ? buttonClass(false)
                        : `${isDark ? 'bg-gray-800 text-gray-600' : 'bg-gray-100 text-gray-400'} cursor-not-allowed`
                        }`}
                    title="Undo (Ctrl+Z)"
                >
                    ↶
                </button>
                <button
                    type="button"
                    onClick={() => editor.chain().focus().redo().run()}
                    disabled={!editor.can().redo()}
                    className={`px-3 py-1.5 rounded text-sm transition-colors ${editor.can().redo()
                        ? buttonClass(false)
                        : `${isDark ? 'bg-gray-800 text-gray-600' : 'bg-gray-100 text-gray-400'} cursor-not-allowed`
                        }`}
                    title="Redo (Ctrl+Shift+Z)"
                >
                    ↷
                </button>
            </div>
        </div>
    );
}

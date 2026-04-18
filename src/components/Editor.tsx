"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import { useEffect, useCallback } from "react";

interface EditorProps {
  content: string;
  onChange: (content: string) => void;
  editable?: boolean;
}

function ToolbarButton({
  onClick,
  active,
  disabled,
  title,
  children,
}: {
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onMouseDown={(e) => {
        e.preventDefault();
        onClick();
      }}
      disabled={disabled}
      title={title}
      className={`p-1.5 rounded text-sm font-medium transition-colors ${
        active
          ? "bg-indigo-100 text-indigo-700"
          : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
      } ${disabled ? "opacity-40 cursor-not-allowed" : "cursor-pointer"}`}
    >
      {children}
    </button>
  );
}

function Divider() {
  return <div className="w-px h-5 bg-gray-200 mx-1" />;
}

export default function Editor({ content, onChange, editable = true }: EditorProps) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Underline,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
    ],
    content: content
      ? (() => {
          try {
            return JSON.parse(content);
          } catch {
            return content;
          }
        })()
      : { type: "doc", content: [{ type: "paragraph" }] },
    editable,
    onUpdate: ({ editor }) => {
      onChange(JSON.stringify(editor.getJSON()));
    },
    editorProps: {
      attributes: {
        class: "prose prose-sm sm:prose-base max-w-none focus:outline-none min-h-[500px] p-6",
      },
    },
  });

  useEffect(() => {
    if (!editor) return;
    editor.setEditable(editable);
  }, [editor, editable]);

  // Update content when it changes externally (e.g. page reload)
  useEffect(() => {
    if (!editor || !content) return;
    const current = JSON.stringify(editor.getJSON());
    if (current !== content) {
      try {
        const parsed = JSON.parse(content);
        editor.commands.setContent(parsed);
      } catch {
        editor.commands.setContent(content);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run on mount

  if (!editor) return null;

  return (
    <div className="flex flex-col h-full">
      {editable && (
        <div className="flex flex-wrap items-center gap-0.5 px-3 py-2 border-b border-gray-200 bg-gray-50 sticky top-0 z-10">
          {/* Heading select */}
          <select
            value={
              editor.isActive("heading", { level: 1 })
                ? "1"
                : editor.isActive("heading", { level: 2 })
                ? "2"
                : editor.isActive("heading", { level: 3 })
                ? "3"
                : "0"
            }
            onChange={(e) => {
              const level = parseInt(e.target.value);
              if (level === 0) {
                editor.chain().focus().setParagraph().run();
              } else {
                editor.chain().focus().toggleHeading({ level: level as 1 | 2 | 3 }).run();
              }
            }}
            className="text-sm border border-gray-200 rounded px-2 py-1 bg-white text-gray-700 cursor-pointer hover:border-gray-300 focus:outline-none focus:ring-1 focus:ring-indigo-400"
          >
            <option value="0">Normal</option>
            <option value="1">Heading 1</option>
            <option value="2">Heading 2</option>
            <option value="3">Heading 3</option>
          </select>

          <Divider />

          {/* Bold */}
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBold().run()}
            active={editor.isActive("bold")}
            title="Bold (⌘B)"
          >
            <span className="font-bold">B</span>
          </ToolbarButton>

          {/* Italic */}
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleItalic().run()}
            active={editor.isActive("italic")}
            title="Italic (⌘I)"
          >
            <span className="italic">I</span>
          </ToolbarButton>

          {/* Underline */}
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            active={editor.isActive("underline")}
            title="Underline (⌘U)"
          >
            <span className="underline">U</span>
          </ToolbarButton>

          {/* Strikethrough */}
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleStrike().run()}
            active={editor.isActive("strike")}
            title="Strikethrough"
          >
            <span className="line-through">S</span>
          </ToolbarButton>

          <Divider />

          {/* Bullet list */}
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            active={editor.isActive("bulletList")}
            title="Bullet list"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <circle cx="2" cy="4.5" r="1.5" fill="currentColor" />
              <rect x="5" y="3.75" width="9" height="1.5" rx="0.75" fill="currentColor" />
              <circle cx="2" cy="8" r="1.5" fill="currentColor" />
              <rect x="5" y="7.25" width="9" height="1.5" rx="0.75" fill="currentColor" />
              <circle cx="2" cy="11.5" r="1.5" fill="currentColor" />
              <rect x="5" y="10.75" width="9" height="1.5" rx="0.75" fill="currentColor" />
            </svg>
          </ToolbarButton>

          {/* Ordered list */}
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            active={editor.isActive("orderedList")}
            title="Numbered list"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <text x="0" y="6" fontSize="6" fill="currentColor">1.</text>
              <rect x="5" y="3.75" width="9" height="1.5" rx="0.75" fill="currentColor" />
              <text x="0" y="9.5" fontSize="6" fill="currentColor">2.</text>
              <rect x="5" y="7.25" width="9" height="1.5" rx="0.75" fill="currentColor" />
              <text x="0" y="13" fontSize="6" fill="currentColor">3.</text>
              <rect x="5" y="10.75" width="9" height="1.5" rx="0.75" fill="currentColor" />
            </svg>
          </ToolbarButton>

          <Divider />

          {/* Code block */}
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
            active={editor.isActive("codeBlock")}
            title="Code block"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M5 4L1 8L5 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M11 4L15 8L11 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M9.5 2.5L6.5 13.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </ToolbarButton>

          {/* Blockquote */}
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            active={editor.isActive("blockquote")}
            title="Blockquote"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M2 5C2 4.44772 2.44772 4 3 4H5C5.55228 4 6 4.44772 6 5V7C6 7.55228 5.55228 8 5 8H4V9C4 9.55228 4.44772 10 5 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              <path d="M9 5C9 4.44772 9.44772 4 10 4H12C12.5523 4 13 4.44772 13 5V7C13 7.55228 12.5523 8 12 8H11V9C11 9.55228 11.4477 10 12 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </ToolbarButton>

          <Divider />

          {/* Undo / Redo */}
          <ToolbarButton
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
            title="Undo (⌘Z)"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M3 7L1 5L3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M1 5H10C12.2091 5 14 6.79086 14 9V9C14 11.2091 12.2091 13 10 13H5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </ToolbarButton>

          <ToolbarButton
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
            title="Redo (⌘⇧Z)"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M13 7L15 5L13 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M15 5H6C3.79086 5 2 6.79086 2 9V9C2 11.2091 3.79086 13 6 13H11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </ToolbarButton>
        </div>
      )}

      <div className="flex-1 overflow-y-auto bg-white">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}

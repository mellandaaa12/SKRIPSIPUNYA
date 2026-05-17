// NOTE: "use client" removed — this is a Vite app, not Next.js.
// The directive was a no-op here but can confuse some bundlers.

import { useEditor, EditorContent, ReactNodeViewRenderer, NodeViewWrapper } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Underline } from "@tiptap/extension-underline";
import { Link } from "@tiptap/extension-link";
import { Image } from "@tiptap/extension-image";
import { TextAlign } from "@tiptap/extension-text-align";
import { TextStyle } from "@tiptap/extension-text-style";
import { Color } from "@tiptap/extension-color";
import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableHeader } from "@tiptap/extension-table-header";
import { TableCell } from "@tiptap/extension-table-cell";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  List,
  ListOrdered,
  Heading1,
  Heading2,
  Code,
  Quote,
  Link as LinkIcon,
  Image as ImageIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Undo,
  Redo,
  Table as TableIcon,
  Grid3X3,
  Columns,
  Rows,
  Trash2,
  Palette,
  Plus,
  Maximize2,
  Minimize2,
  Square
} from "lucide-react";
import React, { useState, useRef, useEffect, Component } from "react";

// ---------------------------------------------------------------------------
// ErrorBoundary — catches any Tiptap / React-internal crash in production
// so that a single editor failure does not blank-out the whole page.
// ---------------------------------------------------------------------------
interface EditorBoundaryState { hasError: boolean; errorMessage: string }
class EditorErrorBoundary extends Component<{ children: React.ReactNode }, EditorBoundaryState> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, errorMessage: '' };
  }
  static getDerivedStateFromError(error: Error): EditorBoundaryState {
    return { hasError: true, errorMessage: error?.message ?? 'Unknown error' };
  }
  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.warn('[RichTextEditor] Editor crashed, falling back to textarea:', error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ border: '2px dashed #e2e8f0', borderRadius: 12, padding: 16, background: '#f8fafc' }}>
          <p style={{ fontSize: 13, color: '#64748b', marginBottom: 8 }}>
            ⚠️ Editor tidak dapat dimuat. Silakan ketik HTML secara langsung.
          </p>
          <p style={{ fontSize: 11, color: '#94a3b8', marginBottom: 8 }}>
            Detail: {this.state.errorMessage}
          </p>
          <textarea
            rows={10}
            style={{ width: '100%', fontFamily: 'monospace', fontSize: 13, padding: 8, border: '1px solid #e2e8f0', borderRadius: 6, outline: 'none', resize: 'vertical' }}
            placeholder="Tulis konten HTML di sini..."
            onChange={(e) => {
              // Bubble up if we can find the onChange from context — best effort.
            }}
          />
        </div>
      );
    }
    return this.props.children;
  }
}

const ImageComponent = ({ node, updateAttributes, selected }: any) => {
  const imageRef = useRef<HTMLImageElement>(null);
  
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const startX = e.clientX;
    const startWidth = imageRef.current?.offsetWidth || 0;

    const onMouseMove = (moveEvent: MouseEvent) => {
      const currentWidth = startWidth + (moveEvent.clientX - startX);
      updateAttributes({ width: `${currentWidth}px` });
    };

    const onMouseUp = () => {
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
    };

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
  };

  return (
    <NodeViewWrapper className={`relative inline-block leading-none group ${selected ? 'ring-2 ring-[#628ECB] ring-offset-2 rounded-lg' : ''}`}>
      <img
        ref={imageRef}
        src={node.attrs.src}
        alt={node.attrs.alt}
        style={{
          width: node.attrs.width || '50%',
          maxWidth: '100%',
          height: 'auto',
        }}
        className="rounded-[8px] block transition-all"
      />
      {selected && (
        <>
          {/* Bottom Right Handle */}
          <div
            onMouseDown={handleMouseDown}
            className="absolute bottom-[-8px] right-[-8px] w-5 h-5 bg-[#628ECB] border-2 border-white rounded-full cursor-nwse-resize shadow-[0_4px_12px_rgba(98,142,203,0.4)] hover:scale-125 transition-transform z-50 flex items-center justify-center"
            title="Tarik untuk mengubah ukuran"
          >
             <div className="w-1.5 h-1.5 bg-white rounded-full" />
          </div>
          
          {/* Percentage Indicator */}
          <div className="absolute top-[-30px] left-1/2 -translate-x-1/2 bg-[#D5DEEF] text-[#395886] px-2 py-0.5 rounded-full text-[10px] font-bold shadow-sm whitespace-nowrap">
            Ukuran: {node.attrs.width}
          </div>
        </>
      )}
    </NodeViewWrapper>
  );
};

interface RichTextEditorProps {
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

function RichTextEditorInner({
  content,
  onChange,
  placeholder = "Mulai menulis...",
}: RichTextEditorProps) {
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [showImageInput, setShowImageInput] = useState(false);
  const [imageUrl, setImageUrl] = useState("");
  const [showColorPicker, setShowColorPicker] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "text-[#1294f2] underline cursor-pointer",
        },
      }),
      Image.extend({
        addAttributes() {
          return {
            ...this.parent?.(),
            width: {
              default: '50%',
              renderHTML: attributes => {
                if (!attributes.width) return {};
                return {
                  style: `width: ${attributes.width}; max-width: 100%; height: auto;`,
                };
              },
            },
          };
        },
        addNodeView() {
          return ReactNodeViewRenderer(ImageComponent);
        },
      }).configure({
        HTMLAttributes: {
          class: "rounded-[8px] cursor-pointer transition-all",
        },
      }),
      TextAlign.configure({
        types: ["heading", "paragraph", "image"],
      }),
      TextStyle,
      Color,
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableHeader,
      TableCell,
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class:
          "prose prose-sm max-w-none focus:outline-none min-h-[200px] p-[16px] font-['Poppins'] text-[14px] text-[#1e293b]",
      },
    },
  });

  if (!editor) {
    return null;
  }

  const addLink = () => {
    if (linkUrl) {
      editor.chain().focus().setLink({ href: linkUrl }).run();
      setLinkUrl("");
      setShowLinkInput(false);
    }
  };

  const addImage = () => {
    if (imageUrl) {
      editor.chain().focus().setImage({ src: imageUrl }).run();
      setImageUrl("");
      setShowImageInput(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        editor.chain().focus().setImage({ src: dataUrl }).run();
      };
      reader.readAsDataURL(file);
    }
  };

  const colors = [
    "#000000", "#444444", "#666666", "#999999", "#cccccc", "#eeeeee", "#f3f3f3", "#ffffff",
    "#ff0000", "#ff9900", "#ffff00", "#00ff00", "#00ffff", "#0000ff", "#9900ff", "#ff00ff",
    "#f4cccc", "#fce5cd", "#fff2cc", "#d9ead3", "#d0e0e3", "#cfe2f3", "#d9d2e9", "#ead1dc",
    "#56B6C6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"
  ];

  const ToolbarButton = ({
    onClick,
    active,
    children,
    title,
    disabled = false,
  }: {
    onClick: () => void;
    active?: boolean;
    children: React.ReactNode;
    title: string;
    disabled?: boolean;
  }) => (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`p-[8px] rounded-[6px] transition-colors ${
        active
          ? "bg-[#1294f2] text-white"
          : "bg-white text-[#64748b] hover:bg-[#f1f5f9]"
      } ${disabled ? "opacity-30 cursor-not-allowed" : ""}`}
    >
      {children}
    </button>
  );

  return (
    <div className="border-2 border-[#e2e8f0] rounded-[12px] bg-white overflow-hidden">
      <style>{`
        .ProseMirror table {
          border-collapse: collapse;
          table-layout: fixed;
          width: 100%;
          margin: 0;
          overflow: hidden;
          border: 1px solid #e2e8f0;
        }
        .ProseMirror td, .ProseMirror th {
          min-width: 1em;
          border: 1px solid #e2e8f0;
          padding: 8px 12px;
          vertical-align: top;
          box-sizing: border-box;
          position: relative;
        }
        .ProseMirror th {
          font-weight: bold;
          text-align: left;
          background-color: #f8fafc;
        }
        .ProseMirror pre {
          background: #1e293b;
          color: #e2e8f0;
          font-family: 'Courier New', Courier, monospace;
          padding: 1rem;
          border-radius: 0.5rem;
          margin: 1rem 0;
        }
        .ProseMirror pre code {
          background: none;
          color: inherit;
          font-size: 0.8rem;
          padding: 0;
        }
        .ProseMirror img {
          display: block;
          margin-left: auto;
          margin-right: auto;
          transition: all 0.2s;
          cursor: pointer;
        }
        .ProseMirror img.ProseMirror-selectednode {
          outline: 3px solid #1294f2;
        }
        .ProseMirror p[style*="text-align: left"] img,
        .ProseMirror img[style*="text-align: left"] {
          margin-left: 0;
          margin-right: auto;
          display: block;
        }
        .ProseMirror p[style*="text-align: center"] img,
        .ProseMirror img[style*="text-align: center"] {
          margin-left: auto;
          margin-right: auto;
          display: block;
        }
        .ProseMirror p[style*="text-align: right"] img,
        .ProseMirror img[style*="text-align: right"] {
          margin-left: auto;
          margin-right: 0;
          display: block;
        }
      `}</style>
      
      {/* Toolbar */}
      <div className="sticky top-0 z-40 p-[8px] flex flex-wrap gap-[4px] bg-[#f8fafc]/95 backdrop-blur border-b border-[#e2e8f0] shadow-sm">
        {/* Text Formatting */}
        <div className="flex gap-[4px] border-r border-[#e2e8f0] pr-[8px]">
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBold().run()}
            active={editor.isActive("bold")}
            title="Bold"
          >
            <Bold className="w-[16px] h-[16px]" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleItalic().run()}
            active={editor.isActive("italic")}
            title="Italic"
          >
            <Italic className="w-[16px] h-[16px]" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            active={editor.isActive("underline")}
            title="Underline"
          >
            <UnderlineIcon className="w-[16px] h-[16px]" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleStrike().run()}
            active={editor.isActive("strike")}
            title="Strikethrough"
          >
            <Strikethrough className="w-[16px] h-[16px]" />
          </ToolbarButton>
        </div>

        {/* Color Picker */}
        <div className="flex gap-[4px] border-r border-[#e2e8f0] pr-[8px] relative">
          <ToolbarButton
            onClick={() => setShowColorPicker(!showColorPicker)}
            title="Font Color"
          >
            <Palette className="w-[16px] h-[16px]" />
          </ToolbarButton>
          {showColorPicker && (
            <div className="absolute top-full left-0 z-50 mt-2 p-2 bg-white border border-[#e2e8f0] rounded-lg shadow-xl grid grid-cols-6 gap-1 w-max">
              {colors.map(color => (
                <button
                  key={color}
                  className="w-6 h-6 rounded border border-gray-200"
                  style={{ backgroundColor: color }}
                  onClick={() => {
                    editor.chain().focus().setColor(color).run();
                    setShowColorPicker(false);
                  }}
                />
              ))}
              <button
                className="col-span-6 text-[10px] py-1 hover:bg-gray-100 rounded"
                onClick={() => {
                  editor.chain().focus().unsetColor().run();
                  setShowColorPicker(false);
                }}
              >
                Reset Color
              </button>
            </div>
          )}
        </div>

        {/* Headings */}
        <div className="flex gap-[4px] border-r border-[#e2e8f0] pr-[8px]">
          <ToolbarButton
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 1 }).run()
            }
            active={editor.isActive("heading", { level: 1 })}
            title="Heading 1"
          >
            <Heading1 className="w-[16px] h-[16px]" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 2 }).run()
            }
            active={editor.isActive("heading", { level: 2 })}
            title="Heading 2"
          >
            <Heading2 className="w-[16px] h-[16px]" />
          </ToolbarButton>
        </div>

        {/* Lists */}
        <div className="flex gap-[4px] border-r border-[#e2e8f0] pr-[8px]">
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            active={editor.isActive("bulletList")}
            title="Bullet List"
          >
            <List className="w-[16px] h-[16px]" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            active={editor.isActive("orderedList")}
            title="Numbered List"
          >
            <ListOrdered className="w-[16px] h-[16px]" />
          </ToolbarButton>
        </div>

        {/* Table Controls */}
        <div className="flex gap-[4px] border-r border-[#e2e8f0] pr-[8px]">
          <ToolbarButton
            onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
            title="Insert Table"
          >
            <TableIcon className="w-[16px] h-[16px]" />
          </ToolbarButton>
          <div className="flex gap-[1px]">
            <ToolbarButton
              onClick={() => editor.chain().focus().addColumnBefore().run()}
              disabled={!editor.isActive('table')}
              title="Add Column Before"
            >
              <Columns className="w-[14px] h-[14px] rotate-180" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().addColumnAfter().run()}
              disabled={!editor.isActive('table')}
              title="Add Column After"
            >
              <Columns className="w-[14px] h-[14px]" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().addRowBefore().run()}
              disabled={!editor.isActive('table')}
              title="Add Row Before"
            >
              <Rows className="w-[14px] h-[14px] rotate-180" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().addRowAfter().run()}
              disabled={!editor.isActive('table')}
              title="Add Row After"
            >
              <Rows className="w-[14px] h-[14px]" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().deleteTable().run()}
              disabled={!editor.isActive('table')}
              title="Delete Table"
            >
              <Trash2 className="w-[14px] h-[14px] text-red-500" />
            </ToolbarButton>
          </div>
        </div>

        {/* Alignment */}
        <div className="flex gap-[4px] border-r border-[#e2e8f0] pr-[8px]">
          <ToolbarButton
            onClick={() => editor.chain().focus().setTextAlign("left").run()}
            active={editor.isActive({ textAlign: "left" })}
            title="Align Left"
          >
            <AlignLeft className="w-[16px] h-[16px]" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().setTextAlign("center").run()}
            active={editor.isActive({ textAlign: "center" })}
            title="Align Center"
          >
            <AlignCenter className="w-[16px] h-[16px]" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().setTextAlign("right").run()}
            active={editor.isActive({ textAlign: "right" })}
            title="Align Right"
          >
            <AlignRight className="w-[16px] h-[16px]" />
          </ToolbarButton>
        </div>

        {/* Code & Quote */}
        <div className="flex gap-[4px] border-r border-[#e2e8f0] pr-[8px]">
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
            active={editor.isActive("codeBlock")}
            title="Contoh Codingan"
          >
            <Code className="w-[16px] h-[16px]" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            active={editor.isActive("blockquote")}
            title="Quote"
          >
            <Quote className="w-[16px] h-[16px]" />
          </ToolbarButton>
        </div>

        {/* Link & Image */}
        <div className="flex gap-[4px] border-r border-[#e2e8f0] pr-[8px]">
          <ToolbarButton
            onClick={() => setShowLinkInput(!showLinkInput)}
            active={editor.isActive("link")}
            title="Add Link"
          >
            <LinkIcon className="w-[16px] h-[16px]" />
          </ToolbarButton>
          
          <div className="flex gap-[1px]">
            <ToolbarButton
              onClick={() => setShowImageInput(!showImageInput)}
              active={showImageInput}
              title="Add Image URL"
            >
              <ImageIcon className="w-[16px] h-[16px]" />
            </ToolbarButton>
            
            <label className="p-[8px] rounded-[6px] bg-white text-[#64748b] hover:bg-[#f1f5f9] cursor-pointer transition-colors" title="Upload Image">
              <input 
                type="file" 
                className="hidden" 
                accept="image/*"
                onChange={handleFileUpload}
              />
              <Plus className="w-[16px] h-[16px] text-[#10b981]" />
            </label>
          </div>
        </div>

        {/* Undo/Redo */}
        <div className="flex gap-[4px]">
          <ToolbarButton
            onClick={() => editor.chain().focus().undo().run()}
            active={false}
            title="Undo"
          >
            <Undo className="w-[16px] h-[16px]" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().redo().run()}
            active={false}
            title="Redo"
          >
            <Redo className="w-[16px] h-[16px]" />
          </ToolbarButton>
        </div>

        {/* Image Resizing (Only show when an image is selected) */}
        {editor.isActive('image') && (
          <div className="flex gap-[4px] border-l border-[#e2e8f0] pl-[8px] ml-[4px]">
            <button
              onClick={() => editor.chain().focus().updateAttributes('image', { width: '25%' }).run()}
              className="px-2 py-1 text-[10px] font-bold bg-white text-[#395886] border border-[#D5DEEF] rounded hover:bg-[#F0F3FA] transition-colors"
            >
              25%
            </button>
            <button
              onClick={() => editor.chain().focus().updateAttributes('image', { width: '50%' }).run()}
              className="px-2 py-1 text-[10px] font-bold bg-white text-[#395886] border border-[#D5DEEF] rounded hover:bg-[#F0F3FA] transition-colors"
            >
              50%
            </button>
            <button
              onClick={() => editor.chain().focus().updateAttributes('image', { width: '75%' }).run()}
              className="px-2 py-1 text-[10px] font-bold bg-white text-[#395886] border border-[#D5DEEF] rounded hover:bg-[#F0F3FA] transition-colors"
            >
              75%
            </button>
            <button
              onClick={() => editor.chain().focus().updateAttributes('image', { width: '100%' }).run()}
              className="px-2 py-1 text-[10px] font-bold bg-white text-[#395886] border border-[#D5DEEF] rounded hover:bg-[#F0F3FA] transition-colors"
            >
              100%
            </button>
          </div>
        )}
      </div>

      {/* Link Input */}
      {showLinkInput && (
        <div className="border-b border-[#e2e8f0] p-[12px] bg-[#f8fafc] flex gap-[8px]">
          <input
            type="url"
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            placeholder="https://example.com"
            className="flex-1 font-['Poppins'] text-[13px] px-[12px] py-[8px] border border-[#e2e8f0] rounded-[6px] focus:outline-none focus:border-[#1294f2]"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addLink();
              }
            }}
          />
          <button
            type="button"
            onClick={addLink}
            className="px-[16px] py-[8px] bg-[#1294f2] text-white font-['Poppins'] text-[13px] rounded-[6px] hover:bg-[#0ea5e9]"
          >
            Add
          </button>
        </div>
      )}

      {/* Image Input */}
      {showImageInput && (
        <div className="border-b border-[#e2e8f0] p-[12px] bg-[#f8fafc] flex gap-[8px]">
          <input
            type="url"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="https://example.com/image.jpg"
            className="flex-1 font-['Poppins'] text-[13px] px-[12px] py-[8px] border border-[#e2e8f0] rounded-[6px] focus:outline-none focus:border-[#1294f2]"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addImage();
              }
            }}
          />
          <button
            type="button"
            onClick={addImage}
            className="px-[16px] py-[8px] bg-[#1294f2] text-white font-['Poppins'] text-[13px] rounded-[6px] hover:bg-[#0ea5e9]"
          >
            Add
          </button>
        </div>
      )}

      {/* Editor */}
      <EditorContent editor={editor} />
    </div>
  );
}

// Wrap with ErrorBoundary so production crashes don't blank the page
export default function RichTextEditor(props: RichTextEditorProps) {
  return (
    <EditorErrorBoundary>
      <RichTextEditorInner {...props} />
    </EditorErrorBoundary>
  );
}

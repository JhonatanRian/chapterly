import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableCell } from "@tiptap/extension-table-cell";
import { TableHeader } from "@tiptap/extension-table-header";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import TextAlign from "@tiptap/extension-text-align";
import Underline from "@tiptap/extension-underline";
import Highlight from "@tiptap/extension-highlight";
import { createLowlight } from "lowlight";
import { useCallback, useRef, useState, useEffect } from "react";
import { cn } from "@/utils/cn";
import { toast } from "sonner";
import { API_BASE_URL, STORAGE_KEYS } from "@/utils/constants";
import { ResizableImage } from "./extensions/ResizableImage";

// Import syntax highlighting for common languages
import javascript from "highlight.js/lib/languages/javascript";
import typescript from "highlight.js/lib/languages/typescript";
import python from "highlight.js/lib/languages/python";
import java from "highlight.js/lib/languages/java";
import sql from "highlight.js/lib/languages/sql";
import json from "highlight.js/lib/languages/json";
import xml from "highlight.js/lib/languages/xml";
import css from "highlight.js/lib/languages/css";
import bash from "highlight.js/lib/languages/bash";
import markdown from "highlight.js/lib/languages/markdown";
import php from "highlight.js/lib/languages/php";
import go from "highlight.js/lib/languages/go";
import rust from "highlight.js/lib/languages/rust";
import ruby from "highlight.js/lib/languages/ruby";

// Create lowlight instance
const lowlight = createLowlight();

// Register languages
lowlight.register("javascript", javascript);
lowlight.register("typescript", typescript);
lowlight.register("python", python);
lowlight.register("java", java);
lowlight.register("sql", sql);
lowlight.register("json", json);
lowlight.register("xml", xml);
lowlight.register("html", xml);
lowlight.register("css", css);
lowlight.register("bash", bash);
lowlight.register("shell", bash);
lowlight.register("markdown", markdown);
lowlight.register("php", php);
lowlight.register("go", go);
lowlight.register("rust", rust);
lowlight.register("ruby", ruby);

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
  disabled?: boolean;
  error?: string;
}

export function RichTextEditor({
  content,
  onChange,
  placeholder = "Escreva o conteúdo detalhado aqui...",
  disabled = false,
  error,
}: RichTextEditorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showHTMLView, setShowHTMLView] = useState(false);
  const [htmlContent, setHtmlContent] = useState("");
  const [showHelp, setShowHelp] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3, 4, 5, 6],
        },
      }),
      Placeholder.configure({
        placeholder,
      }),
      ResizableImage.configure({
        inline: false,
        allowBase64: false,
        HTMLAttributes: {
          class: "rounded-lg max-w-full h-auto",
        },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class:
            "text-indigo-600 dark:text-indigo-400 underline hover:text-indigo-700 dark:hover:text-indigo-300",
        },
      }),
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
      Underline,
      Highlight.configure({
        multicolor: false,
      }),
      Table.configure({
        resizable: true,
        HTMLAttributes: {
          class: "border-collapse table-auto w-full my-4",
        },
      }),
      TableRow,
      TableHeader.configure({
        HTMLAttributes: {
          class:
            "border border-gray-300 dark:border-gray-600 px-4 py-2 bg-gray-100 dark:bg-gray-700 font-semibold",
        },
      }),
      TableCell.configure({
        HTMLAttributes: {
          class: "border border-gray-300 dark:border-gray-600 px-4 py-2",
        },
      }),
      CodeBlockLowlight.configure({
        lowlight,
        HTMLAttributes: {
          class:
            "rounded-lg bg-gray-900 dark:bg-gray-950 p-3 my-3 overflow-x-auto text-sm",
        },
      }),
    ],
    content,
    editorProps: {
      attributes: {
        class: cn(
          "prose dark:prose-invert max-w-none min-h-[400px] p-4",
          "focus:outline-none",
          "overflow-hidden break-words",
          "[&_*]:max-w-full",
        ),
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editable: !disabled,
  });

  // Update editor content when prop changes (for editing existing ideas)
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  const handleImageUpload = useCallback(async () => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file || !editor) return;

      // Validate file type
      if (!file.type.startsWith("image/")) {
        toast.error("Apenas imagens são permitidas");
        return;
      }

      // Validate file size (5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Imagem muito grande. Tamanho máximo: 5MB");
        return;
      }

      const formData = new FormData();
      formData.append("image", file);

      try {
        const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
        const response = await fetch(`${API_BASE_URL}/upload/image/`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Erro ao fazer upload da imagem");
        }

        const data = await response.json();
        editor
          .chain()
          .focus()
          .setImage({ src: data.url, alt: file.name })
          .run();
        toast.success(
          "Imagem inserida com sucesso! Arraste a borda para redimensionar.",
        );

        // Reset input
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      } catch (error: any) {
        toast.error(error.message || "Erro ao fazer upload da imagem");
      }
    },
    [editor],
  );

  const setLink = useCallback(() => {
    if (!editor) return;

    const previousUrl = editor.getAttributes("link").href;
    const url = window.prompt("URL:", previousUrl);

    if (url === null) return;

    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }

    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  }, [editor]);

  const addCodeBlock = useCallback(
    (language: string) => {
      if (!editor) return;
      editor.chain().focus().setCodeBlock({ language }).run();
    },
    [editor],
  );

  const toggleHTMLView = useCallback(() => {
    if (!editor) return;

    if (!showHTMLView) {
      // Switch to HTML view
      setHtmlContent(editor.getHTML());
      setShowHTMLView(true);
    } else {
      // Switch back to editor view
      editor.commands.setContent(htmlContent);
      setShowHTMLView(false);
    }
  }, [editor, showHTMLView, htmlContent]);

  const handleHTMLChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setHtmlContent(e.target.value);
    },
    [],
  );

  if (!editor) {
    return null;
  }

  return (
    <div className="border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
      {/* Toolbar */}
      <div className="bg-gray-50 dark:bg-gray-900 border-b border-gray-300 dark:border-gray-600 p-2 space-y-2">
        {/* Row 1: Text formatting */}
        <div className="flex flex-wrap gap-1 items-center">
          <div className="flex gap-1 border-r border-gray-300 dark:border-gray-600 pr-2">
            <button
              type="button"
              onClick={() => editor.chain().focus().toggleBold().run()}
              disabled={!editor.can().chain().focus().toggleBold().run()}
              className={cn(
                "px-2 py-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-sm font-semibold",
                editor.isActive("bold") && "bg-gray-200 dark:bg-gray-700",
              )}
              title="Negrito (Ctrl+B)"
            >
              B
            </button>
            <button
              type="button"
              onClick={() => editor.chain().focus().toggleItalic().run()}
              disabled={!editor.can().chain().focus().toggleItalic().run()}
              className={cn(
                "px-2 py-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-sm italic",
                editor.isActive("italic") && "bg-gray-200 dark:bg-gray-700",
              )}
              title="Itálico (Ctrl+I)"
            >
              I
            </button>
            <button
              type="button"
              onClick={() => editor.chain().focus().toggleUnderline().run()}
              disabled={!editor.can().chain().focus().toggleUnderline().run()}
              className={cn(
                "px-2 py-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-sm underline",
                editor.isActive("underline") && "bg-gray-200 dark:bg-gray-700",
              )}
              title="Sublinhado (Ctrl+U)"
            >
              U
            </button>
            <button
              type="button"
              onClick={() => editor.chain().focus().toggleStrike().run()}
              disabled={!editor.can().chain().focus().toggleStrike().run()}
              className={cn(
                "px-2 py-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-sm line-through",
                editor.isActive("strike") && "bg-gray-200 dark:bg-gray-700",
              )}
              title="Tachado"
            >
              S
            </button>
            <button
              type="button"
              onClick={() => editor.chain().focus().toggleHighlight().run()}
              disabled={!editor.can().chain().focus().toggleHighlight().run()}
              className={cn(
                "px-2 py-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-sm",
                editor.isActive("highlight") &&
                  "bg-yellow-200 dark:bg-yellow-700",
              )}
              title="Destacar"
            >
              🖍️
            </button>
            <button
              type="button"
              onClick={() => editor.chain().focus().toggleCode().run()}
              disabled={!editor.can().chain().focus().toggleCode().run()}
              className={cn(
                "px-2 py-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 font-mono text-xs",
                editor.isActive("code") && "bg-gray-200 dark:bg-gray-700",
              )}
              title="Código inline"
            >
              {"</>"}
            </button>
          </div>

          {/* Headings */}
          <div className="flex gap-1 border-r border-gray-300 dark:border-gray-600 pr-2">
            <button
              type="button"
              onClick={() =>
                editor.chain().focus().toggleHeading({ level: 1 }).run()
              }
              className={cn(
                "px-2 py-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-sm font-bold",
                editor.isActive("heading", { level: 1 }) &&
                  "bg-gray-200 dark:bg-gray-700",
              )}
              title="Título 1"
            >
              H1
            </button>
            <button
              type="button"
              onClick={() =>
                editor.chain().focus().toggleHeading({ level: 2 }).run()
              }
              className={cn(
                "px-2 py-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-sm font-bold",
                editor.isActive("heading", { level: 2 }) &&
                  "bg-gray-200 dark:bg-gray-700",
              )}
              title="Título 2"
            >
              H2
            </button>
            <button
              type="button"
              onClick={() =>
                editor.chain().focus().toggleHeading({ level: 3 }).run()
              }
              className={cn(
                "px-2 py-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-sm font-bold",
                editor.isActive("heading", { level: 3 }) &&
                  "bg-gray-200 dark:bg-gray-700",
              )}
              title="Título 3"
            >
              H3
            </button>
          </div>

          {/* Alignment */}
          <div className="flex gap-1 border-r border-gray-300 dark:border-gray-600 pr-2">
            <button
              type="button"
              onClick={() => editor.chain().focus().setTextAlign("left").run()}
              className={cn(
                "px-2 py-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-sm",
                editor.isActive({ textAlign: "left" }) &&
                  "bg-gray-200 dark:bg-gray-700",
              )}
              title="Alinhar à esquerda"
            >
              ⫣
            </button>
            <button
              type="button"
              onClick={() =>
                editor.chain().focus().setTextAlign("center").run()
              }
              className={cn(
                "px-2 py-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-sm",
                editor.isActive({ textAlign: "center" }) &&
                  "bg-gray-200 dark:bg-gray-700",
              )}
              title="Centralizar"
            >
              ≡
            </button>
            <button
              type="button"
              onClick={() => editor.chain().focus().setTextAlign("right").run()}
              className={cn(
                "px-2 py-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-sm",
                editor.isActive({ textAlign: "right" }) &&
                  "bg-gray-200 dark:bg-gray-700",
              )}
              title="Alinhar à direita"
            >
              ⫤
            </button>
          </div>

          {/* Lists */}
          <div className="flex gap-1 border-r border-gray-300 dark:border-gray-600 pr-2">
            <button
              type="button"
              onClick={() => editor.chain().focus().toggleBulletList().run()}
              className={cn(
                "px-2 py-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-sm",
                editor.isActive("bulletList") && "bg-gray-200 dark:bg-gray-700",
              )}
              title="Lista"
            >
              •
            </button>
            <button
              type="button"
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
              className={cn(
                "px-2 py-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-sm",
                editor.isActive("orderedList") &&
                  "bg-gray-200 dark:bg-gray-700",
              )}
              title="Lista numerada"
            >
              1.
            </button>
            <button
              type="button"
              onClick={() => editor.chain().focus().toggleBlockquote().run()}
              className={cn(
                "px-2 py-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-sm",
                editor.isActive("blockquote") && "bg-gray-200 dark:bg-gray-700",
              )}
              title="Citação"
            >
              "
            </button>
          </div>

          {/* Divider */}
          <div className="flex gap-1 border-r border-gray-300 dark:border-gray-600 pr-2">
            <button
              type="button"
              onClick={() => editor.chain().focus().setHorizontalRule().run()}
              className="px-2 py-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-sm"
              title="Linha horizontal"
            >
              ―
            </button>
          </div>

          {/* Undo/Redo */}
          <div className="flex gap-1">
            <button
              type="button"
              onClick={() => editor.chain().focus().undo().run()}
              disabled={!editor.can().chain().focus().undo().run()}
              className={cn(
                "px-2 py-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-sm",
                !editor.can().chain().focus().undo().run() && "opacity-50",
              )}
              title="Desfazer (Ctrl+Z)"
            >
              ↶
            </button>
            <button
              type="button"
              onClick={() => editor.chain().focus().redo().run()}
              disabled={!editor.can().chain().focus().redo().run()}
              className={cn(
                "px-2 py-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-sm",
                !editor.can().chain().focus().redo().run() && "opacity-50",
              )}
              title="Refazer (Ctrl+Y)"
            >
              ↷
            </button>
          </div>
        </div>

        {/* Row 2: Code, Media, Table, HTML */}
        <div className="flex flex-wrap gap-1 items-center">
          {/* Code blocks */}
          <div className="flex gap-1 border-r border-gray-300 dark:border-gray-600 pr-2">
            <select
              onChange={(e) => {
                if (e.target.value) {
                  addCodeBlock(e.target.value);
                  e.target.value = "";
                }
              }}
              className="px-2 py-1 rounded text-xs bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600"
              title="Inserir bloco de código"
            >
              <option value="">💻 Código</option>
              <option value="javascript">JavaScript</option>
              <option value="typescript">TypeScript</option>
              <option value="python">Python</option>
              <option value="java">Java</option>
              <option value="sql">SQL</option>
              <option value="json">JSON</option>
              <option value="html">HTML</option>
              <option value="css">CSS</option>
              <option value="bash">Bash</option>
              <option value="php">PHP</option>
              <option value="go">Go</option>
              <option value="rust">Rust</option>
              <option value="ruby">Ruby</option>
              <option value="markdown">Markdown</option>
            </select>
          </div>

          {/* Media */}
          <div className="flex gap-1 border-r border-gray-300 dark:border-gray-600 pr-2">
            <button
              type="button"
              onClick={handleImageUpload}
              className="px-2 py-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-sm"
              title="Inserir imagem"
            >
              🖼️ Imagem
            </button>
            <button
              type="button"
              onClick={setLink}
              className={cn(
                "px-2 py-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-sm",
                editor.isActive("link") && "bg-gray-200 dark:bg-gray-700",
              )}
              title="Inserir link"
            >
              🔗 Link
            </button>
          </div>

          {/* Table */}
          <div className="flex gap-1 border-r border-gray-300 dark:border-gray-600 pr-2">
            <button
              type="button"
              onClick={() =>
                editor
                  .chain()
                  .focus()
                  .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
                  .run()
              }
              className="px-2 py-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-xs"
              title="Inserir tabela 3x3"
            >
              ⊞ Tabela
            </button>
            {editor.isActive("table") && (
              <>
                <button
                  type="button"
                  onClick={() => editor.chain().focus().addColumnBefore().run()}
                  className="px-2 py-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-xs"
                  title="Adicionar coluna antes"
                >
                  ← Col
                </button>
                <button
                  type="button"
                  onClick={() => editor.chain().focus().addColumnAfter().run()}
                  className="px-2 py-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-xs"
                  title="Adicionar coluna depois"
                >
                  Col →
                </button>
                <button
                  type="button"
                  onClick={() => editor.chain().focus().deleteColumn().run()}
                  className="px-2 py-1 rounded hover:bg-red-200 dark:hover:bg-red-900 text-xs text-red-600 dark:text-red-400"
                  title="Remover coluna"
                >
                  ✕ Col
                </button>
                <button
                  type="button"
                  onClick={() => editor.chain().focus().addRowBefore().run()}
                  className="px-2 py-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-xs"
                  title="Adicionar linha antes"
                >
                  ↑ Lin
                </button>
                <button
                  type="button"
                  onClick={() => editor.chain().focus().addRowAfter().run()}
                  className="px-2 py-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-xs"
                  title="Adicionar linha depois"
                >
                  Lin ↓
                </button>
                <button
                  type="button"
                  onClick={() => editor.chain().focus().deleteRow().run()}
                  className="px-2 py-1 rounded hover:bg-red-200 dark:hover:bg-red-900 text-xs text-red-600 dark:text-red-400"
                  title="Remover linha"
                >
                  ✕ Lin
                </button>
                <button
                  type="button"
                  onClick={() => editor.chain().focus().deleteTable().run()}
                  className="px-2 py-1 rounded hover:bg-red-200 dark:hover:bg-red-900 text-xs text-red-600 dark:text-red-400"
                  title="Remover tabela"
                >
                  ✕ Tabela
                </button>
              </>
            )}
          </div>

          {/* HTML View */}
          <div className="flex gap-1 border-r border-gray-300 dark:border-gray-600 pr-2">
            <button
              type="button"
              onClick={toggleHTMLView}
              className={cn(
                "px-2 py-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-xs font-mono",
                showHTMLView && "bg-indigo-100 dark:bg-indigo-900",
              )}
              title="Ver/Editar HTML"
            >
              {showHTMLView ? "📝 Editor" : "🔧 HTML"}
            </button>
          </div>

          {/* Help */}
          <div className="flex gap-1">
            <button
              type="button"
              onClick={() => setShowHelp(!showHelp)}
              className={cn(
                "px-2 py-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-xs",
                showHelp && "bg-indigo-100 dark:bg-indigo-900",
              )}
              title="Atalhos de teclado"
            >
              ❓
            </button>
          </div>
        </div>
      </div>

      {/* Keyboard shortcuts help */}
      {showHelp && (
        <div className="bg-indigo-50 dark:bg-indigo-950 border-b border-indigo-200 dark:border-indigo-800 p-3">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
            <div>
              <strong>Ctrl+B</strong> - Negrito
            </div>
            <div>
              <strong>Ctrl+I</strong> - Itálico
            </div>
            <div>
              <strong>Ctrl+U</strong> - Sublinhado
            </div>
            <div>
              <strong>Ctrl+Z</strong> - Desfazer
            </div>
            <div>
              <strong>Ctrl+Y</strong> - Refazer
            </div>
            <div>
              <strong>Ctrl+Shift+X</strong> - Tachado
            </div>
            <div>
              <strong>Ctrl+Alt+1-3</strong> - H1-H3
            </div>
            <div>
              <strong>Ctrl+Shift+8</strong> - Lista
            </div>
            <div>
              <strong>Ctrl+Shift+7</strong> - Lista num.
            </div>
          </div>
        </div>
      )}

      {/* Editor content */}
      <div className="bg-white dark:bg-gray-800">
        {showHTMLView ? (
          <textarea
            value={htmlContent}
            onChange={handleHTMLChange}
            className="w-full min-h-[400px] p-4 font-mono text-sm bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 border-none focus:outline-none"
            spellCheck={false}
          />
        ) : (
          <EditorContent editor={editor} />
        )}
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Error message */}
      {error && (
        <div className="px-4 py-2 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20">
          {error}
        </div>
      )}
    </div>
  );
}

import { useState, useCallback, useRef, useEffect } from "react";
import MDEditor, { commands } from "@uiw/react-md-editor";
import { toast } from "sonner";
import { STORAGE_KEYS } from "@/utils/constants";
import rehypeHighlight from "rehype-highlight";

interface MarkdownEditorProps {
  content: string;
  onChange: (value: string) => void;
  placeholder?: string;
  error?: string;
  disabled?: boolean;
  minHeight?: number;
}

export function MarkdownEditor({
  content,
  onChange,
  placeholder = "Escreva seu conteúdo em Markdown...",
  error,
  disabled = false,
  minHeight = 500,
}: MarkdownEditorProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Detect dark mode
  useEffect(() => {
    const checkDarkMode = () => {
      const isDark = document.documentElement.classList.contains("dark");
      setIsDarkMode(isDark);
    };

    // Check initially
    checkDarkMode();

    // Watch for changes
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, []);

  // Upload image to backend
  const uploadImage = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append("image", file);

    const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
    const apiUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

    const response = await fetch(`${apiUrl}/api/upload/image/`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || "Erro ao fazer upload da imagem");
    }

    const data = await response.json();
    return data.url;
  };

  // Handle image upload via file input
  const handleImageUpload = useCallback(async () => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Por favor, selecione uma imagem válida");
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("A imagem deve ter no máximo 5MB");
      return;
    }

    try {
      setIsUploading(true);
      const url = await uploadImage(file);

      // Insert markdown image syntax at cursor position
      const imageMarkdown = `![${file.name}](${url})`;
      onChange(content + "\n" + imageMarkdown);

      toast.success("Imagem enviada com sucesso!");
    } catch (error: any) {
      console.error("Upload error:", error);
      toast.error(error.message || "Erro ao fazer upload da imagem");
    } finally {
      setIsUploading(false);
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  // Handle paste images from clipboard
  const handlePaste = useCallback(
    async (event: React.ClipboardEvent) => {
      const items = event.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.type.startsWith("image/")) {
          event.preventDefault();
          const file = item.getAsFile();
          if (!file) continue;

          try {
            setIsUploading(true);
            const url = await uploadImage(file);
            const imageMarkdown = `![Imagem colada](${url})`;
            onChange(content + "\n" + imageMarkdown);
            toast.success("Imagem colada com sucesso!");
          } catch (error: any) {
            console.error("Paste upload error:", error);
            toast.error(error.message || "Erro ao colar imagem");
          } finally {
            setIsUploading(false);
          }
          break;
        }
      }
    },
    [content, onChange],
  );

  // Handle drag & drop
  const handleDrop = useCallback(
    async (event: React.DragEvent) => {
      event.preventDefault();
      const files = event.dataTransfer?.files;
      if (!files || files.length === 0) return;

      const file = files[0];
      if (!file.type.startsWith("image/")) {
        toast.error("Por favor, arraste uma imagem válida");
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        toast.error("A imagem deve ter no máximo 5MB");
        return;
      }

      try {
        setIsUploading(true);
        const url = await uploadImage(file);
        const imageMarkdown = `![${file.name}](${url})`;
        onChange(content + "\n" + imageMarkdown);
        toast.success("Imagem enviada com sucesso!");
      } catch (error: any) {
        console.error("Drop upload error:", error);
        toast.error(error.message || "Erro ao fazer upload da imagem");
      } finally {
        setIsUploading(false);
      }
    },
    [content, onChange],
  );

  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
  }, []);

  // Custom image upload command
  const imageCommand = {
    name: "image",
    keyCommand: "image",
    buttonProps: { "aria-label": "Inserir imagem" },
    icon: (
      <svg width="12" height="12" viewBox="0 0 20 20">
        <path
          fill="currentColor"
          d="M15 9c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm4-7H1c-.55 0-1 .45-1 1v14c0 .55.45 1 1 1h18c.55 0 1-.45 1-1V3c0-.55-.45-1-1-1zm-1 13l-6-5-2 2-4-5-4 8V4h16v11z"
        />
      </svg>
    ),
    execute: () => {
      handleImageUpload();
    },
  };

  // Custom Mermaid command
  const mermaidCommand = {
    name: "mermaid",
    keyCommand: "mermaid",
    buttonProps: { "aria-label": "Inserir diagrama Mermaid" },
    icon: (
      <svg width="12" height="12" viewBox="0 0 16 16">
        <path
          fill="currentColor"
          d="M1.5 1.5A.5.5 0 0 1 2 1h12a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-.128.334L10 8.692V13.5a.5.5 0 0 1-.342.474l-3 1A.5.5 0 0 1 6 14.5V8.692L1.628 3.834A.5.5 0 0 1 1.5 3.5v-2z"
        />
      </svg>
    ),
    execute: (_state: any, api: any) => {
      const modifyText = `\`\`\`mermaid\ngraph TD\n    A[Início] --> B{Decisão}\n    B -->|Sim| C[Resultado 1]\n    B -->|Não| D[Resultado 2]\n\`\`\`\n`;
      api.replaceSelection(modifyText);
    },
  };

  return (
    <div className="markdown-editor-wrapper">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Upload indicator */}
      {isUploading && (
        <div className="mb-2 p-2 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded text-sm text-indigo-700 dark:text-indigo-300">
          <div className="flex items-center gap-2">
            <svg
              className="animate-spin h-4 w-4"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <span>Enviando imagem...</span>
          </div>
        </div>
      )}

      {/* Editor */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        data-color-mode={isDarkMode ? "dark" : "light"}
      >
        <MDEditor
          value={content}
          onChange={(val) => onChange(val || "")}
          height={minHeight}
          preview="live"
          visibleDragbar={false}
          previewOptions={{
            rehypePlugins: [[rehypeHighlight, { detect: true }]],
          }}
          textareaProps={{
            placeholder: disabled
              ? "Editor desabilitado"
              : isUploading
                ? "Enviando imagem..."
                : placeholder,
            disabled: disabled || isUploading,
            onPaste: handlePaste,
          }}
          commands={[
            commands.bold,
            commands.italic,
            commands.strikethrough,
            commands.hr,
            commands.title,
            commands.divider,
            commands.link,
            imageCommand,
            commands.divider,
            commands.code,
            commands.codeBlock,
            mermaidCommand,
            commands.divider,
            commands.quote,
            commands.unorderedListCommand,
            commands.orderedListCommand,
            commands.checkedListCommand,
            commands.divider,
            commands.table,
            commands.divider,
            commands.help,
          ]}
          extraCommands={[
            commands.codeEdit,
            commands.codeLive,
            commands.codePreview,
            commands.divider,
            commands.fullscreen,
          ]}
          enableScroll={true}
        />
      </div>

      {/* Error message */}
      {error && (
        <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p>
      )}

      {/* Helper text */}
      <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
        <p>
          💡 Dica: Arraste imagens, cole do clipboard ou use o botão de imagem.
          Suporta Markdown, código com syntax highlighting e diagramas Mermaid.
        </p>
      </div>
    </div>
  );
}

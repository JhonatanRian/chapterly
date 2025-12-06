import { Editor } from '@tinymce/tinymce-react';
import { cn } from '@/utils/cn';

interface RichTextEditorProps {
  value: string;
  onChange: (content: string) => void;
  placeholder?: string;
  error?: string;
  disabled?: boolean;
  className?: string;
  label?: string;
  height?: number;
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = 'Digite o conteúdo...',
  error,
  disabled = false,
  className,
  label,
  height = 400,
}: RichTextEditorProps) {
  return (
    <div className={cn('space-y-2', className)}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
        </label>
      )}

      <div
        className={cn(
          'rounded-lg border transition-colors',
          error
            ? 'border-red-500 dark:border-red-400'
            : 'border-gray-300 dark:border-gray-600',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
      >
        <Editor
          apiKey="fo2g55pn981tdxxxjd5w26htcj9tb5rg9njcazdiupuh843i" // Using TinyMCE without cloud (self-hosted)
          value={value}
          onEditorChange={onChange}
          disabled={disabled}
          init={{
            height,
            menubar: false,
            plugins: [
              'advlist',
              'autolink',
              'lists',
              'link',
              'image',
              'charmap',
              'preview',
              'anchor',
              'searchreplace',
              'visualblocks',
              'code',
              'fullscreen',
              'insertdatetime',
              'media',
              'table',
              'code',
              'help',
              'wordcount',
            ],
            toolbar:
              'undo redo | blocks | ' +
              'bold italic forecolor | alignleft aligncenter ' +
              'alignright alignjustify | bullist numlist outdent indent | ' +
              'removeformat | link image | code | help',
            content_style:
              'body { font-family:Helvetica,Arial,sans-serif; font-size:14px }',
            placeholder,
            skin: 'oxide',
            content_css: 'default',
            branding: false,
            promotion: false,
          }}
        />
      </div>

      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
    </div>
  );
}

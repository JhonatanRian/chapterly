import { useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import rehypeRaw from "rehype-raw";
import mermaid from "mermaid";

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

// Initialize Mermaid
mermaid.initialize({
  startOnLoad: true,
  theme: "default",
  securityLevel: "loose",
  fontFamily: "ui-sans-serif, system-ui, sans-serif",
});

export function MarkdownRenderer({
  content,
  className = "",
}: MarkdownRendererProps) {
  useEffect(() => {
    // Render Mermaid diagrams after content is loaded
    const renderMermaid = async () => {
      try {
        const mermaidElements = document.querySelectorAll(".mermaid");
        if (mermaidElements.length > 0) {
          await mermaid.run({
            querySelector: ".mermaid",
          });
        }
      } catch (error) {
        console.error("Mermaid rendering error:", error);
      }
    };

    renderMermaid();
  }, [content]);

  return (
    <div
      className={`markdown-content prose prose-slate dark:prose-invert max-w-none ${className}`}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight, rehypeRaw]}
        components={{
          // Custom code block rendering
          code({ className, children, ...props }: any) {
            const match = /language-(\w+)/.exec(className || "");
            const language = match ? match[1] : "";

            // Check if it's a mermaid diagram
            if (language === "mermaid") {
              return (
                <div className="mermaid my-4">
                  {String(children).replace(/\n$/, "")}
                </div>
              );
            }

            // Inline code
            if (!className) {
              return (
                <code
                  className="px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-sm font-mono text-indigo-600 dark:text-indigo-400"
                  {...props}
                >
                  {children}
                </code>
              );
            }

            // Block code with syntax highlighting
            return (
              <code className={className} {...props}>
                {children}
              </code>
            );
          },

          // Custom image rendering with captions
          img({ src, alt, ...props }: any) {
            return (
              <figure className="my-6">
                <img
                  src={src}
                  alt={alt || ""}
                  className="rounded-lg shadow-md w-full max-w-full h-auto"
                  loading="lazy"
                  {...props}
                />
                {alt && (
                  <figcaption className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400 italic">
                    {alt}
                  </figcaption>
                )}
              </figure>
            );
          },

          // Custom link rendering
          a({ href, children, ...props }: any) {
            const isExternal = href?.startsWith("http");
            return (
              <a
                href={href}
                className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 underline decoration-indigo-300 dark:decoration-indigo-600 hover:decoration-indigo-500 transition-colors"
                target={isExternal ? "_blank" : undefined}
                rel={isExternal ? "noopener noreferrer" : undefined}
                {...props}
              >
                {children}
                {isExternal && (
                  <svg
                    className="inline-block w-3 h-3 ml-1 mb-1"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                    />
                  </svg>
                )}
              </a>
            );
          },

          // Custom table rendering
          table({ children, ...props }: any) {
            return (
              <div className="overflow-x-auto my-6">
                <table
                  className="min-w-full divide-y divide-gray-300 dark:divide-gray-700"
                  {...props}
                >
                  {children}
                </table>
              </div>
            );
          },

          // Custom heading rendering with anchor links
          h1({ children, ...props }: any) {
            return (
              <h1
                className="text-4xl font-bold mt-8 mb-4 text-gray-900 dark:text-gray-100"
                {...props}
              >
                {children}
              </h1>
            );
          },
          h2({ children, ...props }: any) {
            return (
              <h2
                className="text-3xl font-bold mt-6 mb-3 text-gray-900 dark:text-gray-100"
                {...props}
              >
                {children}
              </h2>
            );
          },
          h3({ children, ...props }: any) {
            return (
              <h3
                className="text-2xl font-semibold mt-5 mb-2 text-gray-900 dark:text-gray-100"
                {...props}
              >
                {children}
              </h3>
            );
          },

          // Custom blockquote rendering
          blockquote({ children, ...props }: any) {
            return (
              <blockquote
                className="border-l-4 border-indigo-500 pl-4 py-2 my-4 bg-indigo-50 dark:bg-indigo-900/20 text-gray-700 dark:text-gray-300 italic"
                {...props}
              >
                {children}
              </blockquote>
            );
          },

          // Custom list rendering
          ul({ children, ...props }: any) {
            return (
              <ul className="list-disc list-inside space-y-2 my-4" {...props}>
                {children}
              </ul>
            );
          },
          ol({ children, ...props }: any) {
            return (
              <ol
                className="list-decimal list-inside space-y-2 my-4"
                {...props}
              >
                {children}
              </ol>
            );
          },

          // Custom horizontal rule
          hr({ ...props }: any) {
            return (
              <hr
                className="my-8 border-t-2 border-gray-300 dark:border-gray-700"
                {...props}
              />
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>

      <style>{`
        /* Additional markdown styles */
        .markdown-content {
          line-height: 1.7;
        }

        .markdown-content p {
          margin-bottom: 1rem;
          color: #374151;
        }

        .dark .markdown-content p {
          color: #d1d5db;
        }

        /* Code block styling */
        .markdown-content pre {
          background-color: #0d1117;
          border-radius: 0.5rem;
          padding: 1rem;
          overflow-x: auto;
          margin: 1.5rem 0;
          border: 1px solid #30363d;
        }

        .dark .markdown-content pre {
          background-color: #161b22;
          border-color: #30363d;
        }

        .markdown-content pre code {
          background-color: transparent;
          padding: 0;
          font-size: 0.875rem;
          line-height: 1.5;
          color: #c9d1d9;
          font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
        }

        /* Syntax highlighting colors */
        .markdown-content .hljs {
          color: #c9d1d9;
          background: transparent;
        }

        .markdown-content .hljs-keyword,
        .markdown-content .hljs-selector-tag,
        .markdown-content .hljs-title,
        .markdown-content .hljs-section,
        .markdown-content .hljs-doctag,
        .markdown-content .hljs-name,
        .markdown-content .hljs-strong {
          color: #ff7b72;
          font-weight: bold;
        }

        .markdown-content .hljs-string,
        .markdown-content .hljs-title.class_,
        .markdown-content .hljs-title.class_.inherited__,
        .markdown-content .hljs-title.function_,
        .markdown-content .hljs-attribute {
          color: #a5d6ff;
        }

        .markdown-content .hljs-comment,
        .markdown-content .hljs-quote {
          color: #8b949e;
          font-style: italic;
        }

        .markdown-content .hljs-number,
        .markdown-content .hljs-literal,
        .markdown-content .hljs-variable,
        .markdown-content .hljs-template-variable,
        .markdown-content .hljs-tag .hljs-attr {
          color: #79c0ff;
        }

        .markdown-content .hljs-built_in,
        .markdown-content .hljs-builtin-name {
          color: #ffa657;
        }

        .markdown-content .hljs-meta {
          color: #d2a8ff;
        }

        .markdown-content .hljs-deletion {
          color: #ffa198;
          background-color: #490202;
        }

        .markdown-content .hljs-addition {
          color: #56d364;
          background-color: #0f5323;
        }

        /* Table styling */
        .markdown-content table th {
          background-color: #f3f4f6;
          padding: 0.75rem;
          text-align: left;
          font-weight: 600;
          color: #111827;
        }

        .dark .markdown-content table th {
          background-color: #374151;
          color: #f9fafb;
        }

        .markdown-content table td {
          padding: 0.75rem;
          border-bottom: 1px solid #e5e7eb;
        }

        .dark .markdown-content table td {
          border-bottom: 1px solid #4b5563;
        }

        .markdown-content input[type="checkbox"] {
          margin-right: 0.5rem;
        }

        /* Mermaid diagram styles */
        .mermaid {
          background-color: transparent;
          text-align: center;
        }

        .dark .mermaid {
          filter: invert(0.9) hue-rotate(180deg);
        }

        /* Prevent overflow */
        .markdown-content * {
          max-width: 100%;
          word-wrap: break-word;
          overflow-wrap: break-word;
        }

        .markdown-content img {
          height: auto;
        }
      `}</style>
    </div>
  );
}

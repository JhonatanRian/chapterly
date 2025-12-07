import Image from "@tiptap/extension-image";
import { mergeAttributes } from "@tiptap/core";

export interface ResizableImageOptions {
  inline: boolean;
  allowBase64: boolean;
  HTMLAttributes: Record<string, any>;
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    resizableImage: {
      setImage: (options: {
        src: string;
        alt?: string;
        title?: string;
        width?: string | number;
        height?: string | number;
        align?: string;
      }) => ReturnType;
      setImageSize: (options: {
        width?: string | number;
        height?: string | number;
      }) => ReturnType;
      setImageAlign: (align: string) => ReturnType;
    };
  }
}

export const ResizableImage = Image.extend<ResizableImageOptions>({
  name: "resizableImage",

  addAttributes() {
    return {
      ...this.parent?.(),
      width: {
        default: null,
        parseHTML: (element) => element.getAttribute("width"),
        renderHTML: (attributes) => {
          if (!attributes.width) {
            return {};
          }
          return {
            width: attributes.width,
          };
        },
      },
      height: {
        default: null,
        parseHTML: (element) => element.getAttribute("height"),
        renderHTML: (attributes) => {
          if (!attributes.height) {
            return {};
          }
          return {
            height: attributes.height,
          };
        },
      },
      alt: {
        default: null,
        parseHTML: (element) => element.getAttribute("alt"),
        renderHTML: (attributes) => {
          if (!attributes.alt) {
            return {};
          }
          return {
            alt: attributes.alt,
          };
        },
      },
      title: {
        default: null,
        parseHTML: (element) => element.getAttribute("title"),
        renderHTML: (attributes) => {
          if (!attributes.title) {
            return {};
          }
          return {
            title: attributes.title,
          };
        },
      },
      caption: {
        default: null,
        parseHTML: (element) => element.getAttribute("data-caption"),
        renderHTML: (attributes) => {
          if (!attributes.caption) {
            return {};
          }
          return {
            "data-caption": attributes.caption,
          };
        },
      },
      align: {
        default: "center",
        parseHTML: (element) => element.getAttribute("data-align") || "center",
        renderHTML: (attributes) => {
          return {
            "data-align": attributes.align,
          };
        },
      },
    };
  },

  addCommands() {
    return {
      setImage:
        (options) =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: options,
          });
        },
      setImageSize:
        (options) =>
        ({ commands }) => {
          return commands.updateAttributes(this.name, options);
        },
      setImageAlign:
        (align) =>
        ({ commands }) => {
          return commands.updateAttributes(this.name, { align });
        },
    };
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "img",
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        draggable: false,
        class: "resizable-image",
      }),
    ];
  },

  addNodeView() {
    return ({ node, editor, getPos }) => {
      const container = document.createElement("div");
      container.classList.add("image-container");
      container.setAttribute("data-drag-handle", "");

      // Set alignment
      const align = node.attrs.align || "center";
      container.setAttribute("data-align", align);
      if (align === "left") {
        container.style.textAlign = "left";
      } else if (align === "right") {
        container.style.textAlign = "right";
      } else {
        container.style.textAlign = "center";
      }

      const imageWrapper = document.createElement("div");
      imageWrapper.classList.add("image-wrapper");

      const img = document.createElement("img");
      img.src = node.attrs.src;
      if (node.attrs.alt) img.alt = node.attrs.alt;
      if (node.attrs.title) img.title = node.attrs.title;
      if (node.attrs.width) img.style.width = `${node.attrs.width}px`;
      if (node.attrs.height) img.style.height = `${node.attrs.height}px`;
      img.draggable = false;

      // Resize handles
      const resizeHandle = document.createElement("div");
      resizeHandle.classList.add("resize-handle");
      resizeHandle.contentEditable = "false";

      let isResizing = false;
      let startX = 0;
      let startWidth = 0;

      resizeHandle.addEventListener("mousedown", (e) => {
        e.preventDefault();
        isResizing = true;
        startX = e.clientX;
        startWidth = img.offsetWidth;
        document.body.style.cursor = "ew-resize";

        const onMouseMove = (e: MouseEvent) => {
          if (!isResizing) return;
          const diff = e.clientX - startX;
          const newWidth = Math.max(50, startWidth + diff);
          img.style.width = `${newWidth}px`;
          img.style.height = "auto";
        };

        const onMouseUp = () => {
          if (!isResizing) return;
          isResizing = false;
          document.body.style.cursor = "";

          const width = img.offsetWidth;
          const height = img.offsetHeight;

          if (typeof getPos === "function") {
            const pos = getPos();
            if (pos !== undefined) {
              editor
                .chain()
                .focus()
                .setNodeSelection(pos)
                .updateAttributes("resizableImage", {
                  width,
                  height,
                })
                .run();
            }
          }

          document.removeEventListener("mousemove", onMouseMove);
          document.removeEventListener("mouseup", onMouseUp);
        };

        document.addEventListener("mousemove", onMouseMove);
        document.addEventListener("mouseup", onMouseUp);
      });

      imageWrapper.appendChild(img);
      imageWrapper.appendChild(resizeHandle);

      // Alignment controls
      const alignmentControls = document.createElement("div");
      alignmentControls.classList.add("image-alignment-controls");
      alignmentControls.contentEditable = "false";

      const alignLeft = document.createElement("button");
      alignLeft.innerHTML = "⫣";
      alignLeft.title = "Alinhar à esquerda";
      alignLeft.type = "button";
      alignLeft.classList.add("align-btn");
      if (align === "left") alignLeft.classList.add("active");

      const alignCenter = document.createElement("button");
      alignCenter.innerHTML = "≡";
      alignCenter.title = "Centralizar";
      alignCenter.type = "button";
      alignCenter.classList.add("align-btn");
      if (align === "center") alignCenter.classList.add("active");

      const alignRight = document.createElement("button");
      alignRight.innerHTML = "⫤";
      alignRight.title = "Alinhar à direita";
      alignRight.type = "button";
      alignRight.classList.add("align-btn");
      if (align === "right") alignRight.classList.add("active");

      const updateAlignment = (newAlign: string) => {
        if (typeof getPos === "function") {
          const pos = getPos();
          if (pos !== undefined) {
            editor
              .chain()
              .setNodeSelection(pos)
              .updateAttributes("resizableImage", {
                align: newAlign,
              })
              .run();

            // Update visual alignment
            container.setAttribute("data-align", newAlign);
            if (newAlign === "left") {
              container.style.textAlign = "left";
            } else if (newAlign === "right") {
              container.style.textAlign = "right";
            } else {
              container.style.textAlign = "center";
            }

            // Update active state
            alignLeft.classList.toggle("active", newAlign === "left");
            alignCenter.classList.toggle("active", newAlign === "center");
            alignRight.classList.toggle("active", newAlign === "right");
          }
        }
      };

      alignLeft.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        updateAlignment("left");
      });

      alignCenter.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        updateAlignment("center");
      });

      alignRight.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        updateAlignment("right");
      });

      alignmentControls.appendChild(alignLeft);
      alignmentControls.appendChild(alignCenter);
      alignmentControls.appendChild(alignRight);

      // Caption (using div instead of input for better contenteditable support)
      const captionInput = document.createElement("div");
      captionInput.classList.add("image-caption-input");
      captionInput.setAttribute("contenteditable", "true");
      captionInput.setAttribute(
        "data-placeholder",
        "Adicionar legenda (opcional)...",
      );
      captionInput.textContent = node.attrs.caption || "";

      // Prevent editor from capturing events and selecting the node
      captionInput.addEventListener("mousedown", (e) => {
        e.preventDefault();
        e.stopPropagation();
        // Force focus on the caption input
        setTimeout(() => {
          captionInput.focus();
          // Move cursor to end
          const range = document.createRange();
          const sel = window.getSelection();
          if (captionInput.childNodes.length > 0) {
            range.setStart(
              captionInput.childNodes[0],
              captionInput.textContent?.length || 0,
            );
            range.collapse(true);
            sel?.removeAllRanges();
            sel?.addRange(range);
          }
        }, 0);
      });

      captionInput.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
      });

      captionInput.addEventListener("focus", (e) => {
        e.stopPropagation();
      });

      captionInput.addEventListener("input", (e) => {
        e.stopPropagation();
      });

      captionInput.addEventListener("blur", () => {
        if (typeof getPos === "function") {
          const pos = getPos();
          if (pos !== undefined) {
            editor
              .chain()
              .setNodeSelection(pos)
              .updateAttributes("resizableImage", {
                caption: captionInput.textContent || "",
              })
              .run();
          }
        }
      });

      captionInput.addEventListener("keydown", (e) => {
        e.stopPropagation();
        if (e.key === "Enter") {
          e.preventDefault();
          captionInput.blur();
          editor.commands.focus();
        }
        if (e.key === "Escape") {
          e.preventDefault();
          captionInput.blur();
          editor.commands.focus();
        }
      });

      container.appendChild(imageWrapper);
      container.appendChild(alignmentControls);
      container.appendChild(captionInput);

      return {
        dom: container,
        contentDOM: null,
        ignoreMutation: (mutation) => {
          // Ignore mutations inside the caption input
          if (
            captionInput.contains(mutation.target) ||
            captionInput === mutation.target
          ) {
            return true;
          }
          return (
            !container.contains(mutation.target) ||
            container === mutation.target
          );
        },
        stopEvent: (event) => {
          // Stop all events on the caption input from propagating to ProseMirror
          return (
            captionInput.contains(event.target as Node) ||
            captionInput === event.target
          );
        },
      };
    };
  },
});

/**
 * Utility to convert HTML content to Markdown
 * This is a simple converter for migrating existing content
 */

export function htmlToMarkdown(html: string): string {
  if (!html) return "";

  let markdown = html;

  // Remove HTML comments
  markdown = markdown.replace(/<!--[\s\S]*?-->/g, "");

  // Convert headings
  markdown = markdown.replace(/<h1[^>]*>(.*?)<\/h1>/gi, "# $1\n\n");
  markdown = markdown.replace(/<h2[^>]*>(.*?)<\/h2>/gi, "## $1\n\n");
  markdown = markdown.replace(/<h3[^>]*>(.*?)<\/h3>/gi, "### $1\n\n");
  markdown = markdown.replace(/<h4[^>]*>(.*?)<\/h4>/gi, "#### $1\n\n");
  markdown = markdown.replace(/<h5[^>]*>(.*?)<\/h5>/gi, "##### $1\n\n");
  markdown = markdown.replace(/<h6[^>]*>(.*?)<\/h6>/gi, "###### $1\n\n");

  // Convert bold
  markdown = markdown.replace(/<strong[^>]*>(.*?)<\/strong>/gi, "**$1**");
  markdown = markdown.replace(/<b[^>]*>(.*?)<\/b>/gi, "**$1**");

  // Convert italic
  markdown = markdown.replace(/<em[^>]*>(.*?)<\/em>/gi, "*$1*");
  markdown = markdown.replace(/<i[^>]*>(.*?)<\/i>/gi, "*$1*");

  // Convert underline (Markdown doesn't have native underline, use HTML)
  markdown = markdown.replace(/<u[^>]*>(.*?)<\/u>/gi, "<u>$1</u>");

  // Convert strikethrough
  markdown = markdown.replace(/<s[^>]*>(.*?)<\/s>/gi, "~~$1~~");
  markdown = markdown.replace(/<strike[^>]*>(.*?)<\/strike>/gi, "~~$1~~");
  markdown = markdown.replace(/<del[^>]*>(.*?)<\/del>/gi, "~~$1~~");

  // Convert links
  markdown = markdown.replace(
    /<a[^>]*href=["']([^"']*)["'][^>]*>(.*?)<\/a>/gi,
    "[$2]($1)",
  );

  // Convert images (with figure/figcaption support)
  markdown = markdown.replace(
    /<figure[^>]*>\s*<img[^>]*src=["']([^"']*)["'][^>]*alt=["']([^"']*)["'][^>]*>\s*<figcaption[^>]*>(.*?)<\/figcaption>\s*<\/figure>/gi,
    "![$3]($1)",
  );
  markdown = markdown.replace(
    /<img[^>]*src=["']([^"']*)["'][^>]*alt=["']([^"']*)["'][^>]*>/gi,
    "![$2]($1)",
  );
  markdown = markdown.replace(
    /<img[^>]*alt=["']([^"']*)["'][^>]*src=["']([^"']*)["'][^>]*>/gi,
    "![$1]($2)",
  );
  // Images without alt text
  markdown = markdown.replace(
    /<img[^>]*src=["']([^"']*)["'][^>]*>/gi,
    "![]($1)",
  );

  // Convert code blocks
  markdown = markdown.replace(
    /<pre[^>]*><code[^>]*class=["']language-(\w+)["'][^>]*>(.*?)<\/code><\/pre>/gis,
    (_match, lang, code) => {
      // Decode HTML entities in code
      const decodedCode = code
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&amp;/g, "&")
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'");
      return `\`\`\`${lang}\n${decodedCode.trim()}\n\`\`\`\n\n`;
    },
  );

  // Convert code blocks without language
  markdown = markdown.replace(
    /<pre[^>]*><code[^>]*>(.*?)<\/code><\/pre>/gis,
    (_match, code) => {
      const decodedCode = code
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&amp;/g, "&")
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'");
      return `\`\`\`\n${decodedCode.trim()}\n\`\`\`\n\n`;
    },
  );

  // Convert inline code
  markdown = markdown.replace(/<code[^>]*>(.*?)<\/code>/gi, "`$1`");

  // Convert blockquotes
  markdown = markdown.replace(
    /<blockquote[^>]*>(.*?)<\/blockquote>/gis,
    (_match, content) => {
      const lines = content.trim().split("\n");
      return (
        lines.map((line: string) => `> ${line.trim()}`).join("\n") + "\n\n"
      );
    },
  );

  // Convert unordered lists
  markdown = markdown.replace(/<ul[^>]*>(.*?)<\/ul>/gis, (_match, content) => {
    let listContent = content;
    listContent = listContent.replace(/<li[^>]*>(.*?)<\/li>/gi, "- $1\n");
    return "\n" + listContent + "\n";
  });

  // Convert ordered lists
  markdown = markdown.replace(/<ol[^>]*>(.*?)<\/ol>/gis, (_match, content) => {
    let listContent = content;
    let counter = 1;
    listContent = listContent.replace(/<li[^>]*>(.*?)<\/li>/gi, () => {
      return `${counter++}. $1\n`;
    });
    return "\n" + listContent + "\n";
  });

  // Convert horizontal rules
  markdown = markdown.replace(/<hr[^>]*>/gi, "\n---\n\n");

  // Convert line breaks
  markdown = markdown.replace(/<br\s*\/?>/gi, "  \n");

  // Convert tables (basic support)
  markdown = markdown.replace(
    /<table[^>]*>(.*?)<\/table>/gis,
    (_match, tableContent) => {
      let result = "\n";
      let isFirstRow = true;

      // Extract headers
      const theadMatch = tableContent.match(/<thead[^>]*>(.*?)<\/thead>/is);
      if (theadMatch) {
        const headerRow = theadMatch[1].match(/<tr[^>]*>(.*?)<\/tr>/is);
        if (headerRow) {
          const headers = headerRow[1].match(/<th[^>]*>(.*?)<\/th>/gi);
          if (headers) {
            const headerTexts = headers.map((h: string) =>
              h.replace(/<\/?th[^>]*>/gi, "").trim(),
            );
            result += "| " + headerTexts.join(" | ") + " |\n";
            result += "| " + headerTexts.map(() => "---").join(" | ") + " |\n";
            isFirstRow = false;
          }
        }
      }

      // Extract body rows
      const tbodyMatch = tableContent.match(/<tbody[^>]*>(.*?)<\/tbody>/is);
      const bodyContent = tbodyMatch ? tbodyMatch[1] : tableContent;
      const rows = bodyContent.match(/<tr[^>]*>(.*?)<\/tr>/gis);

      if (rows) {
        rows.forEach((row: string) => {
          const cells = row.match(/<td[^>]*>(.*?)<\/td>/gi);
          if (cells) {
            const cellTexts = cells.map((c: string) =>
              c.replace(/<\/?td[^>]*>/gi, "").trim(),
            );

            if (isFirstRow) {
              // If no thead, use first row as header
              result += "| " + cellTexts.join(" | ") + " |\n";
              result += "| " + cellTexts.map(() => "---").join(" | ") + " |\n";
              isFirstRow = false;
            } else {
              result += "| " + cellTexts.join(" | ") + " |\n";
            }
          }
        });
      }

      return result + "\n";
    },
  );

  // Convert paragraphs
  markdown = markdown.replace(/<p[^>]*>(.*?)<\/p>/gi, "$1\n\n");

  // Convert divs (remove them but keep content)
  markdown = markdown.replace(/<div[^>]*>(.*?)<\/div>/gis, "$1\n");

  // Convert spans (remove them but keep content)
  markdown = markdown.replace(/<span[^>]*>(.*?)<\/span>/gi, "$1");

  // Remove remaining HTML tags
  markdown = markdown.replace(/<\/?[^>]+(>|$)/g, "");

  // Decode HTML entities
  markdown = markdown.replace(/&nbsp;/g, " ");
  markdown = markdown.replace(/&lt;/g, "<");
  markdown = markdown.replace(/&gt;/g, ">");
  markdown = markdown.replace(/&amp;/g, "&");
  markdown = markdown.replace(/&quot;/g, '"');
  markdown = markdown.replace(/&#39;/g, "'");
  markdown = markdown.replace(/&ldquo;/g, '"');
  markdown = markdown.replace(/&rdquo;/g, '"');
  markdown = markdown.replace(/&lsquo;/g, "'");
  markdown = markdown.replace(/&rsquo;/g, "'");
  markdown = markdown.replace(/&mdash;/g, "—");
  markdown = markdown.replace(/&ndash;/g, "–");

  // Clean up extra whitespace
  markdown = markdown.replace(/\n{3,}/g, "\n\n");
  markdown = markdown.trim();

  return markdown;
}

/**
 * Example usage in a migration script:
 *
 * const ideas = await ideasService.getAllIdeas();
 * for (const idea of ideas) {
 *   const markdownContent = htmlToMarkdown(idea.conteudo);
 *   await ideasService.updateIdea(idea.id, {
 *     ...idea,
 *     conteudo: markdownContent
 *   });
 * }
 */

import type { CSSProperties, ReactNode } from "react";

type TextAlign = "left" | "center" | "right";

type MarkdownBlock =
  | { type: "heading"; level: 1 | 2 | 3; content: string; align?: TextAlign }
  | { type: "paragraph"; content: string; align?: TextAlign }
  | { type: "blockquote"; content: string; align?: TextAlign }
  | { type: "list"; ordered: boolean; items: string[]; align?: TextAlign }
  | { type: "image"; src: string; alt: string }
  | { type: "iframe"; src: string; title: string };

interface MarkdownContentProps {
  source: string | string[];
  className?: string;
  style?: CSSProperties;
  h1Level?: 1 | 2;
}

function safeHref(href: string) {
  const trimmed = href.trim();
  if (/^(https?:|mailto:|tel:|\/|#)/i.test(trimmed)) return trimmed;
  return "#";
}

function safeMediaSrc(src: string) {
  const trimmed = src.trim();
  if (/^(https?:|\/)/i.test(trimmed)) return trimmed;
  return "";
}

function iframeTitle(value: string) {
  const title = value.match(/\btitle=["']([^"']+)["']/i)?.[1]?.trim();
  return title || "Contenido embebido";
}

function safeTextAlign(value: string | undefined): TextAlign | undefined {
  const align = value?.trim().toLowerCase();
  if (align === "center" || align === "right") return align;
  return undefined;
}

function textAlignFromHtml(value: string) {
  return safeTextAlign(value.match(/text-align:\s*(left|center|right)/i)?.[1]);
}

function stripHtmlTags(value: string) {
  return value.replace(/<[^>]+>/g, "").trim();
}

function htmlInlineToMarkdown(value: string): string {
  return value
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<(strong|b)\b[^>]*>(.*?)<\/\1>/gi, (_match, _tag, content: string) => `**${htmlInlineToMarkdown(content)}**`)
    .replace(/<(em|i)\b[^>]*>(.*?)<\/\1>/gi, (_match, _tag, content: string) => `_${htmlInlineToMarkdown(content)}_`)
    .replace(/<u\b[^>]*>(.*?)<\/u>/gi, (_match, content: string) => `<u>${htmlInlineToMarkdown(content)}</u>`)
    .replace(/<(s|strike|del)\b[^>]*>(.*?)<\/\1>/gi, (_match, _tag, content: string) => `~~${htmlInlineToMarkdown(content)}~~`)
    .replace(/<a\b[^>]*href=["']([^"']+)["'][^>]*>(.*?)<\/a>/gi, (_match, href: string, content: string) => {
      const text = stripHtmlTags(htmlInlineToMarkdown(content)) || href;
      return `[${text}](${safeHref(href)})`;
    })
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, "\"")
    .replace(/&#39;/gi, "'")
    .trim();
}

export function renderInlineMarkdown(value: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  const pattern = /(\*\*[^*]+\*\*|__[^_]+__|_[^_]+_|\*[^*]+\*|~~[^~]+~~|<u>.*?<\/u>|\[[^\]]+\]\([^)]+\))/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(value)) !== null) {
    if (match.index > lastIndex) nodes.push(value.slice(lastIndex, match.index));
    const token = match[0];
    const key = `${match.index}-${token}`;

    if (token.startsWith("**") || token.startsWith("__")) {
      nodes.push(<strong key={key}>{renderInlineMarkdown(token.slice(2, -2))}</strong>);
    } else if (token.startsWith("_") || token.startsWith("*")) {
      nodes.push(<em key={key}>{renderInlineMarkdown(token.slice(1, -1))}</em>);
    } else if (token.startsWith("~~")) {
      nodes.push(<s key={key}>{renderInlineMarkdown(token.slice(2, -2))}</s>);
    } else if (token.startsWith("<u>")) {
      nodes.push(<u key={key}>{renderInlineMarkdown(token.slice(3, -4))}</u>);
    } else {
      const linkMatch = token.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
      if (linkMatch) {
        const href = safeHref(linkMatch[2]);
        const external = /^https?:\/\//i.test(href);
        nodes.push(
          <a key={key} href={href} target={external ? "_blank" : undefined} rel={external ? "noopener noreferrer" : undefined}>
            {renderInlineMarkdown(linkMatch[1])}
          </a>
        );
      } else {
        nodes.push(token);
      }
    }

    lastIndex = match.index + token.length;
  }

  if (lastIndex < value.length) nodes.push(value.slice(lastIndex));
  return nodes;
}

function parseMarkdownBlocks(source: string): MarkdownBlock[] {
  const blocks: MarkdownBlock[] = [];
  const normalizedSource = source
    .replace(/\r\n/g, "\n")
    .replace(/<(ul|ol)\b[\s\S]*?<\/\1>/gi, (match) => match.replace(/\s*\n\s*/g, ""));
  const lines = normalizedSource.split("\n");
  let paragraph: string[] = [];
  let list: { ordered: boolean; items: string[] } | null = null;

  const flushParagraph = () => {
    const content = paragraph.join(" ").trim();
    if (content) blocks.push({ type: "paragraph", content });
    paragraph = [];
  };

  const flushList = () => {
    if (list?.items.length) blocks.push({ type: "list", ordered: list.ordered, items: list.items });
    list = null;
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();

    if (!line) {
      flushParagraph();
      flushList();
      continue;
    }

    const htmlImage = line.match(/^<(?:figure|div)\b[^>]*>\s*<img\b[^>]*src=["']([^"']+)["'][^>]*>\s*<\/(?:figure|div)>$/i) ?? line.match(/^<img\b[^>]*src=["']([^"']+)["'][^>]*>$/i);
    if (htmlImage) {
      flushParagraph();
      flushList();
      const src = safeMediaSrc(htmlImage[1]);
      const alt = line.match(/\balt=["']([^"']*)["']/i)?.[1]?.trim() ?? "";
      if (src) blocks.push({ type: "image", src, alt });
      continue;
    }

    const htmlIframe = line.match(/^<(?:div|figure)\b[^>]*>\s*<iframe\b([^>]*)\bsrc=["']([^"']+)["'][^>]*>\s*<\/iframe>\s*<\/(?:div|figure)>$/i) ?? line.match(/^<iframe\b([^>]*)\bsrc=["']([^"']+)["'][^>]*>\s*<\/iframe>$/i);
    if (htmlIframe) {
      flushParagraph();
      flushList();
      const src = safeMediaSrc(htmlIframe[2]);
      if (src) blocks.push({ type: "iframe", src, title: iframeTitle(htmlIframe[1]) });
      continue;
    }

    const htmlTextBlock = line.match(/^<(p|div|h[1-3]|blockquote)\b([^>]*)>(.*)<\/\1>$/i);
    if (htmlTextBlock) {
      flushParagraph();
      flushList();
      const tag = htmlTextBlock[1].toLowerCase();
      const alignedText = textAlignFromHtml(htmlTextBlock[2]);
      const content = htmlInlineToMarkdown(htmlTextBlock[3]);
      if (content) {
        if (tag === "h1" || tag === "h2" || tag === "h3") {
          blocks.push({ type: "heading", level: Number(tag.slice(1)) as 1 | 2 | 3, content, align: alignedText });
        } else if (tag === "blockquote") {
          blocks.push({ type: "blockquote", content, align: alignedText });
        } else {
          blocks.push({ type: "paragraph", content, align: alignedText });
        }
      }
      continue;
    }

    const htmlListBlock = line.match(/^<(ul|ol)\b([^>]*)>(.*)<\/\1>$/i);
    if (htmlListBlock) {
      flushParagraph();
      flushList();
      const alignedList = textAlignFromHtml(htmlListBlock[2]);
      const items = Array.from(htmlListBlock[3].matchAll(/<li[^>]*>(.*?)<\/li>/gi))
        .map((item) => htmlInlineToMarkdown(item[1]))
        .filter(Boolean);
      if (items.length) blocks.push({ type: "list", ordered: htmlListBlock[1].toLowerCase() === "ol", items, align: alignedList });
      continue;
    }

    const heading = line.match(/^(#{1,3})\s+(.+)$/);
    if (heading) {
      flushParagraph();
      flushList();
      blocks.push({
        type: "heading",
        level: heading[1].length as 1 | 2 | 3,
        content: heading[2].trim(),
      });
      continue;
    }

    const blockquote = line.match(/^>\s+(.+)$/);
    if (blockquote) {
      flushParagraph();
      flushList();
      blocks.push({ type: "blockquote", content: blockquote[1].trim() });
      continue;
    }

    const image = line.match(/^!\[([^\]]*)\]\(([^)]+)\)$/);
    if (image) {
      flushParagraph();
      flushList();
      const src = safeMediaSrc(image[2]);
      if (src) blocks.push({ type: "image", src, alt: image[1].trim() });
      continue;
    }

    const iframe = line.match(/^<iframe\b([^>]*)\bsrc=["']([^"']+)["'][^>]*>\s*<\/iframe>$/i);
    if (iframe) {
      flushParagraph();
      flushList();
      const src = safeMediaSrc(iframe[2]);
      if (src) blocks.push({ type: "iframe", src, title: iframeTitle(iframe[1]) });
      continue;
    }

    const unordered = line.match(/^[-*]\s+(.+)$/);
    const ordered = line.match(/^\d+\.\s+(.+)$/);
    if (unordered || ordered) {
      flushParagraph();
      const item = (unordered?.[1] ?? ordered?.[1] ?? "").trim();
      const isOrdered = Boolean(ordered);
      if (!list || list.ordered !== isOrdered) {
        flushList();
        list = { ordered: isOrdered, items: [] };
      }
      if (item) list.items.push(item);
      continue;
    }

    flushList();
    paragraph.push(line);
  }

  flushParagraph();
  flushList();
  return blocks;
}

export function MarkdownContent({ source, className, style, h1Level = 1 }: MarkdownContentProps) {
  const text = Array.isArray(source) ? source.join("\n") : source;
  const blocks = parseMarkdownBlocks(text);

  if (!blocks.length) return null;

  return (
    <div className={className ? `markdown-content ${className}` : "markdown-content"} style={style}>
      {blocks.map((block, index) => {
        const key = `${block.type}-${index}`;
        if (block.type === "heading") {
          const style = block.align ? { textAlign: block.align } : undefined;
          if (block.level === 1 && h1Level === 1) return <h1 key={key} style={style}>{renderInlineMarkdown(block.content)}</h1>;
          if (block.level === 1) return <h2 key={key} style={style}>{renderInlineMarkdown(block.content)}</h2>;
          if (block.level === 2) return <h2 key={key} style={style}>{renderInlineMarkdown(block.content)}</h2>;
          return <h3 key={key} style={style}>{renderInlineMarkdown(block.content)}</h3>;
        }

        if (block.type === "list") {
          const ListTag = block.ordered ? "ol" : "ul";
          return (
            <ListTag key={key} style={block.align ? { textAlign: block.align } : undefined}>
              {block.items.map((item, itemIndex) => (
                <li key={`${item}-${itemIndex}`}>{renderInlineMarkdown(item)}</li>
              ))}
            </ListTag>
          );
        }

        if (block.type === "blockquote") {
          return <blockquote key={key} style={block.align ? { textAlign: block.align } : undefined}>{renderInlineMarkdown(block.content)}</blockquote>;
        }

        if (block.type === "image") {
          return (
            <figure className="markdown-content__figure" key={key}>
              <img src={block.src} alt={block.alt} loading="lazy" />
            </figure>
          );
        }

        if (block.type === "iframe") {
          return (
            <div className="markdown-content__embed" key={key}>
              <iframe src={block.src} title={block.title} loading="lazy" allowFullScreen />
            </div>
          );
        }

        return <p key={key} style={block.align ? { textAlign: block.align } : undefined}>{renderInlineMarkdown(block.content)}</p>;
      })}
    </div>
  );
}

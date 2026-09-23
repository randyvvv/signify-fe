// Renderer markdown ringan (heading, list, quote, bold, code, link) untuk
// konten materi dan jawaban Signify Coach. Tanpa dependency.
import type { ReactNode } from "react";

function renderInlineMarkdown(text: string): ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`|\[[^\]]+\]\([^)]+\))/g);

  return parts.map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={index} className="font-semibold text-gray-900">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code
          key={index}
          className="rounded bg-gray-100 px-1.5 py-0.5 text-sm text-quaternary"
        >
          {part.slice(1, -1)}
        </code>
      );
    }

    const link = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (link) {
      return (
        <a
          key={index}
          href={link[2]}
          target="_blank"
          rel="noreferrer"
          className="font-medium text-quinary underline underline-offset-2"
        >
          {link[1]}
        </a>
      );
    }

    return part;
  });
}

export function MarkdownContent({ content, compact = false }: { content: string; compact?: boolean }) {
  const lines = content.replace(/\r\n/g, "\n").split("\n");
  const blocks: ReactNode[] = [];
  let index = 0;
  let key = 0;

  while (index < lines.length) {
    const line = lines[index]?.trim() ?? "";

    if (!line) {
      index += 1;
      continue;
    }

    const heading = line.match(/^(#{1,3})\s+(.+)$/);
    if (heading) {
      const level = heading[1].length;
      const text = heading[2];
      const className =
        level === 1
          ? "text-2xl font-bold text-gray-950"
          : level === 2
            ? "text-xl font-bold text-gray-900"
            : "text-base font-semibold text-gray-900";

      blocks.push(
        level === 1 ? (
          <h1 key={key++} className={className}>
            {renderInlineMarkdown(text)}
          </h1>
        ) : level === 2 ? (
          <h2 key={key++} className={className}>
            {renderInlineMarkdown(text)}
          </h2>
        ) : (
          <h3 key={key++} className={className}>
            {renderInlineMarkdown(text)}
          </h3>
        ),
      );
      index += 1;
      continue;
    }

    if (/^[-*]\s+/.test(line)) {
      const items: string[] = [];
      while (index < lines.length && /^[-*]\s+/.test(lines[index]?.trim() ?? "")) {
        items.push((lines[index]?.trim() ?? "").replace(/^[-*]\s+/, ""));
        index += 1;
      }
      blocks.push(
        <ul key={key++} className="list-disc space-y-2 pl-6">
          {items.map((item, itemIndex) => (
            <li key={itemIndex}>{renderInlineMarkdown(item)}</li>
          ))}
        </ul>,
      );
      continue;
    }

    if (/^\d+\.\s+/.test(line)) {
      const items: string[] = [];
      while (index < lines.length && /^\d+\.\s+/.test(lines[index]?.trim() ?? "")) {
        items.push((lines[index]?.trim() ?? "").replace(/^\d+\.\s+/, ""));
        index += 1;
      }
      blocks.push(
        <ol key={key++} className="list-decimal space-y-2 pl-6">
          {items.map((item, itemIndex) => (
            <li key={itemIndex}>{renderInlineMarkdown(item)}</li>
          ))}
        </ol>,
      );
      continue;
    }

    if (line.startsWith("> ")) {
      const quoteLines: string[] = [];
      while (index < lines.length && (lines[index]?.trim() ?? "").startsWith("> ")) {
        quoteLines.push((lines[index]?.trim() ?? "").replace(/^>\s+/, ""));
        index += 1;
      }
      blocks.push(
        <blockquote
          key={key++}
          className="border-l-4 border-quinary bg-teal-50/70 py-3 pl-4 text-gray-700"
        >
          {quoteLines.map((quote, quoteIndex) => (
            <p key={quoteIndex}>{renderInlineMarkdown(quote)}</p>
          ))}
        </blockquote>,
      );
      continue;
    }

    const paragraphLines = [line];
    index += 1;
    while (index < lines.length) {
      const nextLine = lines[index]?.trim() ?? "";
      if (
        !nextLine ||
        /^(#{1,3})\s+/.test(nextLine) ||
        /^[-*]\s+/.test(nextLine) ||
        /^\d+\.\s+/.test(nextLine) ||
        nextLine.startsWith("> ")
      ) {
        break;
      }
      paragraphLines.push(nextLine);
      index += 1;
    }

    blocks.push(
      <p key={key++} className="leading-relaxed">
        {renderInlineMarkdown(paragraphLines.join(" "))}
      </p>,
    );
  }

  return <div className={compact ? "space-y-2 text-sm text-gray-700" : "space-y-5 text-gray-700"}>{blocks}</div>;
}

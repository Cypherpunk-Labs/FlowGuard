export function insertAtCursor(content: string, insertion: string, cursorPos: number): { content: string; newCursorPos: number } {
  const before = content.slice(0, cursorPos);
  const after = content.slice(cursorPos);
  return {
    content: before + insertion + after,
    newCursorPos: cursorPos + insertion.length
  };
}

export function wrapSelection(content: string, start: number, end: number, wrapper: string): string {
  const before = content.slice(0, start);
  const selection = content.slice(start, end);
  const after = content.slice(end);
  return before + wrapper + selection + wrapper + after;
}

export function insertDiagram(content: string, diagram: string, cursorPos: number): string {
  const diagramBlock = `\`\`\`mermaid\n${diagram}\n\`\`\`\n`;
  return insertAtCursor(content, diagramBlock, cursorPos).content;
}

export function extractDiagrams(content: string): { type: string; code: string; position: number }[] {
  const diagrams: { type: string; code: string; position: number }[] = [];
  const regex = /```mermaid\n([\s\S]*?)```/g;
  let match;

  while ((match = regex.exec(content)) !== null) {
    const code = match[1];
    if (code !== undefined) {
      diagrams.push({
        type: 'mermaid',
        code: code.trim(),
        position: match.index
      });
    }
  }

  return diagrams;
}

export function formatMarkdown(content: string): string {
  let formatted = content
    .replace(/\r\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  const lines = formatted.split('\n');
  const processedLines = lines.map((line, index) => {
    if (line.match(/^### .+/)) {
      return line;
    }
    if (line.match(/^## .+/)) {
      return line;
    }
    if (line.match(/^# .+/)) {
      return line;
    }
    return line;
  });

  return processedLines.join('\n');
}

export function parseMetadataFromContent(content: string): { metadata: Record<string, unknown>; content: string } {
  const frontmatterRegex = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/;
  const match = content.match(frontmatterRegex);

  if (!match) {
    return { metadata: {}, content };
  }

  const yamlContent = match[1] || '';
  const markdownContent = match[2] || '';

  const metadata: Record<string, unknown> = {};
  yamlContent.split('\n').forEach(line => {
    const colonIndex = line.indexOf(':');
    if (colonIndex > 0) {
      const key = line.slice(0, colonIndex).trim();
      let value: string | string[] = line.slice(colonIndex + 1).trim();
      if (value.startsWith('[') && value.endsWith(']')) {
        const arrayContent = value.slice(1, -1);
        value = arrayContent.split(',').map(v => v.trim().replace(/['"]/g, ''));
      } else if (typeof value === 'string' && value.startsWith('"') && value.endsWith('"')) {
        value = value.slice(1, -1);
      } else if (typeof value === 'string' && value.startsWith("'") && value.endsWith("'")) {
        value = value.slice(1, -1);
      }
      (metadata as Record<string, unknown>)[key] = value;
    }
  });

  return { metadata, content: markdownContent };
}

export function buildFrontmatter(metadata: Record<string, unknown>): string {
  const lines: string[] = ['---'];

  Object.entries(metadata).forEach(([key, value]) => {
    if (value === undefined || value === null) {
      return;
    }
    if (Array.isArray(value)) {
      lines.push(`${key}: [${value.map(v => typeof v === 'string' ? `'${v}'` : v).join(', ')}]`);
    } else if (typeof value === 'string') {
      lines.push(`${key}: '${value}'`);
    } else {
      lines.push(`${key}: ${value}`);
    }
  });

  lines.push('---');
  return lines.join('\n');
}

export function generateTableOfContents(content: string): string {
  const headings: { level: number; text: string }[] = [];
  const regex = /^(#{1,6})\s+(.+)$/gm;
  let match;

  while ((match = regex.exec(content)) !== null) {
    const match1 = match[1];
    const match2 = match[2];
    if (match1 !== undefined && match2 !== undefined) {
      headings.push({
        level: match1.length,
        text: match2
      });
    }
  }

  if (headings.length === 0) {
    return '';
  }

  const tocLines: string[] = ['## Table of Contents', ''];
  headings.forEach(heading => {
    const indent = '  '.repeat(heading.level - 1);
    const slug = heading.text.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    tocLines.push(`${indent}- [${heading.text}](#${slug})`);
  });

  return tocLines.join('\n');
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '') || '';
}

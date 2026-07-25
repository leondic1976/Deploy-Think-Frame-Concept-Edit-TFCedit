export interface TextRange {
  start: number;
  end: number;
}

function normalize(value: string): string {
  return value.toLocaleLowerCase('ko-KR');
}

export function findLiteralMatch(
  content: string,
  query: string,
  anchor: number,
  direction: 'next' | 'previous',
): TextRange | null {
  if (!query) return null;
  const source = normalize(content);
  const needle = normalize(query);
  const safeAnchor = Math.min(content.length, Math.max(0, anchor));
  let index =
    direction === 'next'
      ? source.indexOf(needle, safeAnchor)
      : safeAnchor === 0
        ? -1
        : source.lastIndexOf(needle, safeAnchor - 1);
  if (index < 0) {
    index = direction === 'next' ? source.indexOf(needle) : source.lastIndexOf(needle);
  }
  return index < 0 ? null : { start: index, end: index + query.length };
}

export function replaceLiteralSelection(
  content: string,
  query: string,
  replacement: string,
  selection: TextRange,
): { content: string; selection: TextRange } | null {
  const selected = content.slice(selection.start, selection.end);
  if (!query || normalize(selected) !== normalize(query)) return null;
  return {
    content:
      content.slice(0, selection.start) + replacement + content.slice(selection.end),
    selection: {
      start: selection.start,
      end: selection.start + replacement.length,
    },
  };
}

export function replaceAllLiteral(
  content: string,
  query: string,
  replacement: string,
): { content: string; count: number } {
  if (!query) return { content, count: 0 };
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  let count = 0;
  const replaced = content.replace(new RegExp(escaped, 'giu'), () => {
    count += 1;
    return replacement;
  });
  return { content: replaced, count };
}

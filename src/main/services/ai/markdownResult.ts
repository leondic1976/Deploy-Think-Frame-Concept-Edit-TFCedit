import { randomUUID } from 'node:crypto';
import type { AIStage, AssistantResult } from '../../../shared/contracts';

const EVIDENCE: Record<
  string,
  AssistantResult['sections'][number]['items'][number]['evidenceStatus']
> = {
  '사용자 진술': 'user-stated',
  'AI 정리': 'ai-organized',
  'AI 추론': 'ai-inferred',
  '확인 필요': 'needs-verification',
};

interface ParsedSection {
  title: string;
  lines: string[];
}

function parseSections(markdown: string): ParsedSection[] {
  const sections: ParsedSection[] = [];
  let current: ParsedSection = { title: '주요 내용', lines: [] };
  for (const line of markdown.split(/\r?\n/)) {
    const heading = /^##\s+(.+)$/.exec(line);
    if (heading) {
      if (current.lines.some((item) => item.trim())) sections.push(current);
      current = { title: heading[1].trim(), lines: [] };
    } else if (!/^#\s+/.test(line)) {
      current.lines.push(line);
    }
  }
  if (current.lines.some((item) => item.trim())) sections.push(current);
  return sections;
}

function contentLines(lines: string[]): string[] {
  return lines
    .map((line) => line.replace(/^\s*(?:[-*]|\d+\.)\s*/, '').trim())
    .filter(Boolean);
}

export function parseMarkdownResult(stage: AIStage, markdown: string): AssistantResult {
  const title = /^#\s+(.+)$/m.exec(markdown)?.[1]?.trim() ?? 'AI 분석 결과';
  const parsed = parseSections(markdown);
  const summarySection = parsed.find((section) => section.title.includes('핵심 요약'));
  const questionSection = parsed.find((section) => section.title.includes('확인 질문'));
  const actionSection = parsed.find((section) => section.title.includes('다음 행동'));
  const regularSections = parsed.filter(
    (section) =>
      section !== summarySection &&
      section !== questionSection &&
      section !== actionSection,
  );

  return {
    stage,
    title,
    summary: contentLines(summarySection?.lines ?? []).join(' ') || title,
    sections: regularSections.map((section) => ({
      id: randomUUID(),
      title: section.title,
      items: contentLines(section.lines).map((line) => {
        const match = /^\[([^\]]+)\]\s*(.*)$/.exec(line);
        return {
          id: randomUUID(),
          label: match?.[1] ?? 'AI 정리',
          content: match?.[2] || line,
          evidenceStatus: EVIDENCE[match?.[1] ?? ''] ?? 'ai-organized',
        };
      }),
    })),
    questions: contentLines(questionSection?.lines ?? [])
      .slice(0, 3)
      .map((question) => ({
        id: randomUUID(),
        question,
        reason: '결과의 정확도에 영향을 줄 수 있습니다.',
        priority: 'medium' as const,
      })),
    nextActions: contentLines(actionSection?.lines ?? []),
    finalPrompt: stage === 'prompt' ? markdown : undefined,
    rawText: markdown,
    createdAt: new Date().toISOString(),
  };
}

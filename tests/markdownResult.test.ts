import { describe, expect, it } from 'vitest';
import { parseMarkdownResult } from '../src/main/services/ai/markdownResult';

describe('parseMarkdownResult', () => {
  it('구조화된 Markdown을 결과 카드 데이터로 변환한다', () => {
    const result = parseMarkdownResult(
      'organize',
      `# 체계화 결과

## 핵심 요약
작은 메모 앱을 만든다.

## 주요 내용
- [사용자 진술] Windows 앱이 필요하다.
- [AI 추론] 오프라인 편집이 중요할 수 있다.
- [확인 필요] 배포 정책을 확인해야 한다.

## 확인 질문
1. 첫 사용자는 누구인가?

## 다음 행동
1. 최소 화면을 작성한다.`,
    );

    expect(result.title).toBe('체계화 결과');
    expect(result.summary).toBe('작은 메모 앱을 만든다.');
    expect(result.sections[0].items.map((item) => item.evidenceStatus)).toEqual([
      'user-stated',
      'ai-inferred',
      'needs-verification',
    ]);
    expect(result.questions).toHaveLength(1);
    expect(result.nextActions).toEqual(['최소 화면을 작성한다.']);
  });

  it('예상 제목이 없어도 원문을 보존한다', () => {
    const raw = '형식이 없는 AI 응답';
    const result = parseMarkdownResult('structure', raw);
    expect(result.rawText).toBe(raw);
    expect(result.title).toBe('AI 분석 결과');
  });
});

import { describe, expect, it } from 'vitest';
import { MAX_AI_INPUT_LENGTH } from '../src/shared/constants';
import { buildPrompt } from '../src/main/services/ai/promptFactory';

describe('buildPrompt', () => {
  it('단계 지시, 출력 형식, 원문을 분리해 구성한다', () => {
    const result = buildPrompt('organize', '새 서비스 아이디어', '비용을 우선한다.');
    expect(result.system).toContain('사고 보조자');
    expect(result.user).toContain('다음 메모를 체계화하라');
    expect(result.user).toContain('사용자 추가 지시');
    expect(result.user).toContain('새 서비스 아이디어');
  });

  it('빈 입력을 거부한다', () => {
    expect(() => buildPrompt('validate', '   ')).toThrow('분석할 텍스트');
  });

  it('최대 컨텍스트 길이를 제한한다', () => {
    expect(() => buildPrompt('realize', '가'.repeat(MAX_AI_INPUT_LENGTH + 1))).toThrow(
      '초과',
    );
  });
});

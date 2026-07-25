import { describe, expect, it } from 'vitest';
import { parseKeyVault, serializeKeyVault } from '../src/main/services/keyVault';

describe('keyVault', () => {
  it('이전 버전의 단일 키 저장 형식을 감지한다', () => {
    expect(parseKeyVault('  legacy-secret  ')).toEqual({
      kind: 'legacy',
      apiKey: 'legacy-secret',
    });
  });

  it('제공자별 키를 분리하고 알 수 없는 항목은 버린다', () => {
    const parsed = parseKeyVault(
      JSON.stringify({
        version: 1,
        keys: {
          gemini: ' gemini-secret ',
          groq: 'groq-secret',
          unknown: 'ignore-me',
        },
      }),
    );

    expect(parsed).toEqual({
      kind: 'vault',
      value: {
        version: 1,
        keys: {
          gemini: 'gemini-secret',
          groq: 'groq-secret',
        },
      },
    });
  });

  it('직렬화한 제공자별 저장소를 다시 읽을 수 있다', () => {
    const encoded = serializeKeyVault({
      gemini: 'one',
      'openrouter-free': 'two',
    });
    expect(parseKeyVault(encoded)).toMatchObject({
      kind: 'vault',
      value: {
        keys: { gemini: 'one', 'openrouter-free': 'two' },
      },
    });
  });
});

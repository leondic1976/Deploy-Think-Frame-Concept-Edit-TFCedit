import { AI_PROVIDER_MAP, type AIProviderId } from '../../shared/aiProviders';

export interface KeyVault {
  version: 1;
  keys: Partial<Record<AIProviderId, string>>;
}

export type ParsedKeyVault =
  { kind: 'vault'; value: KeyVault } | { kind: 'legacy'; apiKey: string };

export function parseKeyVault(plaintext: string): ParsedKeyVault {
  try {
    const candidate = JSON.parse(plaintext) as {
      version?: unknown;
      keys?: Record<string, unknown>;
    };
    if (candidate.version === 1 && candidate.keys && typeof candidate.keys === 'object') {
      const keys: Partial<Record<AIProviderId, string>> = {};
      for (const [providerId, apiKey] of Object.entries(candidate.keys)) {
        if (
          providerId in AI_PROVIDER_MAP &&
          typeof apiKey === 'string' &&
          apiKey.trim().length > 0
        ) {
          keys[providerId as AIProviderId] = apiKey.trim();
        }
      }
      return { kind: 'vault', value: { version: 1, keys } };
    }
  } catch {
    // 이전 버전은 암호화된 파일에 API 키 문자열 하나만 저장했습니다.
  }
  return { kind: 'legacy', apiKey: plaintext.trim() };
}

export function serializeKeyVault(keys: KeyVault['keys']): string {
  return JSON.stringify({ version: 1, keys } satisfies KeyVault);
}

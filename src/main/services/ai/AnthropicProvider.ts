import type { ConnectionTestResult } from '../../../shared/contracts';
import type { AIProvider, ProviderOptions } from './AIProvider';

interface AnthropicResponse {
  content?: Array<{ type?: string; text?: string }>;
  error?: {
    message?: string;
  };
}

function apiError(status: number, fallback: string): Error {
  if (status === 401 || status === 403) {
    return new Error('AI 인증에 실패했습니다. API 키를 확인해 주세요.');
  }
  if (status === 429) {
    return new Error('AI API 사용량 한도에 도달했습니다. 잠시 후 다시 시도해 주세요.');
  }
  if (status >= 500) {
    return new Error('AI 제공자 서버가 응답하지 않습니다. 잠시 후 다시 시도해 주세요.');
  }
  return new Error(fallback || `AI 요청에 실패했습니다. (${status})`);
}

function endpoint(baseUrl: string, pathname: string): string {
  return `${baseUrl.replace(/\/+$/g, '')}/${pathname}`;
}

export class AnthropicProvider implements AIProvider {
  readonly requiresApiKey = true;

  constructor(private readonly options: ProviderOptions) {}

  async testConnection(): Promise<ConnectionTestResult> {
    try {
      const response = await this.request(
        endpoint(this.options.settings.baseUrl, 'v1/models'),
        { method: 'GET' },
      );
      if (!response.ok) {
        throw apiError(response.status, await response.text());
      }
      return { ok: true, message: 'AI API 연결에 성공했습니다.' };
    } catch (error) {
      return {
        ok: false,
        message: error instanceof Error ? error.message : 'AI API 연결에 실패했습니다.',
      };
    }
  }

  async generate(request: { system: string; user: string; signal?: AbortSignal }): Promise<string> {
    const response = await this.request(
      endpoint(this.options.settings.baseUrl, 'v1/messages'),
      {
        method: 'POST',
        headers: {
          ...this.headers(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: this.options.settings.model,
          max_tokens: 2048,
          system: request.system,
          messages: [{ role: 'user', content: request.user }],
          stream: false,
        }),
        signal: request.signal,
      },
    );
    const body = (await response.json().catch(() => ({}))) as AnthropicResponse;
    if (!response.ok) {
      throw apiError(response.status, body.error?.message ?? '');
    }
    const content = body.content?.map((chunk) => chunk.text).filter(Boolean).join('\n');
    if (!content) {
      throw new Error('AI가 빈 응답을 반환했습니다. 다시 시도해 주세요.');
    }
    return content;
  }

  private headers(): Record<string, string> {
    if (!this.options.apiKey) {
      throw new Error('AI API 키가 설정되어 있지 않습니다.');
    }
    return {
      'x-api-key': this.options.apiKey,
      'anthropic-version': '2023-06-01',
      Accept: 'application/json',
    };
  }

  private async request(url: string, init: RequestInit): Promise<Response> {
    const timeoutController = new AbortController();
    const timeout = setTimeout(
      () => timeoutController.abort('timeout'),
      this.options.settings.timeoutMs,
    );
    const onAbort = (): void => timeoutController.abort('cancelled');
    init.signal?.addEventListener('abort', onAbort, { once: true });
    try {
      return await fetch(url, { ...init, signal: timeoutController.signal });
    } catch (error) {
      if (timeoutController.signal.aborted) {
        if (init.signal?.aborted) {
          throw new Error('AI 분석을 취소했습니다.', { cause: error });
        }
        throw new Error(
          'AI 요청 시간이 초과되었습니다. 설정에서 제한 시간을 확인해 주세요.',
          { cause: error },
        );
      }
      throw new Error('네트워크에 연결할 수 없습니다. 인터넷 연결을 확인해 주세요.', {
        cause: error,
      });
    } finally {
      clearTimeout(timeout);
      init.signal?.removeEventListener('abort', onAbort);
    }
  }
}

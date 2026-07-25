import type { ConnectionTestResult } from '../../../shared/contracts';
import type { AIProvider, ProviderOptions } from './AIProvider';

interface OllamaResponse {
  message?: {
    role?: string;
    content?: string;
  };
  error?: string;
}

function endpoint(baseUrl: string, pathname: string): string {
  return `${baseUrl.replace(/\/+$/g, '')}/${pathname}`;
}

export class OllamaProvider implements AIProvider {
  readonly requiresApiKey = false;

  constructor(private readonly options: ProviderOptions) {}

  async testConnection(): Promise<ConnectionTestResult> {
    const response = await this.request(endpoint(this.options.settings.baseUrl, 'api/tags'), {
      method: 'GET',
    });
    if (!response.ok) {
      const message = (await response.text()) || 'AI 서비스에 연결할 수 없습니다.';
      return { ok: false, message };
    }
    return { ok: true, message: 'AI API 연결에 성공했습니다.' };
  }

  async generate(request: { system: string; user: string; signal?: AbortSignal }): Promise<string> {
    const response = await this.request(endpoint(this.options.settings.baseUrl, 'api/chat'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: this.options.settings.model,
        messages: [
          { role: 'system', content: request.system },
          { role: 'user', content: request.user },
        ],
        stream: false,
      }),
        signal: request.signal,
      });
    const body = (await response.json().catch(() => ({}))) as OllamaResponse;
    if (!response.ok) {
      throw new Error(body.error ?? `AI 요청에 실패했습니다. (${response.status})`);
    }
    const content = body.message?.content?.trim();
    if (!content) {
      throw new Error('AI가 빈 응답을 반환했습니다. 다시 시도해 주세요.');
    }
    return content;
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

import { ipcMain } from 'electron';
import { IPC } from '../../shared/ipcChannels';
import type { SecureKeyService } from '../services/secureKeyService';
import type { SettingsService } from '../services/settingsService';
import { createProvider } from '../services/ai/providerFactory';
import { parseMarkdownResult } from '../services/ai/markdownResult';
import { buildPrompt } from '../services/ai/promptFactory';
import { analyzeRequestSchema } from './schemas';

export function registerAIHandlers(
  settingsService: SettingsService,
  secureKeyService: SecureKeyService,
): void {
  const activeRequests = new Map<string, AbortController>();

  ipcMain.handle(IPC.AI_ANALYZE, async (_event, input: unknown) => {
    const request = analyzeRequestSchema.parse(input);
    if (activeRequests.has(request.requestId)) {
      throw new Error('같은 AI 요청이 이미 진행 중입니다.');
    }
    const settings = await settingsService.get();
    const apiKey = await secureKeyService.get(settings.ai.providerId);
    const provider = createProvider(settings.ai.providerId, {
      settings: settings.ai,
      apiKey: apiKey ?? undefined,
    });
    if (provider.requiresApiKey && !apiKey) {
      throw new Error('설정에서 AI API 키를 먼저 저장해 주세요.');
    }

    const prompt = buildPrompt(request.stage, request.content, request.instructions);
    const controller = new AbortController();
    activeRequests.set(request.requestId, controller);
    try {
      const rawText = await provider.generate({ ...prompt, signal: controller.signal });
      return parseMarkdownResult(request.stage, rawText);
    } finally {
      activeRequests.delete(request.requestId);
    }
  });

  ipcMain.handle(IPC.AI_CANCEL, (_event, input: unknown) => {
    if (typeof input !== 'string') return;
    activeRequests.get(input)?.abort();
  });
}

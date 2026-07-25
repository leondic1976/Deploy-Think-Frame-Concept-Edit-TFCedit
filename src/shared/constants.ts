import { AI_PROVIDER_MAP, type AIProviderId } from './aiProviders';
import type { AppSettings } from './contracts';

export const SUPPORTED_EXTENSIONS = ['.md', '.txt'] as const;
export const MAX_AI_INPUT_LENGTH = 20_000;

export const DEFAULT_SETTINGS: AppSettings = {
  workspacePath: null,
  recentWorkspaces: [],
  lastDocument: null,
  reopenLastDocument: true,
  autoSave: true,
  autoSaveDelay: 800,
  theme: 'system',
  fontSize: 15,
  ai: {
    providerId: 'chatgpt' satisfies AIProviderId,
    providerName: AI_PROVIDER_MAP.chatgpt.name,
    baseUrl: AI_PROVIDER_MAP.chatgpt.baseUrl,
    model: AI_PROVIDER_MAP.chatgpt.model,
    timeoutMs: 60_000,
    hasApiKey: false,
  },
};

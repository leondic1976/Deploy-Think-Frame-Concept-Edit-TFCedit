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
    providerName: 'OpenAI 호환 API',
    baseUrl: 'https://api.openai.com/v1',
    model: 'gpt-4.1-mini',
    timeoutMs: 60_000,
    hasApiKey: false,
  },
};

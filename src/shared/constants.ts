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
  interfaceFontSize: 14,
  interfaceFontFamily: 'system',
  fontSize: 18,
  editorFontFamily: 'sans',
  editorLineHeight: 1.75,
  readableLineLength: true,
  spellCheck: true,
  ai: {
    providerId: 'gemini' satisfies AIProviderId,
    providerName: AI_PROVIDER_MAP.gemini.name,
    baseUrl: AI_PROVIDER_MAP.gemini.baseUrl,
    model: AI_PROVIDER_MAP.gemini.model,
    timeoutMs: 60_000,
    hasApiKey: false,
  },
};

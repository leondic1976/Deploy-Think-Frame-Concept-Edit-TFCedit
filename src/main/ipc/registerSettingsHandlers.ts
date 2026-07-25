import { ipcMain } from 'electron';
import { IPC } from '../../shared/ipcChannels';
import type { SecureKeyService } from '../services/secureKeyService';
import type { SettingsService } from '../services/settingsService';
import { createProvider } from '../services/ai/providerFactory';
import { apiKeyInputSchema, apiKeyProviderSchema, settingsPatchSchema } from './schemas';

export function registerSettingsHandlers(
  settingsService: SettingsService,
  secureKeyService: SecureKeyService,
): void {
  ipcMain.handle(IPC.SETTINGS_GET, () => settingsService.get());

  ipcMain.handle(IPC.SETTINGS_UPDATE, (_event, input: unknown) =>
    settingsService.update(settingsPatchSchema.parse(input)),
  );

  ipcMain.handle(IPC.SETTINGS_SAVE_KEY, async (_event, input: unknown) => {
    const parsed = apiKeyInputSchema.parse(input);
    await secureKeyService.save(parsed.providerId, parsed.apiKey);
  });

  ipcMain.handle(IPC.SETTINGS_DELETE_KEY, async (_event, input: unknown) => {
    const parsed = apiKeyProviderSchema.parse(input);
    await secureKeyService.delete(parsed.providerId);
  });

  ipcMain.handle(IPC.SETTINGS_TEST_AI, async () => {
    const settings = await settingsService.get();
    const apiKey = await secureKeyService.get(settings.ai.providerId);
    const provider = createProvider(settings.ai.providerId, {
      settings: settings.ai,
      apiKey: apiKey ?? undefined,
    });
    if (provider.requiresApiKey && !apiKey) {
      return { ok: false, message: '먼저 API 키를 저장해 주세요.' };
    }
    return provider.testConnection();
  });
}

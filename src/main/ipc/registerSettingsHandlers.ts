import { ipcMain } from 'electron';
import { IPC } from '../../shared/ipcChannels';
import type { SecureKeyService } from '../services/secureKeyService';
import type { SettingsService } from '../services/settingsService';
import { createProvider } from '../services/ai/providerFactory';
import { settingsPatchSchema } from './schemas';

export function registerSettingsHandlers(
  settingsService: SettingsService,
  secureKeyService: SecureKeyService,
): void {
  ipcMain.handle(IPC.SETTINGS_GET, () => settingsService.get());

  ipcMain.handle(IPC.SETTINGS_UPDATE, (_event, input: unknown) =>
    settingsService.update(settingsPatchSchema.parse(input)),
  );

  ipcMain.handle(IPC.SETTINGS_SAVE_KEY, async (_event, input: unknown) => {
    if (typeof input !== 'string') throw new Error('올바르지 않은 API 키입니다.');
    await secureKeyService.save(input);
  });

  ipcMain.handle(IPC.SETTINGS_DELETE_KEY, async () => secureKeyService.delete());

  ipcMain.handle(IPC.SETTINGS_TEST_AI, async () => {
    const [settings, apiKey] = await Promise.all([
      settingsService.get(),
      secureKeyService.get(),
    ]);
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

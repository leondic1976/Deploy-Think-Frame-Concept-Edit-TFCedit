import { clipboard, ipcMain, shell } from 'electron';
import { IPC } from '../../shared/ipcChannels';
import { AI_PROVIDER_MAP } from '../../shared/aiProviders';
import { externalOpenSchema } from './schemas';

export function registerExternalHandlers(): void {
  ipcMain.handle(IPC.EXTERNAL_COPY_OPEN, async (_event, input: unknown) => {
    const parsed = externalOpenSchema.parse(input);
    const target = AI_PROVIDER_MAP[parsed.urlKey]?.website;
    if (!target) {
      throw new Error('해당 AI 서비스는 브라우저 열기 URL이 설정되어 있지 않습니다.');
    }
    clipboard.writeText(parsed.text);
    await shell.openExternal(target);
  });

  ipcMain.handle(IPC.EXTERNAL_COPY, (_event, input: unknown) => {
    if (typeof input !== 'string' || input.length > 100_000) {
      throw new Error('복사할 내용이 올바르지 않습니다.');
    }
    clipboard.writeText(input);
  });
}

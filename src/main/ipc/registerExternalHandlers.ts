import { clipboard, ipcMain, shell } from 'electron';
import { IPC } from '../../shared/ipcChannels';
import { externalOpenSchema } from './schemas';

const URLS = {
  chatgpt: 'https://chatgpt.com/',
  claude: 'https://claude.ai/new',
  gemini: 'https://gemini.google.com/app',
  grok: 'https://grok.com/',
} as const;

export function registerExternalHandlers(): void {
  ipcMain.handle(IPC.EXTERNAL_COPY_OPEN, async (_event, input: unknown) => {
    const parsed = externalOpenSchema.parse(input);
    clipboard.writeText(parsed.text);
    await shell.openExternal(URLS[parsed.urlKey]);
  });

  ipcMain.handle(IPC.EXTERNAL_COPY, (_event, input: unknown) => {
    if (typeof input !== 'string' || input.length > 100_000) {
      throw new Error('복사할 내용이 올바르지 않습니다.');
    }
    clipboard.writeText(input);
  });
}

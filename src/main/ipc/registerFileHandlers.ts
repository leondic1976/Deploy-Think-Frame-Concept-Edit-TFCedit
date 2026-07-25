import { dialog, ipcMain } from 'electron';
import type { SettingsService } from '../services/settingsService';
import type { FileService } from '../services/fileService';
import type { WorkspaceService } from '../services/workspaceService';
import { IPC } from '../../shared/ipcChannels';
import {
  createFileSchema,
  relativePathSchema,
  renameFileSchema,
  writeFileSchema,
} from './schemas';

async function workspacePath(settingsService: SettingsService): Promise<string> {
  const settings = await settingsService.get();
  if (!settings.workspacePath) {
    throw new Error('먼저 작업공간 폴더를 선택해 주세요.');
  }
  return settings.workspacePath;
}

export function registerFileHandlers(
  settingsService: SettingsService,
  workspaceService: WorkspaceService,
  fileService: FileService,
): void {
  ipcMain.handle(IPC.WORKSPACE_SELECT, async () => {
    const settings = await settingsService.get();
    const result = await dialog.showOpenDialog({
      title: 'ThinkFrame 작업공간 선택',
      defaultPath: settings.workspacePath ?? undefined,
      properties: ['openDirectory', 'createDirectory'],
    });
    if (result.canceled || !result.filePaths[0]) return null;
    const selected = await workspaceService.validate(result.filePaths[0]);
    await settingsService.setWorkspace(selected);
    return selected;
  });

  ipcMain.handle(IPC.WORKSPACE_LIST, async () =>
    workspaceService.listFiles(await workspacePath(settingsService)),
  );

  ipcMain.handle(IPC.FILE_READ, async (_event, input: unknown) => {
    const relativePath = relativePathSchema.parse(input);
    const document = await fileService.read(
      await workspacePath(settingsService),
      relativePath,
    );
    await settingsService.setLastDocument(document.relativePath);
    return document;
  });

  ipcMain.handle(IPC.FILE_WRITE, async (_event, input: unknown) =>
    fileService.write(await workspacePath(settingsService), writeFileSchema.parse(input)),
  );

  ipcMain.handle(IPC.FILE_CREATE, async (_event, input: unknown) => {
    const document = await fileService.create(
      await workspacePath(settingsService),
      createFileSchema.parse(input),
    );
    await settingsService.setLastDocument(document.relativePath);
    return document;
  });

  ipcMain.handle(IPC.FILE_RENAME, async (_event, input: unknown) => {
    const parsed = renameFileSchema.parse(input);
    const document = await fileService.rename(
      await workspacePath(settingsService),
      parsed.oldPath,
      parsed.newPath,
    );
    await settingsService.setLastDocument(document.relativePath);
    return document;
  });

  ipcMain.handle(IPC.FILE_DUPLICATE, async (_event, input: unknown) => {
    const document = await fileService.duplicate(
      await workspacePath(settingsService),
      relativePathSchema.parse(input),
    );
    await settingsService.setLastDocument(document.relativePath);
    return document;
  });

  ipcMain.handle(IPC.FILE_REMOVE, async (_event, input: unknown) => {
    const relativePath = relativePathSchema.parse(input);
    await fileService.remove(await workspacePath(settingsService), relativePath);
    const settings = await settingsService.get();
    if (settings.lastDocument === relativePath) {
      await settingsService.setLastDocument(null);
    }
  });

  ipcMain.handle(IPC.FILE_REVEAL, async (_event, input: unknown) =>
    fileService.reveal(
      await workspacePath(settingsService),
      relativePathSchema.parse(input),
    ),
  );
}

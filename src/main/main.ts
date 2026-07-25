import path from 'node:path';
import { app, BrowserWindow, session } from 'electron';
import isSquirrelStartup from 'electron-squirrel-startup';
import { registerAIHandlers } from './ipc/registerAIHandlers';
import { registerExternalHandlers } from './ipc/registerExternalHandlers';
import { registerFileHandlers } from './ipc/registerFileHandlers';
import { registerSettingsHandlers } from './ipc/registerSettingsHandlers';
import { registerWindowHandlers } from './ipc/registerWindowHandlers';
import { installContentSecurityPolicy } from './security/csp';
import { FileService } from './services/fileService';
import { SecureKeyService } from './services/secureKeyService';
import { SettingsService } from './services/settingsService';
import { WorkspaceService } from './services/workspaceService';
import { createMainWindow } from './window';

if (isSquirrelStartup) app.quit();

app
  .whenReady()
  .then(async () => {
    const secureKeyService = new SecureKeyService(
      path.join(app.getPath('userData'), 'secure', 'api-key.bin'),
    );
    const settingsService = new SettingsService(
      path.join(app.getPath('userData'), 'settings.json'),
      () => secureKeyService.has(),
    );
    await settingsService.initialize();

    installContentSecurityPolicy(session.defaultSession);
    registerWindowHandlers();
    registerFileHandlers(settingsService, new WorkspaceService(), new FileService());
    registerSettingsHandlers(settingsService, secureKeyService);
    registerAIHandlers(settingsService, secureKeyService);
    registerExternalHandlers();

    createMainWindow();
    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) createMainWindow();
    });
  })
  .catch((error: unknown) => {
    console.error('ThinkFrame 시작에 실패했습니다.', error);
    app.quit();
  });

app.on('web-contents-created', (_event, contents) => {
  contents.session.setPermissionRequestHandler((_webContents, _permission, callback) => {
    callback(false);
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

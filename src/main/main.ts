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
import { installationDirectory } from './services/installationPath';
import { SecureKeyService } from './services/secureKeyService';
import { SettingsService } from './services/settingsService';
import { UpdateService } from './services/update/updateService';
import { WorkspaceService } from './services/workspaceService';
import { createMainWindow } from './window';

async function ensureDefaultWorkspace(
  workspaceService: WorkspaceService,
): Promise<string> {
  const installedWorkspace = path.join(
    installationDirectory({
      appPath: app.getAppPath(),
      executablePath: app.getPath('exe'),
      isPackaged: app.isPackaged,
      platform: process.platform,
    }),
    'workspaces',
  );
  try {
    return await workspaceService.ensure(installedWorkspace);
  } catch (error) {
    const fallbackWorkspace = path.join(app.getPath('userData'), 'workspaces');
    console.warn(
      `설치 폴더에 작업공간을 만들 수 없어 대체 경로를 사용합니다: ${fallbackWorkspace}`,
      error,
    );
    return workspaceService.ensure(fallbackWorkspace);
  }
}

if (isSquirrelStartup) app.quit();

if (process.platform === 'win32') {
  app.setAppUserModelId('com.squirrel.ThinkFrame.ThinkFrame');
}

app
  .whenReady()
  .then(async () => {
    const secureKeyService = new SecureKeyService(
      path.join(app.getPath('userData'), 'secure', 'api-key.bin'),
    );
    const settingsService = new SettingsService(
      path.join(app.getPath('userData'), 'settings.json'),
      (providerId) => secureKeyService.has(providerId),
    );
    await settingsService.initialize();
    const initialSettings = await settingsService.get();
    await secureKeyService.migrateLegacy(initialSettings.ai.providerId);

    const workspaceService = new WorkspaceService();
    const settings = await settingsService.get();
    let configuredWorkspace = settings.workspacePath;
    if (configuredWorkspace) {
      try {
        configuredWorkspace = await workspaceService.validate(configuredWorkspace);
      } catch {
        configuredWorkspace = null;
      }
    }
    if (!configuredWorkspace) {
      const defaultWorkspace = await ensureDefaultWorkspace(workspaceService);
      await settingsService.setWorkspace(defaultWorkspace);
    }

    installContentSecurityPolicy(session.defaultSession);
    registerWindowHandlers();
    registerFileHandlers(settingsService, workspaceService, new FileService());
    registerSettingsHandlers(settingsService, secureKeyService);
    registerAIHandlers(settingsService, secureKeyService);
    registerExternalHandlers();
    if (app.isPackaged) {
      const updateService = new UpdateService();
      void updateService.checkAndApplyUpdate();
    }

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

import { app, BrowserWindow, ipcMain } from 'electron';
import { IPC } from '../../shared/ipcChannels';

function windowFor(event: Electron.IpcMainInvokeEvent): BrowserWindow | null {
  return BrowserWindow.fromWebContents(event.sender);
}

export function registerWindowHandlers(): void {
  ipcMain.handle(IPC.WINDOW_MINIMIZE, (event) => windowFor(event)?.minimize());
  ipcMain.handle(IPC.WINDOW_TOGGLE_MAXIMIZE, (event) => {
    const window = windowFor(event);
    if (!window) return;
    if (window.isMaximized()) window.unmaximize();
    else window.maximize();
  });
  ipcMain.handle(IPC.WINDOW_CLOSE, (event) => windowFor(event)?.close());
  ipcMain.handle(IPC.APP_GET_INFO, () => ({
    version: app.getVersion(),
    platform: process.platform,
  }));
}

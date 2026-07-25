import { contextBridge, ipcRenderer } from 'electron';
import type { ThinkFrameAPI } from '../shared/contracts';
import { IPC } from '../shared/ipcChannels';

const api: ThinkFrameAPI = {
  window: {
    minimize: () => ipcRenderer.invoke(IPC.WINDOW_MINIMIZE) as Promise<void>,
    toggleMaximize: () => ipcRenderer.invoke(IPC.WINDOW_TOGGLE_MAXIMIZE) as Promise<void>,
    close: () => ipcRenderer.invoke(IPC.WINDOW_CLOSE) as Promise<void>,
  },
  app: {
    getInfo: () => ipcRenderer.invoke(IPC.APP_GET_INFO),
  },
  workspace: {
    select: () => ipcRenderer.invoke(IPC.WORKSPACE_SELECT),
    listFiles: () => ipcRenderer.invoke(IPC.WORKSPACE_LIST),
  },
  files: {
    read: (relativePath) => ipcRenderer.invoke(IPC.FILE_READ, relativePath),
    write: (input) => ipcRenderer.invoke(IPC.FILE_WRITE, input),
    create: (input) => ipcRenderer.invoke(IPC.FILE_CREATE, input),
    rename: (oldPath, newPath) =>
      ipcRenderer.invoke(IPC.FILE_RENAME, { oldPath, newPath }),
    duplicate: (relativePath) => ipcRenderer.invoke(IPC.FILE_DUPLICATE, relativePath),
    remove: (relativePath) => ipcRenderer.invoke(IPC.FILE_REMOVE, relativePath),
    reveal: (relativePath) => ipcRenderer.invoke(IPC.FILE_REVEAL, relativePath),
  },
  settings: {
    get: () => ipcRenderer.invoke(IPC.SETTINGS_GET),
    update: (patch) => ipcRenderer.invoke(IPC.SETTINGS_UPDATE, patch),
    saveApiKey: (apiKey) => ipcRenderer.invoke(IPC.SETTINGS_SAVE_KEY, apiKey),
    deleteApiKey: () => ipcRenderer.invoke(IPC.SETTINGS_DELETE_KEY),
    testAIConnection: () => ipcRenderer.invoke(IPC.SETTINGS_TEST_AI),
  },
  ai: {
    analyze: (request) => ipcRenderer.invoke(IPC.AI_ANALYZE, request),
    cancel: (requestId) => ipcRenderer.invoke(IPC.AI_CANCEL, requestId),
  },
  external: {
    copyAndOpen: (urlKey, text) =>
      ipcRenderer.invoke(IPC.EXTERNAL_COPY_OPEN, { urlKey, text }),
    copy: (text) => ipcRenderer.invoke(IPC.EXTERNAL_COPY, text),
  },
};

contextBridge.exposeInMainWorld('thinkframe', api);

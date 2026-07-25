import path from 'node:path';

interface InstallationDirectoryOptions {
  appPath: string;
  executablePath: string;
  isPackaged: boolean;
  platform: NodeJS.Platform;
}

export function installationDirectory({
  appPath,
  executablePath,
  isPackaged,
  platform,
}: InstallationDirectoryOptions): string {
  if (!isPackaged) return appPath;

  const pathApi = platform === 'win32' ? path.win32 : path.posix;
  const executableDirectory = pathApi.dirname(executablePath);

  if (
    platform === 'win32' &&
    pathApi.basename(executableDirectory).toLowerCase().startsWith('app-')
  ) {
    return pathApi.dirname(executableDirectory);
  }

  if (platform === 'darwin') {
    let candidate = executableDirectory;
    while (pathApi.dirname(candidate) !== candidate) {
      if (pathApi.basename(candidate).toLowerCase().endsWith('.app')) {
        return pathApi.dirname(candidate);
      }
      candidate = pathApi.dirname(candidate);
    }
  }

  return executableDirectory;
}

import { app } from 'electron';
import { createHash, randomUUID } from 'node:crypto';
import { mkdir, mkdtemp, readFile, rm, readdir, writeFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import path from 'node:path';
import { tmpdir } from 'node:os';

interface GitHubReleaseAsset {
  name: string;
  browser_download_url: string;
}

interface GitHubRelease {
  tag_name: string;
  assets: GitHubReleaseAsset[];
}

type GitHubVersion = [major: number, minor: number, patch: number];

export class UpdateService {
  private static readonly Repository = 'leondic1976/Deploy-Think-Frame-Concept-Edit-TFCedit';
  private static readonly AssetWindows = 'ThinkFrameSetup.exe';
  private static readonly AssetMacArm = 'ThinkFrame-macOS-arm64.dmg';
  private static readonly AssetMacX64 = 'ThinkFrame-macOS-x64.dmg';
  private static readonly AssetLinuxX64 = 'ThinkFrame-linux-x64.zip';
  private static readonly InstallWindowsPath = 'C:\\ThinkFrame';
  private static readonly InstallMacPath = '/ThinkFrame/ThinkFrame.app';
  private static readonly InstallLinuxPath = '/ThinkFrame';

  private static readonly apiHeaders = {
    Accept: 'application/vnd.github+json',
    'User-Agent': 'ThinkFrame-Updater',
    'X-GitHub-Api-Version': '2022-11-28',
  };

  async checkAndApplyUpdate(): Promise<void> {
    if (!app.isPackaged) return;
    try {
      const release = await this.fetchLatestRelease();
      if (!this.isNewerVersion(release.tag_name, app.getVersion())) return;
      await this.performUpdate(release);
    } catch (error) {
      console.warn(
        'ThinkFrame 자동 업데이트 점검 실패:',
        error instanceof Error ? error.message : error,
      );
    }
  }

  private async fetchLatestRelease(): Promise<GitHubRelease> {
    const response = await fetch(
      `https://api.github.com/repos/${UpdateService.Repository}/releases/latest`,
      {
        headers: UpdateService.apiHeaders,
      },
    );
    if (!response.ok) {
      throw new Error(`릴리스 조회 실패: ${response.status}`);
    }
    return (await response.json()) as GitHubRelease;
  }

  private isNewerVersion(latestTag: string, currentVersion: string): boolean {
    const latest = this.parseVersion(latestTag);
    const current = this.parseVersion(currentVersion);
    if (!latest || !current) return false;
    return (
      latest[0] > current[0] ||
      (latest[0] === current[0] &&
        (latest[1] > current[1] ||
          (latest[1] === current[1] && latest[2] > current[2])))
    );
  }

  private parseVersion(value: string): GitHubVersion | null {
    const normalized = value.trim().replace(/^v/, '');
    const parts = normalized.split('.').map((part) => Number(part));
    if (parts.length !== 3 || parts.some(Number.isNaN)) {
      return null;
    }
    return [parts[0], parts[1], parts[2]];
  }

  private chooseAsset(): string {
    if (process.platform === 'win32') return UpdateService.AssetWindows;
    if (process.platform === 'darwin') {
      return process.arch === 'arm64'
        ? UpdateService.AssetMacArm
        : UpdateService.AssetMacX64;
    }
    return UpdateService.AssetLinuxX64;
  }

  private async performUpdate(release: GitHubRelease): Promise<void> {
    const assetName = this.chooseAsset();
    const asset = release.assets.find((item) => item.name === assetName);
    if (!asset) {
      throw new Error(`${assetName} 릴리스 에셋을 찾을 수 없습니다.`);
    }
    const checksumUrl = release.assets.find((item) => item.name === 'SHA256SUMS.txt');
    if (!checksumUrl) {
      throw new Error('SHA256SUMS.txt 릴리스 에셋을 찾을 수 없습니다.');
    }

    const temporaryDirectory = await mkdtemp(path.join(tmpdir(), 'thinkframe-update-'));
    const assetPath = path.join(temporaryDirectory, asset.name);
    const checksumPath = path.join(temporaryDirectory, 'SHA256SUMS.txt');
    try {
      await this.download(asset.browser_download_url, assetPath);
      await this.download(checksumUrl.browser_download_url, checksumPath);
      const expectedHash = this.parseChecksum(await readFile(checksumPath, 'utf8'), asset.name);
      if (!expectedHash) {
        throw new Error('SHA256SUMS에서 업데이트 파일 해시를 읽을 수 없습니다.');
      }
      const actualHash = await this.sha256(assetPath);
      if (actualHash !== expectedHash.toLowerCase()) {
        throw new Error('업데이트 파일 무결성 검사에 실패했습니다.');
      }

      if (process.platform === 'win32') {
        await this.installWindows(assetPath);
        this.restart();
        return;
      }
      if (process.platform === 'darwin') {
        await this.installMac(assetPath);
        this.restart();
        return;
      }
      await this.installLinux(assetPath);
      this.restart();
    } finally {
      await rm(temporaryDirectory, { recursive: true, force: true });
    }
  }

  private async download(url: string, target: string): Promise<void> {
    const response = await fetch(url, { headers: UpdateService.apiHeaders });
    if (!response.ok || !response.body) {
      throw new Error(`다운로드 실패: ${response.status}`);
    }
    const buffer = Buffer.from(await response.arrayBuffer());
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, buffer);
  }

  private async sha256(filePath: string): Promise<string> {
    const data = await readFile(filePath);
    return createHash('sha256').update(data).digest('hex');
  }

  private parseChecksum(contents: string, assetName: string): string | null {
    const found = contents
      .split('\n')
      .map((line) => line.trim())
      .find((line) => line.endsWith(` ${assetName}`) || line.endsWith(` *${assetName}`));
    if (!found) return null;
    const [hash] = found.split(/\s+/, 1);
    return hash?.toLowerCase() ?? null;
  }

  private async installWindows(assetPath: string): Promise<void> {
    await this.runProcess(assetPath, ['/S', `/D=${UpdateService.InstallWindowsPath}`]);
  }

  private async installMac(dmgPath: string): Promise<void> {
    const mountPoint = `/Volumes/ThinkFrame-${randomUUID()}`;
    await this.runProcess('hdiutil', [
      'attach',
      dmgPath,
      '-nobrowse',
      '-readonly',
      '-mountpoint',
      mountPoint,
    ]);
    try {
      await this.runAsRoot('mkdir', ['-p', '/ThinkFrame']);
      const sourceApp = path.join(mountPoint, 'ThinkFrame.app');
      await this.runAsRoot('rm', ['-rf', UpdateService.InstallMacPath]);
      await this.runAsRoot('ditto', [sourceApp, UpdateService.InstallMacPath]);
      await this.runAsRoot('chmod', ['-R', 'a+rx', UpdateService.InstallMacPath]);
    } finally {
      await this.runProcess('hdiutil', ['detach', mountPoint, '-quiet']);
    }
  }

  private async installLinux(zipPath: string): Promise<void> {
    const extracted = path.join(tmpdir(), `thinkframe-linux-${randomUUID()}`);
    await this.runProcess('mkdir', ['-p', extracted]);
    await this.runProcess('unzip', ['-q', zipPath, '-d', extracted]);
    const entries = await readdir(extracted, { withFileTypes: true });
    const sourceRoot =
      entries.length === 1 && entries[0].isDirectory()
        ? path.join(extracted, entries[0].name)
        : extracted;
    await this.runAsRoot('rm', ['-rf', UpdateService.InstallLinuxPath]);
    await this.runAsRoot('mkdir', ['-p', UpdateService.InstallLinuxPath]);
    await this.runAsRoot('cp', ['-a', `${sourceRoot}/.`, UpdateService.InstallLinuxPath]);
    await rm(extracted, { recursive: true, force: true });
  }

  private async runProcess(command: string, args: string[]): Promise<void> {
    await new Promise<void>((resolve, reject) => {
      const child = spawn(command, args, {
        stdio: 'inherit',
      });
      child.on('error', (error) => reject(error));
      child.on('close', (code) => {
        if (code === 0 || code === null) {
          resolve();
          return;
        }
        reject(new Error(`${command} 실패: exit ${code}`));
      });
    });
  }

  private async runAsRoot(command: string, args: string[]): Promise<void> {
    if (process.platform === 'win32') {
      await this.runProcess(command, args);
      return;
    }
    if (process.getuid?.() === 0) {
      await this.runProcess(command, args);
      return;
    }
    await this.runProcess('sudo', [command, ...args]);
  }

  private restart(): void {
    app.relaunch();
    app.exit(0);
  }
}

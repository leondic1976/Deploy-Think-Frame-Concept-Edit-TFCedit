import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { DEFAULT_SETTINGS } from '../../shared/constants';
import type { AppSettings, SettingsPatch } from '../../shared/contracts';

interface PersistedSettings extends Omit<AppSettings, 'ai'> {
  ai: Omit<AppSettings['ai'], 'hasApiKey'>;
}

function toPersisted(settings: AppSettings): PersistedSettings {
  return {
    ...settings,
    ai: {
      providerName: settings.ai.providerName,
      baseUrl: settings.ai.baseUrl,
      model: settings.ai.model,
      timeoutMs: settings.ai.timeoutMs,
    },
  };
}

function mergeSettings(input: Partial<PersistedSettings> | undefined): AppSettings {
  const merged: AppSettings = {
    ...DEFAULT_SETTINGS,
    ...input,
    recentWorkspaces: Array.isArray(input?.recentWorkspaces)
      ? input.recentWorkspaces.filter(
          (value): value is string => typeof value === 'string',
        )
      : [],
    ai: {
      ...DEFAULT_SETTINGS.ai,
      ...input?.ai,
      hasApiKey: false,
    },
  };

  merged.autoSaveDelay = Math.min(10_000, Math.max(300, merged.autoSaveDelay));
  merged.fontSize = Math.min(24, Math.max(12, merged.fontSize));
  merged.ai.timeoutMs = Math.min(180_000, Math.max(5_000, merged.ai.timeoutMs));
  return merged;
}

export class SettingsService {
  private settings: AppSettings = structuredClone(DEFAULT_SETTINGS);

  constructor(
    private readonly settingsPath: string,
    private readonly hasApiKey: () => Promise<boolean>,
  ) {}

  async initialize(): Promise<void> {
    try {
      const raw = await readFile(this.settingsPath, 'utf8');
      this.settings = mergeSettings(JSON.parse(raw) as Partial<PersistedSettings>);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        console.warn('설정 파일을 읽지 못해 기본값을 사용합니다.');
      }
      this.settings = structuredClone(DEFAULT_SETTINGS);
    }
    this.settings.ai.hasApiKey = await this.hasApiKey();
  }

  async get(): Promise<AppSettings> {
    this.settings.ai.hasApiKey = await this.hasApiKey();
    return structuredClone(this.settings);
  }

  async update(patch: SettingsPatch): Promise<AppSettings> {
    this.settings = mergeSettings({
      ...toPersisted(this.settings),
      ...patch,
      ai: {
        ...toPersisted(this.settings).ai,
        ...patch.ai,
      },
    });
    this.settings.ai.hasApiKey = await this.hasApiKey();
    await this.persist();
    return this.get();
  }

  async setWorkspace(workspacePath: string): Promise<AppSettings> {
    const recentWorkspaces = [
      workspacePath,
      ...this.settings.recentWorkspaces.filter((item) => item !== workspacePath),
    ].slice(0, 8);
    this.settings.workspacePath = workspacePath;
    this.settings.recentWorkspaces = recentWorkspaces;
    this.settings.lastDocument = null;
    await this.persist();
    return this.get();
  }

  async setLastDocument(relativePath: string | null): Promise<void> {
    this.settings.lastDocument = relativePath;
    await this.persist();
  }

  private async persist(): Promise<void> {
    await mkdir(path.dirname(this.settingsPath), { recursive: true });
    const temporary = `${this.settingsPath}.tmp`;
    await writeFile(
      temporary,
      JSON.stringify(toPersisted(this.settings), null, 2),
      'utf8',
    );
    await rename(temporary, this.settingsPath);
  }
}

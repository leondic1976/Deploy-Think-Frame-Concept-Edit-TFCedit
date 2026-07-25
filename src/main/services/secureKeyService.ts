import { mkdir, readFile, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { safeStorage } from 'electron';
import type { AIProviderId } from '../../shared/aiProviders';
import { parseKeyVault, serializeKeyVault, type KeyVault } from './keyVault';

export class SecureKeyService {
  constructor(private readonly keyPath: string) {}

  async has(providerId: AIProviderId): Promise<boolean> {
    return Boolean(await this.get(providerId));
  }

  async save(providerId: AIProviderId, apiKey: string): Promise<void> {
    const trimmed = apiKey.trim();
    if (!trimmed) throw new Error('API 키를 입력해 주세요.');
    const parsed = await this.read();
    const keys: KeyVault['keys'] =
      parsed?.kind === 'vault' ? { ...parsed.value.keys } : {};
    keys[providerId] = trimmed;
    await this.persist(keys);
  }

  async get(providerId: AIProviderId): Promise<string | null> {
    const parsed = await this.read();
    if (!parsed) return null;
    if (parsed.kind === 'legacy') return parsed.apiKey || null;
    return parsed.value.keys[providerId] ?? null;
  }

  async migrateLegacy(providerId: AIProviderId): Promise<void> {
    const parsed = await this.read();
    if (parsed?.kind !== 'legacy' || !parsed.apiKey) return;
    await this.persist({ [providerId]: parsed.apiKey });
  }

  async delete(providerId: AIProviderId): Promise<void> {
    const parsed = await this.read();
    if (!parsed) return;
    if (parsed.kind === 'vault') {
      const keys = { ...parsed.value.keys };
      delete keys[providerId];
      if (Object.keys(keys).length > 0) {
        await this.persist(keys);
        return;
      }
    }
    try {
      await unlink(this.keyPath);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
    }
  }

  private async read(): Promise<ReturnType<typeof parseKeyVault> | null> {
    try {
      const encoded = await readFile(this.keyPath, 'utf8');
      this.assertEncryptionAvailable();
      const plaintext = safeStorage.decryptString(Buffer.from(encoded, 'base64'));
      return parseKeyVault(plaintext);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') return null;
      throw error;
    }
  }

  private async persist(keys: KeyVault['keys']): Promise<void> {
    this.assertEncryptionAvailable();
    await mkdir(path.dirname(this.keyPath), { recursive: true });
    const encrypted = safeStorage.encryptString(serializeKeyVault(keys));
    await writeFile(this.keyPath, encrypted.toString('base64'), {
      encoding: 'utf8',
      mode: 0o600,
    });
  }

  private assertEncryptionAvailable(): void {
    if (!safeStorage.isEncryptionAvailable()) {
      throw new Error('운영체제의 보안 저장소를 사용할 수 없습니다.');
    }
  }
}

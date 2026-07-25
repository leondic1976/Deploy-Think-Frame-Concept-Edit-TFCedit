import { mkdir, readFile, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { safeStorage } from 'electron';

export class SecureKeyService {
  constructor(private readonly keyPath: string) {}

  async has(): Promise<boolean> {
    try {
      await readFile(this.keyPath);
      return true;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') return false;
      throw error;
    }
  }

  async save(apiKey: string): Promise<void> {
    const trimmed = apiKey.trim();
    if (!trimmed) throw new Error('API 키를 입력해 주세요.');
    if (!safeStorage.isEncryptionAvailable()) {
      throw new Error('운영체제의 보안 저장소를 사용할 수 없습니다.');
    }
    await mkdir(path.dirname(this.keyPath), { recursive: true });
    const encrypted = safeStorage.encryptString(trimmed);
    await writeFile(this.keyPath, encrypted.toString('base64'), {
      encoding: 'utf8',
      mode: 0o600,
    });
  }

  async get(): Promise<string | null> {
    try {
      const encoded = await readFile(this.keyPath, 'utf8');
      if (!safeStorage.isEncryptionAvailable()) {
        throw new Error('운영체제의 보안 저장소를 사용할 수 없습니다.');
      }
      return safeStorage.decryptString(Buffer.from(encoded, 'base64'));
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') return null;
      throw error;
    }
  }

  async delete(): Promise<void> {
    try {
      await unlink(this.keyPath);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
    }
  }
}

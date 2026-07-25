import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import {
  normalizeRelativeDocumentPath,
  resolveWorkspaceDocument,
} from '../src/main/security/pathGuard';

const temporaryDirectories: string[] = [];

async function workspace(): Promise<string> {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'thinkframe-test-'));
  temporaryDirectories.push(directory);
  return directory;
}

afterEach(async () => {
  await Promise.all(
    temporaryDirectories
      .splice(0)
      .map((directory) => rm(directory, { recursive: true, force: true })),
  );
});

describe('normalizeRelativeDocumentPath', () => {
  it('Markdown과 TXT 문서 경로를 허용한다', () => {
    expect(normalizeRelativeDocumentPath('notes/idea.md')).toBe('notes/idea.md');
    expect(normalizeRelativeDocumentPath('memo.txt')).toBe('memo.txt');
  });

  it('상위 경로 및 지원하지 않는 확장자를 차단한다', () => {
    expect(() => normalizeRelativeDocumentPath('../secret.md')).toThrow('작업공간 밖');
    expect(() => normalizeRelativeDocumentPath('config.json')).toThrow(
      'Markdown(.md)과 TXT(.txt)',
    );
  });
});

describe('resolveWorkspaceDocument', () => {
  it('작업공간 내부의 기존 파일을 확인한다', async () => {
    const root = await workspace();
    await mkdir(path.join(root, 'notes'));
    await writeFile(path.join(root, 'notes', 'idea.md'), '# idea', 'utf8');
    await expect(resolveWorkspaceDocument(root, 'notes/idea.md', true)).resolves.toBe(
      path.join(root, 'notes', 'idea.md'),
    );
  });

  it('작업공간 외부의 절대 경로를 차단한다', async () => {
    const root = await workspace();
    await expect(
      resolveWorkspaceDocument(root, path.resolve(root, '..', 'outside.md'), false),
    ).rejects.toThrow('올바르지 않은 문서 경로');
  });
});

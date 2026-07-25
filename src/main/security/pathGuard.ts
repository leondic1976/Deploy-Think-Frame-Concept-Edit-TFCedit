import { lstat, realpath } from 'node:fs/promises';
import path from 'node:path';
import { SUPPORTED_EXTENSIONS } from '../../shared/constants';
import type { SupportedExtension } from '../../shared/contracts';

function assertInside(root: string, candidate: string): void {
  const relative = path.relative(root, candidate);
  if (relative.startsWith('..') || path.isAbsolute(relative)) {
    throw new Error('작업공간 밖의 경로에는 접근할 수 없습니다.');
  }
}

export function normalizeRelativeDocumentPath(input: string): string {
  if (!input || input.includes('\0') || path.isAbsolute(input)) {
    throw new Error('올바르지 않은 문서 경로입니다.');
  }

  const normalized = path.normalize(input).replaceAll('\\', '/');
  if (
    normalized === '.' ||
    normalized === '..' ||
    normalized.startsWith('../') ||
    normalized.includes('/../')
  ) {
    throw new Error('작업공간 밖의 경로에는 접근할 수 없습니다.');
  }

  const extension = path.extname(normalized).toLowerCase();
  if (!SUPPORTED_EXTENSIONS.includes(extension as SupportedExtension)) {
    throw new Error('Markdown(.md)과 TXT(.txt) 문서만 사용할 수 있습니다.');
  }

  return normalized;
}

export async function resolveWorkspaceDocument(
  workspacePath: string,
  relativePath: string,
  mustExist: boolean,
): Promise<string> {
  const normalized = normalizeRelativeDocumentPath(relativePath);
  const workspaceRoot = await realpath(workspacePath);
  const candidate = path.resolve(workspaceRoot, normalized);
  assertInside(workspaceRoot, candidate);

  if (mustExist) {
    const stats = await lstat(candidate);
    if (stats.isSymbolicLink() || !stats.isFile()) {
      throw new Error('일반 문서 파일만 열 수 있습니다.');
    }
    const resolved = await realpath(candidate);
    assertInside(workspaceRoot, resolved);
    return resolved;
  }

  const parent = await realpath(path.dirname(candidate));
  assertInside(workspaceRoot, parent);
  return candidate;
}

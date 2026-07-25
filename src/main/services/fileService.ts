import { randomUUID } from 'node:crypto';
import { access, copyFile, lstat, readFile, rename, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { shell } from 'electron';
import type {
  CreateFileInput,
  FileDocument,
  SaveResult,
  SupportedExtension,
  WriteFileInput,
} from '../../shared/contracts';
import {
  normalizeRelativeDocumentPath,
  resolveWorkspaceDocument,
} from '../security/pathGuard';

function safeDocumentName(name: string): string {
  const sanitized = [...name]
    .filter((character) => character.charCodeAt(0) >= 32)
    .join('')
    .replace(/[<>:"/\\|?*]/g, '')
    .replace(/[. ]+$/g, '')
    .trim();
  if (!sanitized) throw new Error('사용할 수 있는 문서 이름을 입력해 주세요.');
  return sanitized;
}

function defaultDocumentName(extension: SupportedExtension): string {
  const now = new Date();
  const date = now.toISOString().slice(0, 10);
  const time = now.toTimeString().slice(0, 5).replace(':', '');
  return `새 생각 ${date} ${time}${extension}`;
}

async function fileDocument(root: string, absolutePath: string): Promise<FileDocument> {
  const [content, stats] = await Promise.all([
    readFile(absolutePath, 'utf8'),
    lstat(absolutePath),
  ]);
  const extension = path.extname(absolutePath).toLowerCase() as SupportedExtension;
  return {
    relativePath: path.relative(root, absolutePath).replaceAll('\\', '/'),
    name: path.basename(absolutePath),
    extension,
    modifiedAt: stats.mtimeMs,
    size: stats.size,
    content,
  };
}

async function availablePath(root: string, requestedName: string): Promise<string> {
  const parsed = path.parse(requestedName);
  for (let index = 0; index < 1000; index += 1) {
    const suffix = index === 0 ? '' : ` ${index + 1}`;
    const candidate = `${parsed.name}${suffix}${parsed.ext}`;
    const absolutePath = await resolveWorkspaceDocument(root, candidate, false);
    try {
      await access(absolutePath);
    } catch {
      return absolutePath;
    }
  }
  throw new Error('새 문서 이름을 만들 수 없습니다.');
}

export class FileService {
  async read(workspacePath: string, relativePath: string): Promise<FileDocument> {
    const root = await resolveWorkspaceDocument(workspacePath, relativePath, true);
    return fileDocument(await pathForRoot(workspacePath), root);
  }

  async write(workspacePath: string, input: WriteFileInput): Promise<SaveResult> {
    const absolutePath = await resolveWorkspaceDocument(
      workspacePath,
      input.relativePath,
      true,
    );
    const current = await lstat(absolutePath);
    if (
      input.expectedModifiedAt !== undefined &&
      current.mtimeMs > input.expectedModifiedAt + 1
    ) {
      return { status: 'conflict', modifiedAt: current.mtimeMs };
    }

    const temporary = path.join(
      path.dirname(absolutePath),
      `.${path.basename(absolutePath)}.${randomUUID()}.tmp`,
    );
    await writeFile(temporary, input.content, 'utf8');
    await rename(temporary, absolutePath);
    const saved = await lstat(absolutePath);
    return { status: 'saved', modifiedAt: saved.mtimeMs };
  }

  async create(workspacePath: string, input: CreateFileInput): Promise<FileDocument> {
    const extension = input.extension ?? '.md';
    const proposed = input.name
      ? safeDocumentName(input.name)
      : defaultDocumentName(extension);
    const withExtension = path.extname(proposed) ? proposed : `${proposed}${extension}`;
    const normalized = normalizeRelativeDocumentPath(withExtension);
    const absolutePath = await availablePath(workspacePath, normalized);
    await writeFile(absolutePath, input.content ?? '', {
      encoding: 'utf8',
      flag: 'wx',
    });
    return fileDocument(await pathForRoot(workspacePath), absolutePath);
  }

  async rename(
    workspacePath: string,
    oldRelativePath: string,
    requestedName: string,
  ): Promise<FileDocument> {
    const source = await resolveWorkspaceDocument(workspacePath, oldRelativePath, true);
    const originalExtension = path.extname(source).toLowerCase();
    const safeName = safeDocumentName(requestedName);
    const targetName = path.extname(safeName)
      ? safeName
      : `${safeName}${originalExtension}`;
    const targetRelative = path
      .join(path.dirname(oldRelativePath), targetName)
      .replaceAll('\\', '/');
    const target = await resolveWorkspaceDocument(workspacePath, targetRelative, false);
    try {
      await access(target);
      throw new Error('같은 이름의 문서가 이미 있습니다.');
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
    }
    await rename(source, target);
    return fileDocument(await pathForRoot(workspacePath), target);
  }

  async duplicate(workspacePath: string, relativePath: string): Promise<FileDocument> {
    const source = await resolveWorkspaceDocument(workspacePath, relativePath, true);
    const parsed = path.parse(source);
    const relativeDirectory = path.posix.dirname(relativePath.replaceAll('\\', '/'));
    const duplicateName = `${parsed.name} 복사본${parsed.ext}`;
    const target = await availablePath(
      workspacePath,
      relativeDirectory === '.' ? duplicateName : `${relativeDirectory}/${duplicateName}`,
    );
    await copyFile(source, target);
    return fileDocument(await pathForRoot(workspacePath), target);
  }

  async remove(workspacePath: string, relativePath: string): Promise<void> {
    const target = await resolveWorkspaceDocument(workspacePath, relativePath, true);
    await shell.trashItem(target);
  }

  async reveal(workspacePath: string, relativePath: string): Promise<void> {
    const target = await resolveWorkspaceDocument(workspacePath, relativePath, true);
    shell.showItemInFolder(target);
  }
}

async function pathForRoot(workspacePath: string): Promise<string> {
  return resolveWorkspaceDocument(workspacePath, 'root.md', false).then((candidate) =>
    path.dirname(candidate),
  );
}

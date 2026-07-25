import { lstat, readdir, realpath } from 'node:fs/promises';
import path from 'node:path';
import { SUPPORTED_EXTENSIONS } from '../../shared/constants';
import type { FileSummary, SupportedExtension } from '../../shared/contracts';

const IGNORED_DIRECTORIES = new Set(['.git', 'node_modules']);

export class WorkspaceService {
  async validate(workspacePath: string): Promise<string> {
    const resolved = await realpath(workspacePath);
    const stats = await lstat(resolved);
    if (!stats.isDirectory()) throw new Error('폴더를 작업공간으로 선택해 주세요.');
    return resolved;
  }

  async listFiles(workspacePath: string): Promise<FileSummary[]> {
    const root = await this.validate(workspacePath);
    const files: FileSummary[] = [];

    const visit = async (directory: string): Promise<void> => {
      const entries = await readdir(directory, { withFileTypes: true });
      await Promise.all(
        entries.map(async (entry) => {
          if (entry.name.startsWith('.') || IGNORED_DIRECTORIES.has(entry.name)) return;
          const absolutePath = path.join(directory, entry.name);
          if (entry.isSymbolicLink()) return;
          if (entry.isDirectory()) {
            await visit(absolutePath);
            return;
          }
          const extension = path.extname(entry.name).toLowerCase();
          if (!SUPPORTED_EXTENSIONS.includes(extension as SupportedExtension)) return;
          const stats = await lstat(absolutePath);
          files.push({
            relativePath: path.relative(root, absolutePath).replaceAll('\\', '/'),
            name: entry.name,
            extension: extension as SupportedExtension,
            modifiedAt: stats.mtimeMs,
            size: stats.size,
          });
        }),
      );
    };

    await visit(root);
    return files.sort((left, right) => right.modifiedAt - left.modifiedAt);
  }
}

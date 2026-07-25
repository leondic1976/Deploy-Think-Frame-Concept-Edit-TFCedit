import { mkdtemp, realpath, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { WorkspaceService } from '../src/main/services/workspaceService';

const temporaryDirectories: string[] = [];

afterEach(async () => {
  await Promise.all(
    temporaryDirectories
      .splice(0)
      .map((directory) => rm(directory, { recursive: true, force: true })),
  );
});

describe('WorkspaceService.ensure', () => {
  it('없는 기본 작업공간을 만들고 실제 경로를 반환한다', async () => {
    const temporaryDirectory = await mkdtemp(
      path.join(os.tmpdir(), 'thinkframe-workspace-test-'),
    );
    temporaryDirectories.push(temporaryDirectory);
    const workspacePath = path.join(temporaryDirectory, 'workspaces');

    const workspaceService = new WorkspaceService();
    const ensured = await workspaceService.ensure(workspacePath);

    expect(ensured).toBe(await realpath(workspacePath));
    await expect(workspaceService.validate(workspacePath)).resolves.toBe(ensured);
  });
});

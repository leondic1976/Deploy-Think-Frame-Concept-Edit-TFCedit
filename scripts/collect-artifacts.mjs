import { copyFile, mkdir, readdir, rm } from 'node:fs/promises';
import path from 'node:path';

const [, , platform, arch] = process.argv;
const supportedPlatforms = new Set(['windows', 'macos', 'linux']);

if (!supportedPlatforms.has(platform) || !arch) {
  throw new Error(
    '사용법: node scripts/collect-artifacts.mjs <windows|macos|linux> <arch>',
  );
}

const root = process.cwd();
const makeDirectory = path.join(root, 'out', 'make');
const releaseDirectory = path.join(root, 'release-assets');

async function findFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await findFiles(entryPath)));
    } else {
      files.push(entryPath);
    }
  }

  return files;
}

function findOne(files, predicate, label) {
  const matches = files.filter(predicate);
  if (matches.length !== 1) {
    throw new Error(`${label} 파일은 1개여야 하지만 ${matches.length}개를 찾았습니다.`);
  }
  return matches[0];
}

await rm(releaseDirectory, { recursive: true, force: true });
await mkdir(releaseDirectory, { recursive: true });

const files = await findFiles(makeDirectory);
const copies = [];

if (platform === 'windows') {
  copies.push([
    findOne(
      files,
      (file) => path.basename(file) === 'ThinkFrameSetup.exe',
      'Windows 설치',
    ),
    'ThinkFrameSetup.exe',
  ]);
  copies.push([
    findOne(files, (file) => path.basename(file) === 'RELEASES', 'Squirrel RELEASES'),
    'RELEASES',
  ]);

  const packages = files.filter((file) => path.extname(file) === '.nupkg');
  if (packages.length === 0) {
    throw new Error('Squirrel .nupkg 파일을 찾지 못했습니다.');
  }
  for (const packagePath of packages) {
    copies.push([packagePath, path.basename(packagePath)]);
  }
}

if (platform === 'macos') {
  copies.push([
    findOne(files, (file) => path.extname(file) === '.dmg', 'macOS DMG'),
    `ThinkFrame-macOS-${arch}.dmg`,
  ]);
  copies.push([
    findOne(files, (file) => path.extname(file) === '.zip', 'macOS ZIP'),
    `ThinkFrame-macOS-${arch}.zip`,
  ]);
}

if (platform === 'linux') {
  copies.push([
    findOne(files, (file) => path.extname(file) === '.deb', 'Linux DEB'),
    `ThinkFrame-linux-${arch}.deb`,
  ]);
  copies.push([
    findOne(files, (file) => path.extname(file) === '.zip', 'Linux ZIP'),
    `ThinkFrame-linux-${arch}.zip`,
  ]);
}

for (const [source, destinationName] of copies) {
  const destination = path.join(releaseDirectory, destinationName);
  await copyFile(source, destination);
  console.log(`${path.relative(root, source)} -> ${path.relative(root, destination)}`);
}

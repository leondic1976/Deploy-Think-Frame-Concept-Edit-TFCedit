import { readFile } from 'node:fs/promises';

const packageJson = JSON.parse(
  await readFile(new URL('../package.json', import.meta.url), 'utf8'),
);
const packageLock = JSON.parse(
  await readFile(new URL('../package-lock.json', import.meta.url), 'utf8'),
);
const changelog = await readFile(new URL('../CHANGELOG.md', import.meta.url), 'utf8');
const tagIndex = process.argv.indexOf('--tag');
const tag = tagIndex >= 0 ? process.argv[tagIndex + 1] : undefined;

if (!/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(packageJson.version)) {
  throw new Error(`package.json의 버전이 SemVer 형식이 아닙니다: ${packageJson.version}`);
}

if (packageLock.version !== packageJson.version) {
  throw new Error(
    `package-lock.json 버전 ${packageLock.version}과 앱 버전 ${packageJson.version}이 일치하지 않습니다.`,
  );
}

if (!changelog.includes(`## [${packageJson.version}]`)) {
  throw new Error(`CHANGELOG.md에 [${packageJson.version}] 릴리스 기록이 없습니다.`);
}

if (tag && tag !== `v${packageJson.version}`) {
  throw new Error(
    `Git 태그 ${tag}와 앱 버전 v${packageJson.version}이 일치하지 않습니다.`,
  );
}

console.log(`ThinkFrame 버전 확인 완료: v${packageJson.version}`);

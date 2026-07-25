import { spawn } from 'node:child_process';
import { mkdir, mkdtemp, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(scriptDirectory, '..');
const executablePath = path.join(
  projectRoot,
  'out',
  'ThinkFrame-win32-x64',
  'ThinkFrame.exe',
);
const outputDirectory = path.join(projectRoot, 'site', 'videos');
const posterDirectory = path.join(projectRoot, 'site', 'images');
const framesPerSecond = 12;

const ffmpegPath =
  process.env.FFMPEG_PATH ??
  path.join(
    os.tmpdir(),
    'thinkframe-live-recording',
    'ffmpeg',
    'node_modules',
    'ffmpeg-static',
    'ffmpeg.exe',
  );

const sleep = (milliseconds) =>
  new Promise((resolve) => setTimeout(resolve, milliseconds));

class DevToolsClient {
  constructor(url) {
    this.url = url;
    this.nextId = 1;
    this.pending = new Map();
  }

  async connect() {
    this.socket = new WebSocket(this.url);
    this.socket.addEventListener('message', (event) => {
      const message = JSON.parse(event.data);
      if (!message.id) return;
      const pending = this.pending.get(message.id);
      if (!pending) return;
      this.pending.delete(message.id);
      if (message.error) {
        pending.reject(new Error(message.error.message));
      } else {
        pending.resolve(message.result);
      }
    });
    await new Promise((resolve, reject) => {
      this.socket.addEventListener('open', resolve, { once: true });
      this.socket.addEventListener('error', reject, { once: true });
    });
  }

  command(method, params = {}) {
    const id = this.nextId++;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.socket.send(JSON.stringify({ id, method, params }));
    });
  }

  close() {
    this.socket?.close();
  }
}

async function run(command, arguments_, options = {}) {
  await new Promise((resolve, reject) => {
    const child = spawn(command, arguments_, {
      cwd: projectRoot,
      stdio: 'inherit',
      ...options,
    });
    child.once('error', reject);
    child.once('exit', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${command} exited with code ${code}`));
    });
  });
}

async function waitForDebugTarget(port) {
  const deadline = Date.now() + 30_000;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(`http://127.0.0.1:${port}/json`);
      const targets = await response.json();
      const target = targets.find((item) => item.type === 'page');
      if (target?.webSocketDebuggerUrl) return target.webSocketDebuggerUrl;
    } catch {
      // The app is still starting.
    }
    await sleep(250);
  }
  throw new Error('Timed out waiting for the ThinkFrame renderer.');
}

async function evaluate(client, expression) {
  const result = await client.command('Runtime.evaluate', {
    expression,
    awaitPromise: true,
    returnByValue: true,
  });
  if (result.exceptionDetails) {
    throw new Error(result.exceptionDetails.text);
  }
  return result.result.value;
}

async function waitFor(client, expression, timeout = 10_000) {
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    if (await evaluate(client, expression)) return;
    await sleep(100);
  }
  throw new Error(`Timed out waiting for: ${expression}`);
}

async function elementCenter(client, selector, text) {
  const query = JSON.stringify(selector);
  const expectedText = JSON.stringify(text ?? null);
  const center = await evaluate(
    client,
    `(() => {
      const nodes = [...document.querySelectorAll(${query})];
      const expected = ${expectedText};
      const element = expected === null
        ? nodes[0]
        : nodes.find((node) => node.textContent.trim() === expected);
      if (!element) return null;
      const rect = element.getBoundingClientRect();
      return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
    })()`,
  );
  if (!center) throw new Error(`Element not found: ${selector} ${text ?? ''}`);
  return center;
}

async function click(client, selector, text) {
  const { x, y } = await elementCenter(client, selector, text);
  await client.command('Input.dispatchMouseEvent', {
    type: 'mouseMoved',
    x,
    y,
  });
  await client.command('Input.dispatchMouseEvent', {
    type: 'mousePressed',
    x,
    y,
    button: 'left',
    clickCount: 1,
  });
  await client.command('Input.dispatchMouseEvent', {
    type: 'mouseReleased',
    x,
    y,
    button: 'left',
    clickCount: 1,
  });
}

async function typeText(client, text, delay = 24) {
  for (const character of text) {
    await client.command('Input.insertText', { text: character });
    await sleep(delay);
  }
}

async function hold(milliseconds) {
  await sleep(milliseconds);
}

async function prepareSession(root) {
  const workspacePath = path.join(root, 'demo-workspace');
  const userDataPath = path.join(root, 'user-data');
  await mkdir(workspacePath, { recursive: true });
  await mkdir(userDataPath, { recursive: true });

  const documents = {
    '프로젝트-기획.md': `# ThinkFrame 프로젝트 기획

## 목표

흩어진 생각을 실행 가능한 문서로 발전시키는 로컬 중심 편집 환경을 만든다.

## 핵심 흐름

1. Markdown 또는 TXT 문서에 생각을 자유롭게 기록한다.
2. 문서 검색과 찾기·바꾸기로 빠르게 내용을 다듬는다.
3. 필요한 경우 사고 도우미로 다음 단계를 구체화한다.
`,
    '사용자-인터뷰.md': `# 사용자 인터뷰 메모

## 반복해서 나온 의견

- 사용자는 앱을 켜자마자 바로 기록하기를 원한다.
- 사용자는 작성한 문서가 로컬에 남는다는 점을 중요하게 본다.
- 사용자는 긴 문서에서도 원하는 표현을 빠르게 찾고 싶어 한다.

## 다음 확인

사용자 흐름을 더 단순하게 만들 수 있는지 테스트한다.
`,
    '회의-메모.txt': `이번 주 회의 메모

- 핵심 편집 흐름 점검
- 설치 경험 확인
- 다음 배포 범위 정리
`,
  };
  await Promise.all(
    Object.entries(documents).map(([name, content]) =>
      writeFile(path.join(workspacePath, name), content, 'utf8'),
    ),
  );
  await writeFile(
    path.join(userDataPath, 'settings.json'),
    JSON.stringify(
      {
        workspacePath,
        recentWorkspaces: [workspacePath],
        lastDocument: '프로젝트-기획.md',
        reopenLastDocument: true,
        autoSave: true,
        autoSaveDelay: 800,
        theme: 'light',
        fontSize: 15,
      },
      null,
      2,
    ),
    'utf8',
  );
  return { workspacePath, userDataPath };
}

async function captureLoop(client, framesDirectory, state) {
  let frame = 0;
  while (state.recording) {
    const startedAt = Date.now();
    const screenshot = await client.command('Page.captureScreenshot', {
      format: 'jpeg',
      quality: 84,
      fromSurface: true,
      captureBeyondViewport: false,
    });
    frame += 1;
    await writeFile(
      path.join(framesDirectory, `${String(frame).padStart(5, '0')}.jpg`),
      Buffer.from(screenshot.data, 'base64'),
    );
    const remaining = 1000 / framesPerSecond - (Date.now() - startedAt);
    if (remaining > 0) await sleep(remaining);
  }
  return frame;
}

async function encodeVideo(framesDirectory, outputName, posterName) {
  const outputPath = path.join(outputDirectory, outputName);
  const posterPath = path.join(posterDirectory, posterName);
  await run(ffmpegPath, [
    '-y',
    '-framerate',
    String(framesPerSecond),
    '-i',
    path.join(framesDirectory, '%05d.jpg'),
    '-vf',
    'scale=1280:774:force_original_aspect_ratio=decrease,pad=1280:800:(ow-iw)/2:(oh-ih)/2:color=0xf5f4f1',
    '-c:v',
    'libx264',
    '-preset',
    'slow',
    '-crf',
    '24',
    '-pix_fmt',
    'yuv420p',
    '-movflags',
    '+faststart',
    '-an',
    outputPath,
  ]);
  await run(ffmpegPath, [
    '-y',
    '-i',
    outputPath,
    '-frames:v',
    '1',
    '-update',
    '1',
    '-q:v',
    '3',
    posterPath,
  ]);
}

async function recordVideo({
  port,
  outputName,
  posterName,
  perform,
}) {
  const sessionRoot = await mkdtemp(
    path.join(os.tmpdir(), `thinkframe-${path.parse(outputName).name}-`),
  );
  const framesDirectory = path.join(sessionRoot, 'frames');
  await mkdir(framesDirectory, { recursive: true });
  const { userDataPath } = await prepareSession(sessionRoot);

  const app = spawn(
    executablePath,
    [`--remote-debugging-port=${port}`, `--user-data-dir=${userDataPath}`],
    {
      cwd: projectRoot,
      detached: false,
      stdio: 'ignore',
      windowsHide: false,
    },
  );

  let client;
  try {
    const debugUrl = await waitForDebugTarget(port);
    client = new DevToolsClient(debugUrl);
    await client.connect();
    await client.command('Page.enable');
    await client.command('Runtime.enable');
    await waitFor(
      client,
      `Boolean(document.querySelector('.editor-textarea')?.value)`,
    );
    await hold(750);

    const state = { recording: true };
    const capturePromise = captureLoop(client, framesDirectory, state);
    try {
      await perform(client);
    } finally {
      state.recording = false;
    }
    const frameCount = await capturePromise;
    if (frameCount < framesPerSecond * 5) {
      throw new Error(`Recording was unexpectedly short: ${frameCount} frames`);
    }
    await encodeVideo(framesDirectory, outputName, posterName);
  } finally {
    client?.close();
    if (process.platform === 'win32' && app.pid) {
      await run('taskkill', ['/pid', String(app.pid), '/T', '/F'], {
        stdio: 'ignore',
      }).catch(() => {});
    } else if (!app.killed) {
      app.kill();
    }
    await sleep(500);
  }
}

await mkdir(outputDirectory, { recursive: true });

await recordVideo({
  port: 9341,
  outputName: 'thinkframe-writing-workflow.mp4',
  posterName: 'thinkframe-writing-workflow-poster.jpg',
  perform: async (client) => {
    await hold(1_000);
    await click(client, 'button.primary.new-document');
    await waitFor(
      client,
      `document.querySelector('.editor-textarea')?.value === ''`,
    );
    await hold(450);
    await typeText(
      client,
      `# 여름 캠페인 기획

## 목표
- 첫 작성 경험을 더 단순하게
- 로컬 문서 흐름 그대로 유지

## 다음 행동
1. 핵심 화면 확정
2. 사용자 테스트 진행`,
      20,
    );
    await hold(1_700);
    await click(client, 'button[aria-label="사고 도우미 패널 전환"]');
    await hold(900);
    await click(client, 'button[aria-label="사고 도우미 패널 전환"]');
    await hold(1_200);
  },
});

await recordVideo({
  port: 9342,
  outputName: 'thinkframe-search-replace.mp4',
  posterName: 'thinkframe-search-replace-poster.jpg',
  perform: async (client) => {
    await hold(900);
    await click(client, 'input[aria-label="파일 이름 검색"]');
    await typeText(client, '인터뷰', 180);
    await hold(700);
    await click(client, '.file-main');
    await waitFor(
      client,
      `document.querySelector('.editor-textarea')?.value.includes('반복해서 나온 의견')`,
    );
    await hold(900);
    await click(client, '.editor-tools button', '찾기');
    await waitFor(
      client,
      `Boolean(document.querySelector('input[aria-label="문서에서 찾기"]'))`,
    );
    await typeText(client, '사용자', 160);
    await hold(500);
    await click(client, 'input[aria-label="바꿀 내용"]');
    await typeText(client, '고객', 180);
    await hold(500);
    await click(client, '.find-bar button', '모두 바꾸기');
    await hold(1_700);
    await click(client, 'button[aria-label="찾기 닫기"]');
    await hold(1_300);
  },
});

console.log('Recorded real ThinkFrame MP4 assets in site/videos.');

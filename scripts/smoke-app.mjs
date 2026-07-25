import { spawn } from 'node:child_process';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
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
const screenshotPath = path.join(projectRoot, 'out', 'app-settings-smoke.png');
const aiScreenshotPath = path.join(projectRoot, 'out', 'app-ai-settings-smoke.png');
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
      if (message.error) pending.reject(new Error(message.error.message));
      else pending.resolve(message.result);
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

async function evaluate(client, expression) {
  const result = await client.command('Runtime.evaluate', {
    expression,
    awaitPromise: true,
    returnByValue: true,
  });
  if (result.exceptionDetails) {
    throw new Error(
      result.exceptionDetails.exception?.description ?? result.exceptionDetails.text,
    );
  }
  return result.result.value;
}

async function waitFor(client, expression, timeout = 15_000) {
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    if (await evaluate(client, expression)) return;
    await sleep(100);
  }
  throw new Error(`Timed out waiting for: ${expression}`);
}

async function click(client, selector, text) {
  const center = await evaluate(
    client,
    `(() => {
      const nodes = [...document.querySelectorAll(${JSON.stringify(selector)})];
      const element = nodes.find((node) =>
        ${text ? `node.textContent.trim() === ${JSON.stringify(text)}` : 'true'}
      );
      if (!element) return null;
      const rect = element.getBoundingClientRect();
      return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
    })()`,
  );
  if (!center) throw new Error(`Element not found: ${selector} ${text ?? ''}`);
  await client.command('Input.dispatchMouseEvent', {
    type: 'mousePressed',
    x: center.x,
    y: center.y,
    button: 'left',
    clickCount: 1,
  });
  await client.command('Input.dispatchMouseEvent', {
    type: 'mouseReleased',
    x: center.x,
    y: center.y,
    button: 'left',
    clickCount: 1,
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
      // 앱이 시작되는 동안 다시 시도합니다.
    }
    await sleep(200);
  }
  throw new Error('ThinkFrame renderer debug target timed out.');
}

async function setControlledValue(client, selector, value, index = 0) {
  await evaluate(
    client,
    `(() => {
      const element = document.querySelectorAll(${JSON.stringify(selector)})[${index}];
      if (!element) return false;
      const prototype = element instanceof HTMLTextAreaElement
        ? HTMLTextAreaElement.prototype
        : HTMLInputElement.prototype;
      Object.getOwnPropertyDescriptor(prototype, 'value').set.call(
        element,
        ${JSON.stringify(value)}
      );
      element.dispatchEvent(new Event('input', { bubbles: true }));
      return true;
    })()`,
  );
}

async function main() {
  if (process.platform !== 'win32') {
    throw new Error('이 smoke test는 Windows 패키지에서 실행합니다.');
  }
  const userData = await mkdtemp(path.join(os.tmpdir(), 'thinkframe-smoke-'));
  const port = 9400 + Math.floor(Math.random() * 400);
  const application = spawn(
    executablePath,
    [`--remote-debugging-port=${port}`, `--user-data-dir=${userData}`, '--disable-gpu'],
    { cwd: projectRoot, stdio: 'ignore', windowsHide: true },
  );
  let client;
  try {
    client = new DevToolsClient(await waitForDebugTarget(port));
    await client.connect();
    await client.command('Runtime.enable');
    await client.command('Page.enable');
    await waitFor(client, "Boolean(document.querySelector('.app-shell'))");

    await click(client, 'button', '새 Markdown');
    await waitFor(client, "Boolean(document.querySelector('.editor-textarea'))");
    await setControlledValue(client, '.editor-textarea', 'price $5. price $5.');
    await click(client, '.editor-tools button', '찾기');
    await waitFor(client, "document.querySelectorAll('.find-bar input').length === 2");
    await setControlledValue(client, '.find-bar input', '$5', 0);
    await setControlledValue(client, '.find-bar input', '$&', 1);
    await click(client, '.find-bar button', '모두 바꾸기');
    const replaced = await evaluate(
      client,
      "document.querySelector('.editor-textarea').value",
    );
    if (replaced !== 'price $&. price $&.') {
      throw new Error(`문자열 치환 결과가 올바르지 않습니다: ${replaced}`);
    }

    await click(client, '[aria-label="설정 열기"]');
    await waitFor(client, "Boolean(document.querySelector('.settings-modal'))");
    const settingsSummary = await evaluate(
      client,
      `(() => ({
        ranges: [...document.querySelectorAll('input[type="range"]')].map((node) => node.value),
        freeProviders: [...document.querySelectorAll('.free-provider-grid strong')].map((node) => node.textContent),
        hasFontPreview: Boolean(document.querySelector('.font-preview')),
      }))()`,
    );
    if (
      settingsSummary.ranges.join(',') !== '14,18' ||
      settingsSummary.freeProviders.length !== 4 ||
      !settingsSummary.hasFontPreview
    ) {
      throw new Error(
        `설정 화면 구성이 올바르지 않습니다: ${JSON.stringify(settingsSummary)}`,
      );
    }

    await setControlledValue(client, 'input[type="range"]', '17', 0);
    await click(client, '.settings-footer button', '설정 저장');
    await waitFor(client, "!document.querySelector('.settings-modal')");
    await waitFor(
      client,
      "getComputedStyle(document.documentElement).getPropertyValue('--interface-font-size').trim() === '17px'",
    );

    await click(client, '[aria-label="설정 열기"]');
    await waitFor(client, "Boolean(document.querySelector('.settings-modal'))");
    const screenshot = await client.command('Page.captureScreenshot', {
      format: 'png',
      captureBeyondViewport: false,
    });
    await mkdir(path.dirname(screenshotPath), { recursive: true });
    await writeFile(screenshotPath, Buffer.from(screenshot.data, 'base64'));
    await evaluate(
      client,
      "document.querySelector('.settings-content').scrollTop = document.querySelector('.settings-content').scrollHeight",
    );
    await sleep(200);
    const aiScreenshot = await client.command('Page.captureScreenshot', {
      format: 'png',
      captureBeyondViewport: false,
    });
    await writeFile(aiScreenshotPath, Buffer.from(aiScreenshot.data, 'base64'));
    console.log(
      JSON.stringify({
        ok: true,
        replacement: replaced,
        interfaceFontSize: '17px',
        freeProviderCount: settingsSummary.freeProviders.length,
        screenshot: screenshotPath,
        aiScreenshot: aiScreenshotPath,
      }),
    );
  } finally {
    client?.close();
    application.kill();
    await sleep(500);
    await rm(userData, { recursive: true, force: true });
  }
}

await main();

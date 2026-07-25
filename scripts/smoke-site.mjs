import { spawn } from 'node:child_process';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import process from 'node:process';
import { pathToFileURL, fileURLToPath } from 'node:url';

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(scriptDirectory, '..');
const edgePath =
  process.env.EDGE_PATH ??
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const siteUrl = pathToFileURL(path.join(projectRoot, 'site', 'index.html')).href;
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

async function waitForDebugTarget(port) {
  const deadline = Date.now() + 20_000;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(`http://127.0.0.1:${port}/json`);
      const targets = await response.json();
      const page = targets.find((item) => item.type === 'page');
      if (page?.webSocketDebuggerUrl) return page.webSocketDebuggerUrl;
    } catch {
      // 브라우저가 시작되는 동안 다시 시도합니다.
    }
    await sleep(150);
  }
  throw new Error('Edge debug target timed out.');
}

async function evaluate(client, expression) {
  const result = await client.command('Runtime.evaluate', {
    expression,
    awaitPromise: true,
    returnByValue: true,
  });
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.text);
  return result.result.value;
}

async function removeProfile(profile) {
  for (let attempt = 0; attempt < 6; attempt += 1) {
    try {
      await rm(profile, { recursive: true, force: true });
      return;
    } catch (error) {
      if (!['EBUSY', 'EPERM'].includes(error?.code) || attempt === 5) {
        throw error;
      }
      await sleep(300 * (attempt + 1));
    }
  }
}

async function terminateBrowser(browser) {
  if (!browser.pid) return;
  await new Promise((resolve) => {
    const taskkill = spawn('taskkill.exe', ['/pid', String(browser.pid), '/t', '/f'], {
      stdio: 'ignore',
      windowsHide: true,
    });
    taskkill.once('error', resolve);
    taskkill.once('exit', resolve);
  });
}

async function capture(client, name, width, height, mobile) {
  await client.command('Emulation.setDeviceMetricsOverride', {
    width,
    height,
    deviceScaleFactor: 1,
    mobile,
    screenWidth: width,
    screenHeight: height,
  });
  await client.command('Page.reload', { ignoreCache: true });
  await sleep(1_000);
  const metrics = await evaluate(
    client,
    `(() => ({
      viewportWidth: innerWidth,
      scrollWidth: document.documentElement.scrollWidth,
      videos: [...document.querySelectorAll('video')].map((video) => ({
        source: video.querySelector('source')?.getAttribute('src'),
        type: video.querySelector('source')?.getAttribute('type'),
        autoplay: video.autoplay,
        muted: video.muted,
        loop: video.loop,
        playsInline: video.playsInline,
      })),
      hasDownload: Boolean(document.querySelector('#download')),
      heading: document.querySelector('h1')?.textContent.trim(),
    }))()`,
  );
  if (metrics.scrollWidth > metrics.viewportWidth) {
    throw new Error(
      `${name} 가로 넘침: ${metrics.scrollWidth}px > ${metrics.viewportWidth}px`,
    );
  }
  if (
    metrics.videos.length !== 2 ||
    metrics.videos.some(
      (video) =>
        video.type !== 'video/mp4' ||
        !video.autoplay ||
        !video.muted ||
        !video.loop ||
        !video.playsInline,
    ) ||
    !metrics.hasDownload ||
    !metrics.heading
  ) {
    throw new Error(`${name} 필수 콘텐츠 검증 실패: ${JSON.stringify(metrics)}`);
  }
  const result = await client.command('Page.captureScreenshot', {
    format: 'png',
    fromSurface: true,
    captureBeyondViewport: false,
  });
  const output = path.join(projectRoot, 'out', `site-${name}.png`);
  await mkdir(path.dirname(output), { recursive: true });
  await writeFile(output, Buffer.from(result.data, 'base64'));
  return { ...metrics, screenshot: output };
}

async function main() {
  if (process.platform !== 'win32') {
    throw new Error('이 smoke test는 Microsoft Edge가 설치된 Windows에서 실행합니다.');
  }
  const profile = await mkdtemp(path.join(os.tmpdir(), 'thinkframe-site-smoke-'));
  const port = 9800 + Math.floor(Math.random() * 150);
  const browser = spawn(
    edgePath,
    [
      '--headless=new',
      '--disable-gpu',
      '--hide-scrollbars',
      '--no-first-run',
      `--remote-debugging-port=${port}`,
      `--user-data-dir=${profile}`,
      siteUrl,
    ],
    { cwd: projectRoot, stdio: 'ignore', windowsHide: true },
  );
  let client;
  try {
    client = new DevToolsClient(await waitForDebugTarget(port));
    await client.connect();
    await client.command('Runtime.enable');
    await client.command('Page.enable');
    const desktop = await capture(client, 'desktop', 1440, 1100, false);
    const mobile = await capture(client, 'mobile', 390, 1000, true);
    console.log(JSON.stringify({ ok: true, desktop, mobile }));
  } finally {
    if (client) {
      await Promise.race([
        client.command('Browser.close').catch(() => undefined),
        sleep(2_000),
      ]);
    }
    client?.close();
    await terminateBrowser(browser);
    await removeProfile(profile);
  }
}

await main();

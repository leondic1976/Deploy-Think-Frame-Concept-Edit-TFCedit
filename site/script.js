const repository = 'leondic1976/Deploy-Think-Frame-Concept-Edit-TFCedit';
const commands = {
  windows:
    '$s="$env:TEMP\\install-thinkframe.ps1"; iwr "https://raw.githubusercontent.com/leondic1976/Deploy-Think-Frame-Concept-Edit-TFCedit/main/install.ps1" -OutFile $s; powershell -ExecutionPolicy Bypass -File $s',
  unix: 'curl -fsSL https://raw.githubusercontent.com/leondic1976/Deploy-Think-Frame-Concept-Edit-TFCedit/main/install.sh | sh',
};

function setVersionText(version) {
  const nodes = {
    releaseLabel: document.querySelector('#release-label'),
    heroVersion: document.querySelector('#hero-version'),
    screenVersion: document.querySelector('#screen-version'),
    screenMetaVersion: document.querySelector('#screen-meta-version'),
  };

  const safeVersion = version ?? '';
  if (nodes.releaseLabel) {
    nodes.releaseLabel.textContent = `최신 안정 버전 ${safeVersion}`;
  }
  if (nodes.heroVersion) {
    nodes.heroVersion.textContent = safeVersion;
  }
  if (nodes.screenVersion) {
    nodes.screenVersion.textContent = safeVersion;
  }
  if (nodes.screenMetaVersion) {
    nodes.screenMetaVersion.textContent = safeVersion;
  }
}

function setReleaseDate(dateText) {
  const releaseDate = document.querySelector('#release-date');
  if (releaseDate) {
    releaseDate.textContent = `${dateText} 게시 · GitHub Releases`;
  }
}

function getCurrentReleaseVersionFallback() {
  const releaseLabel = document.querySelector('#release-label');
  if (!releaseLabel) return null;
  const match = releaseLabel.textContent?.match(/v?\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?/);
  return match ? (match[0].startsWith('v') ? match[0] : `v${match[0]}`) : null;
}

function detectOperatingSystem() {
  const source = `${navigator.userAgent} ${navigator.platform}`.toLowerCase();
  if (source.includes('win')) return 'windows';
  if (source.includes('mac')) return 'macos';
  if (source.includes('linux')) return 'linux';
  return '';
}

function showRecommendedDownload() {
  const operatingSystem = detectOperatingSystem();
  const card = document.querySelector(`[data-os="${operatingSystem}"]`);
  card?.classList.add('recommended');

  const tab = document.querySelector(
    `[data-command="${operatingSystem === 'windows' ? 'windows' : 'unix'}"]`,
  );
  tab?.click();
}

async function loadLatestRelease() {
  try {
    const response = await fetch(
      `https://api.github.com/repos/${repository}/releases/latest`,
      { headers: { Accept: 'application/vnd.github+json' } },
    );
    if (!response.ok) return;

    const release = await response.json();
    if (typeof release.tag_name === 'string') {
      setVersionText(release.tag_name);
    }

    const published = new Intl.DateTimeFormat('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(new Date(release.published_at));
    setReleaseDate(published);

    const assets = new Map(
      Array.isArray(release.assets)
        ? release.assets.map((asset) => [asset.name, asset.browser_download_url])
        : [],
    );
    document.querySelectorAll('[data-asset]').forEach((link) => {
      const url = assets.get(link.dataset.asset);
      if (url) link.href = url;
    });
  } catch {
    // 고정된 latest 다운로드 링크를 그대로 사용합니다.
    const fallback = getCurrentReleaseVersionFallback();
    if (fallback) setVersionText(fallback);
  }
}

document.querySelectorAll('.terminal-tab').forEach((tab) => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.terminal-tab').forEach((item) => {
      item.classList.remove('active');
      item.setAttribute('aria-selected', 'false');
    });
    tab.classList.add('active');
    tab.setAttribute('aria-selected', 'true');
    const command = document.querySelector('#install-command');
    if (command && tab.dataset.command in commands) {
      command.textContent = commands[tab.dataset.command];
    }
  });
});

async function copyText(text) {
  if (navigator.clipboard && window.isSecureContext) {
    await navigator.clipboard.writeText(text);
    return;
  }
  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.setAttribute('readonly', '');
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  document.body.append(textarea);
  textarea.select();
  const copied = document.execCommand('copy');
  textarea.remove();
  if (!copied) throw new Error('copy failed');
}

document.querySelector('#copy-command')?.addEventListener('click', async (event) => {
  const button = event.currentTarget;
  const command = document.querySelector('#install-command')?.textContent?.trim();
  if (!command) return;
  try {
    await copyText(command);
    button.textContent = '복사됨';
  } catch {
    button.textContent = '직접 선택해 복사';
  }
  window.setTimeout(() => {
    button.textContent = '복사';
  }, 1600);
});

showRecommendedDownload();
void loadLatestRelease();

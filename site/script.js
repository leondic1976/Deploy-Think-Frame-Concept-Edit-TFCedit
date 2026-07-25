const repository = 'leondic1976/Deploy-Think-Frame-Concept-Edit-TFCedit';
const commands = {
  windows:
    '$s="$env:TEMP\\install-thinkframe.ps1"; iwr "https://raw.githubusercontent.com/leondic1976/Deploy-Think-Frame-Concept-Edit-TFCedit/main/install.ps1" -OutFile $s; powershell -ExecutionPolicy Bypass -File $s',
  unix: 'curl -fsSL https://raw.githubusercontent.com/leondic1976/Deploy-Think-Frame-Concept-Edit-TFCedit/main/install.sh | sh',
};

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
    document.querySelector('#release-label').textContent =
      `최신 안정 버전 ${release.tag_name}`;

    const published = new Intl.DateTimeFormat('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(new Date(release.published_at));
    document.querySelector('#release-date').textContent =
      `${published} 게시 · GitHub Releases`;

    const assets = new Map(
      release.assets.map((asset) => [asset.name, asset.browser_download_url]),
    );
    document.querySelectorAll('[data-asset]').forEach((link) => {
      const url = assets.get(link.dataset.asset);
      if (url) link.href = url;
    });
  } catch {
    // 고정된 latest 다운로드 링크를 그대로 사용합니다.
  }
}

document.querySelectorAll('.terminal-tab').forEach((tab) => {
  tab.addEventListener('click', () => {
    document
      .querySelectorAll('.terminal-tab')
      .forEach((item) => item.classList.remove('active'));
    tab.classList.add('active');
    document.querySelector('#install-command').textContent =
      commands[tab.dataset.command];
  });
});

document.querySelector('#copy-command').addEventListener('click', async (event) => {
  const button = event.currentTarget;
  const command = document.querySelector('#install-command').textContent;
  await navigator.clipboard.writeText(command);
  button.textContent = '완료';
  window.setTimeout(() => {
    button.textContent = '복사';
  }, 1400);
});

showRecommendedDownload();
void loadLatestRelease();

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

function initGuideVideo() {
  const steps = Array.from(document.querySelectorAll('.guide-step'));
  const headline = document.querySelector('#guide-video-headline');
  const copy = document.querySelector('#guide-video-copy');
  const chip = document.querySelector('#guide-video-chip');
  const progress = document.querySelector('#guide-video-progress');

  if (
    steps.length === 0 ||
    !headline ||
    !copy ||
    !chip ||
    !progress
  ) {
    return;
  }

  let currentStep = 0;

  const renderStep = () => {
    const current = steps[currentStep];
    const stepTitle = current.querySelector('h3')?.textContent?.trim() ?? '';
    const stepCopy = current.querySelector('p')?.textContent?.trim() ?? '';
    const stepNumber = current.querySelector('.step-number')?.textContent?.trim() ?? '';

    headline.textContent = stepTitle;
    copy.textContent = stepCopy;
    chip.textContent = `STEP ${stepNumber}`;

    steps.forEach((step, index) => {
      step.classList.toggle('is-active', index === currentStep);
    });

    const progressRate = (currentStep + 1) / steps.length;
    progress.style.transform = `scaleX(${progressRate})`;
  };

  renderStep();

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return;
  }

  window.setInterval(() => {
    currentStep = (currentStep + 1) % steps.length;
    renderStep();
  }, 2600);
}

function getCurrentReleaseVersionFallback() {
  const releaseLabel = document.querySelector('#release-label');
  if (!releaseLabel) return null;
  const match = releaseLabel.textContent?.match(/v?\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?/);
  return match ? match[0].startsWith('v') ? match[0] : `v${match[0]}` : null;
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
    setVersionText(release.tag_name);

    const published = new Intl.DateTimeFormat('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(new Date(release.published_at));
    setReleaseDate(published);

    const assets = new Map(
      release.assets.map((asset) => [asset.name, asset.browser_download_url]),
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
    document
      .querySelectorAll('.terminal-tab')
      .forEach((item) => item.classList.remove('active'));
    tab.classList.add('active');
    document.querySelector('#install-command').textContent =
      commands[tab.dataset.command];
  });
});

initGuideVideo();

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

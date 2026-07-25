# ThinkFrame

ThinkFrame은 Markdown·TXT 문서를 편집하고, 작성한 생각을 AI로 체계화·구조화·개념검증·현실화한 뒤 최종 작업 프롬프트로 만드는 데스크톱 프로그램입니다.

## 버전

- 현재 안정 버전: `0.2.0`
- 현재 버전 릴리스: [v0.2.0](https://github.com/leondic1976/Deploy-Think-Frame-Concept-Edit-TFCedit/releases/tag/v0.2.0)
- 최신 릴리스: [releases/latest](https://github.com/leondic1976/Deploy-Think-Frame-Concept-Edit-TFCedit/releases/latest)
- 전체 버전: [releases](https://github.com/leondic1976/Deploy-Think-Frame-Concept-Edit-TFCedit/releases)
- 변경 기록: [CHANGELOG.md](CHANGELOG.md)

## 다운로드

배포 위치는 GitHub Releases입니다. 설치 파일과 압축 파일은 다음 최신 버전 경로에서 받을 수 있습니다.

| 운영체제 | 지원 환경         | 설치 파일                                                                                                                                                |
| -------- | ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Windows  | Windows 10/11 x64 | [ThinkFrameSetup.exe](https://github.com/leondic1976/Deploy-Think-Frame-Concept-Edit-TFCedit/releases/latest/download/ThinkFrameSetup.exe)               |
| macOS    | Apple Silicon     | [ThinkFrame-macOS-arm64.dmg](https://github.com/leondic1976/Deploy-Think-Frame-Concept-Edit-TFCedit/releases/latest/download/ThinkFrame-macOS-arm64.dmg) |
| macOS    | Intel x64         | [ThinkFrame-macOS-x64.dmg](https://github.com/leondic1976/Deploy-Think-Frame-Concept-Edit-TFCedit/releases/latest/download/ThinkFrame-macOS-x64.dmg)     |
| Linux    | Debian/Ubuntu x64 | [ThinkFrame-linux-x64.deb](https://github.com/leondic1976/Deploy-Think-Frame-Concept-Edit-TFCedit/releases/latest/download/ThinkFrame-linux-x64.deb)     |

설치하지 않고 압축을 풀어 실행하는 파일:

- [macOS Apple Silicon ZIP](https://github.com/leondic1976/Deploy-Think-Frame-Concept-Edit-TFCedit/releases/latest/download/ThinkFrame-macOS-arm64.zip)
- [macOS Intel ZIP](https://github.com/leondic1976/Deploy-Think-Frame-Concept-Edit-TFCedit/releases/latest/download/ThinkFrame-macOS-x64.zip)
- [Linux x64 ZIP](https://github.com/leondic1976/Deploy-Think-Frame-Concept-Edit-TFCedit/releases/latest/download/ThinkFrame-linux-x64.zip)

각 릴리스의 `SHA256SUMS.txt`에서 파일 무결성을 확인할 수 있습니다. GitHub Releases를 기준 배포 채널로 사용하며 npm과 WinGet에는 배포하지 않습니다.

## 터미널 설치

### Windows PowerShell

최신 버전:

```powershell
$script="$env:TEMP\install-thinkframe.ps1"; Invoke-WebRequest "https://raw.githubusercontent.com/leondic1976/Deploy-Think-Frame-Concept-Edit-TFCedit/main/install.ps1" -OutFile $script; powershell.exe -NoProfile -ExecutionPolicy Bypass -File $script
```

화면 없이 설치:

```powershell
$script="$env:TEMP\install-thinkframe.ps1"; Invoke-WebRequest "https://raw.githubusercontent.com/leondic1976/Deploy-Think-Frame-Concept-Edit-TFCedit/main/install.ps1" -OutFile $script; powershell.exe -NoProfile -ExecutionPolicy Bypass -File $script -Silent
```

특정 버전:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "$env:TEMP\install-thinkframe.ps1" -Version 0.2.0
```

### macOS·Linux

최신 버전:

```sh
curl -fsSL https://raw.githubusercontent.com/leondic1976/Deploy-Think-Frame-Concept-Edit-TFCedit/main/install.sh | sh
```

특정 버전:

```sh
curl -fsSL https://raw.githubusercontent.com/leondic1976/Deploy-Think-Frame-Concept-Edit-TFCedit/main/install.sh | sh -s -- 0.2.0
```

설치 스크립트는 GitHub Release에서 운영체제에 맞는 파일과 `SHA256SUMS.txt`를 내려받아 SHA-256을 검증합니다. macOS는 `/Applications/ThinkFrame.app`, Linux는 DEB 패키지로 설치합니다.

현재 macOS 앱은 코드 서명되지 않았습니다. 처음 실행이 차단되면 시스템 설정의 개인정보 보호 및 보안에서 ThinkFrame 실행을 허용해야 합니다.

## 주요 기능

- 로컬 작업공간의 `.md`, `.txt` 문서 생성·열기·편집·자동 저장
- 일반 텍스트 편집, 문서 내 찾기·바꾸기, 행·열 표시
- 문서 이름 변경·복제·휴지통 이동·파일 관리자에서 보기
- 선택 영역 또는 문서 전체 AI 분석
- 체계화·구조화·개념검증·현실화·최종 프롬프트 생성
- 사용자 진술·AI 정리·AI 추론·확인 필요 구분
- AI 결과 복사·선택 영역 아래 삽입·문서 끝에 추가·새 문서 저장
- 밝게·어둡게·시스템 테마
- ChatGPT·Claude·Gemini·Grok 웹 페이지 열기

AI 결과는 원문을 자동으로 수정하지 않습니다. 사용자가 삽입 또는 저장을 선택할 때만 문서에 반영됩니다.

## AI 연결

설정에서 OpenAI 호환 API 정보를 입력합니다.

- Base URL: 기본값 `https://api.openai.com/v1`
- API Key: 운영체제 보안 저장소로 암호화
- Model: 사용할 모델 이름
- 요청 제한 시간
- 연결 테스트

문서 내용은 AI 분석 버튼을 누를 때만 설정한 API 제공자에게 전송됩니다. 텔레메트리, 광고, 사용자 추적, 계정 동기화는 사용하지 않습니다.

## 단축키

| 단축키              | 기능                  |
| ------------------- | --------------------- |
| `Ctrl+N`            | 새 문서               |
| `Ctrl+Shift+N`      | 새 TXT 문서           |
| `Ctrl+O`            | 작업공간 선택         |
| `Ctrl+S`            | 즉시 저장             |
| `Ctrl+F`            | 문서에서 찾기·바꾸기  |
| `Ctrl+1` ~ `Ctrl+4` | 분석 단계 선택        |
| `Ctrl+Shift+P`      | 최종 프롬프트 생성    |
| `Ctrl+,`            | 설정                  |
| `Ctrl+B`            | 문서 패널 전환        |
| `Ctrl+Alt+B`        | 사고 도우미 패널 전환 |

macOS에서는 `Ctrl` 대신 `Command`를 사용합니다.

## 실행 및 빌드

Node.js 24와 npm이 필요합니다.

```sh
npm install
npm start
```

품질 검사:

```sh
npm run check
```

현재 운영체제용 패키지:

```sh
npm run make
```

운영체제별 패키지:

```sh
npm run make:windows
npm run make:mac:x64
npm run make:mac:arm64
npm run make:linux
```

macOS 패키지는 macOS에서, Linux 패키지는 Linux에서, Windows 설치 파일은 Windows에서 생성합니다. GitHub Actions가 각 운영체제의 기본 실행 환경에서 전체 패키지를 자동 생성합니다.

## 버전 및 배포

앱 버전의 기준은 `package.json`이며 Semantic Versioning을 사용합니다.

```sh
npm run version:patch
npm run version:minor
npm run version:major
```

명령은 버전 커밋과 `vX.Y.Z` Git 태그를 생성합니다. 태그를 푸시하면 GitHub Actions가 Windows·macOS·Linux 패키지와 통합 체크섬을 GitHub Release에 게시합니다.

```sh
git push origin main --follow-tags
```

상세 절차는 [버전 및 릴리스 관리](docs/VERSIONING.md), 배포와 업데이터 구조는 [아키텍처](docs/ARCHITECTURE.md)에 기록합니다.

## 현재 제한사항

- OpenAI 호환 Chat Completions API만 지원합니다.
- 인터넷 사실 검증과 자동 웹 검색은 수행하지 않습니다.
- Markdown은 일반 텍스트로 편집합니다.
- 앱 내부 자동 업데이트는 아직 제공하지 않으며 최신 설치 파일 또는 터미널 설치 명령으로 업데이트합니다.
- macOS 패키지는 코드 서명과 공증을 적용하지 않은 상태입니다.
- 클라우드 동기화, 계정, 협업, 플러그인, 지식 그래프는 제공하지 않습니다.

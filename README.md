# ThinkFrame

ThinkFrame은 로컬 Markdown·TXT 문서를 편집하고, 작성한 생각을 AI로 체계화·구조화·개념검증·현실화한 뒤 최종 작업 프롬프트로 만드는 Windows 데스크톱 프로그램입니다.

## 설치

### 설치 파일

1. [GitHub Releases](https://github.com/leondic1976/Deploy-Think-Frame-Concept-Edit-TFCedit/releases/latest)에서 최신 `ThinkFrameSetup.exe`를 다운로드합니다.
2. 설치 파일을 실행합니다.
3. 시작 메뉴에서 ThinkFrame을 실행합니다.

지원 운영체제는 Windows 10/11 64-bit입니다.

### PowerShell

최신 버전 설치:

```powershell
$script="$env:TEMP\install-thinkframe.ps1"; Invoke-WebRequest "https://raw.githubusercontent.com/leondic1976/Deploy-Think-Frame-Concept-Edit-TFCedit/main/install.ps1" -OutFile $script; & $script
```

화면 없이 설치:

```powershell
$script="$env:TEMP\install-thinkframe.ps1"; Invoke-WebRequest "https://raw.githubusercontent.com/leondic1976/Deploy-Think-Frame-Concept-Edit-TFCedit/main/install.ps1" -OutFile $script; & $script -Silent
```

특정 버전 설치:

```powershell
& "$env:TEMP\install-thinkframe.ps1" -Version 0.1.1
```

설치 스크립트는 GitHub Release의 설치 파일과 `SHA256SUMS.txt`를 내려받아 SHA-256을 검증한 후 실행합니다.

## 주요 기능

- 로컬 작업공간의 `.md`, `.txt` 문서 생성·열기·편집·자동 저장
- 일반 텍스트 편집, 문서 내 찾기·바꾸기, 행·열 표시
- 문서 이름 변경·복제·휴지통 이동·탐색기에서 보기
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

## 실행 및 빌드

Node.js 24와 npm이 필요합니다.

```powershell
npm install
npm start
```

품질 검사:

```powershell
npm run check
```

Windows x64 설치 파일 생성:

```powershell
npm run make
```

생성 파일:

```text
out/make/squirrel.windows/x64/ThinkFrameSetup.exe
```

## 버전 및 배포

앱 버전의 기준은 `package.json`입니다. Semantic Versioning을 사용합니다.

```powershell
npm run version:patch
npm run version:minor
npm run version:major
```

명령은 버전 커밋과 `vX.Y.Z` Git 태그를 생성합니다. 태그를 푸시하면 GitHub Actions가 Windows 설치 파일을 빌드하고 GitHub Release에 첨부합니다.

```powershell
git push origin main --follow-tags
```

모든 브랜치와 Pull Request에서는 lint, TypeScript 검사, 테스트, Windows 설치 파일 빌드를 자동 실행합니다.

## 현재 제한사항

- OpenAI 호환 Chat Completions API만 지원합니다.
- 인터넷 사실 검증과 자동 웹 검색은 수행하지 않습니다.
- Markdown은 일반 텍스트로 편집합니다.
- 클라우드 동기화, 계정, 협업, 플러그인, 지식 그래프는 제공하지 않습니다.

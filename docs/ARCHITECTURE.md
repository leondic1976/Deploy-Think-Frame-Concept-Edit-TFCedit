# ThinkFrame 아키텍처

## 프로세스 경계

- 메인 프로세스: 창, 작업공간, 파일, 설정, 보안 저장소, AI 요청, 외부 브라우저
- 프리로드: 허용한 IPC 함수만 렌더러에 노출
- 렌더러: 문서 편집, 분석 단계 선택, 결과 표시, 사용자 명시 작업

렌더러는 Node.js와 파일 시스템에 직접 접근하지 않습니다. 작업공간 경로 검사와 API 키 복호화는 메인 프로세스에서만 수행합니다.

## 로컬 데이터

- 사용자 문서: 사용자가 선택한 작업공간의 `.md`, `.txt`
- 일반 설정: Electron `userData/settings.json`
- API 키: Electron `safeStorage`로 암호화한 별도 파일
- 데이터베이스, 계정, 클라우드 동기화: 사용하지 않음

## 배포

- 패키지: Electron Forge
- Windows 설치 형식: Squirrel.Windows x64
- 릴리스 기준: `package.json`과 `vX.Y.Z` 태그
- 배포 위치: GitHub Releases
- 배포 파일: `ThinkFrameSetup.exe`, `.nupkg`, `RELEASES`, `SHA256SUMS.txt`

Git 태그를 푸시하면 GitHub Actions가 검사, Windows 빌드, 체크섬 생성, GitHub Release 게시를 수행합니다.

## 업데이트

### 현재

앱 내부 자동 업데이트는 아직 제공하지 않습니다. 사용자는 다음 중 하나로 최신 버전을 설치합니다.

- GitHub Releases의 최신 `ThinkFrameSetup.exe` 실행
- README의 PowerShell 설치 명령 실행

Squirrel.Windows 설치는 같은 사용자 계정의 기존 ThinkFrame을 새 버전으로 교체합니다. 사용자 문서는 선택한 작업공간에 있고 앱 설치 경로와 분리되어 있으므로 업데이트 대상에 포함되지 않습니다.

### 향후 자동 업데이터

공개 GitHub 저장소와 GitHub Releases를 유지하는 동안 Electron이 공식 안내하는 `update-electron-app`과 `update.electronjs.org` 조합을 우선 사용합니다.

구현 위치와 책임:

1. 런타임 의존성으로 `update-electron-app`을 추가합니다.
2. 메인 프로세스의 별도 `updateService`에서만 업데이터를 초기화합니다.
3. 개발 실행에서는 비활성화하고 `app.isPackaged`인 Windows 빌드에서만 실행합니다.
4. `--squirrel-firstrun` 동안 파일 잠금이 있으므로 첫 실행 직후에는 검사하지 않습니다.
5. 업데이트 확인, 다운로드 완료, 오류 상태만 최소 IPC로 렌더러에 전달합니다.
6. 재시작 설치는 문서 저장 상태를 확인한 뒤 사용자가 명시적으로 선택할 때 실행합니다.
7. API 키, 문서 내용, 작업공간 경로를 업데이트 요청에 포함하지 않습니다.

필수 선행 조건:

- `package.json`의 repository 정보 유지
- 공개 GitHub Release에 `.nupkg`와 `RELEASES` 계속 게시
- 배포 태그와 앱 버전 일치
- 이전 버전보다 높은 SemVer만 안정 채널로 게시
- 설치·업데이트 실행 파일 코드 서명 도입 검토
- 업데이트 실패 시 현재 버전을 계속 실행할 수 있는 오류 처리

검증 항목:

- 이전 안정 버전에서 최신 버전 감지
- 다운로드 완료 전 앱 종료와 재실행
- 편집 중인 문서가 있을 때 재시작 설치 차단
- 오프라인, 시간 초과, 손상된 메타데이터 처리
- 업데이트 후 버전, 설정, 최근 작업공간, 문서 보존
- 일반 설치와 무인 설치 회귀 테스트

관련 공식 문서:

- [Electron 애플리케이션 업데이트](https://www.electronjs.org/docs/latest/tutorial/updates)
- [Electron autoUpdater](https://www.electronjs.org/docs/latest/api/auto-updater/)
- [Electron Forge Auto Update](https://www.electronforge.io/advanced/auto-update)

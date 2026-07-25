# 버전 및 릴리스 관리

## 기준

- 버전 형식: Semantic Versioning `MAJOR.MINOR.PATCH`
- 앱 버전 기준: `package.json`
- 잠금 파일: `package-lock.json`
- 변경 기록: `CHANGELOG.md`
- Git 태그: `vX.Y.Z`
- 배포 파일:
  - Windows x64: `ThinkFrameSetup.exe`, `.nupkg`, `RELEASES`
  - macOS: `ThinkFrame-macOS-arm64.dmg`, `ThinkFrame-macOS-x64.dmg`, 각 아키텍처 ZIP
  - Linux x64: `ThinkFrame-linux-x64.deb`, `ThinkFrame-linux-x64.zip`
  - 전체 파일: `SHA256SUMS.txt`

앱 화면, 실행 파일, 설치 파일, Git 태그의 버전은 모두 `package.json`과 일치해야 합니다. `npm run version:check`가 package, lockfile, 변경 기록, 태그의 일치 여부를 검사합니다.

## 버전 선택

- PATCH: 호환성을 유지하는 버그 수정
- MINOR: 호환성을 유지하는 기능 추가
- MAJOR: 기존 사용 흐름 또는 파일·설정 호환성을 깨는 변경

한 번 배포한 버전과 태그는 덮어쓰지 않습니다. 배포 수정이 필요하면 새 PATCH 버전을 만듭니다.

## 변경 기록

개발 중 변경은 `CHANGELOG.md`의 `[Unreleased]` 아래에 `추가`, `변경`, `수정`, `보안`, `제거` 중 필요한 항목으로 기록합니다.

배포 전 `[Unreleased]` 내용을 다음 형식의 버전 항목으로 옮깁니다.

```markdown
## [0.1.1] - YYYY-MM-DD
```

하단의 `[Unreleased]` 비교 링크 기준을 새 태그로 변경하고, 새 버전 릴리스 링크를 추가합니다.

## 브랜치와 커밋

- `main`: 설치 가능한 안정 버전
- `agent/*`: 기능, 수정, 문서 작업
- 릴리스 커밋: `release: vX.Y.Z`
- 릴리스 태그: `vX.Y.Z`

Pull Request에는 기능 영향, 사용자 영향, 검증 결과, CHANGELOG 반영 여부를 기록합니다.

## 릴리스 절차

1. 작업 트리가 깨끗하고 CI가 통과하는지 확인합니다.
2. `CHANGELOG.md`에 배포할 새 버전 항목과 날짜를 작성합니다.
3. 변경 유형에 맞는 명령을 실행합니다.

```powershell
npm run version:patch
npm run version:minor
npm run version:major
```

4. 생성된 버전 커밋과 태그를 확인합니다.

```powershell
npm run version:check
git show --stat --oneline HEAD
git tag --points-at HEAD
```

5. 커밋과 태그를 푸시합니다.

```powershell
git push origin main --follow-tags
```

6. GitHub Actions의 `Release` 작업이 완료됐는지 확인합니다.
7. GitHub Release에 Windows·macOS·Linux 파일과 체크섬이 첨부됐는지 확인합니다.
8. 직접 다운로드, PowerShell 설치, macOS·Linux 셸 설치를 확인합니다.

## 자동 검증

`CI` 워크플로는 push와 Pull Request에서 다음 항목을 검사합니다.

- 버전 문서 일치
- ESLint
- TypeScript
- Vitest
- Windows x64, macOS Apple Silicon·Intel, Linux x64 패키지 생성

`Release` 워크플로는 `vX.Y.Z` 태그에서 다음 작업을 수행합니다.

- 태그와 앱 버전 일치 검사
- 전체 품질 검사
- 각 운영체제의 네이티브 실행 환경에서 설치·압축 파일 빌드
- 모든 배포 파일의 통합 `SHA256SUMS.txt` 생성
- GitHub Release 생성 및 전체 배포 파일 첨부

## 배포 확인

```powershell
gh run list --workflow Release --limit 5
gh release view vX.Y.Z
```

설치 파일 해시 확인:

```powershell
Get-FileHash .\ThinkFrameSetup.exe -Algorithm SHA256
```

macOS·Linux:

```sh
shasum -a 256 ThinkFrame-macOS-arm64.dmg
sha256sum ThinkFrame-linux-x64.deb
```

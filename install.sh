#!/usr/bin/env sh

set -eu

repository="leondic1976/Deploy-Think-Frame-Concept-Edit-TFCedit"
requested_version="${1:-latest}"
api_base="https://api.github.com/repos/$repository/releases"

if [ "$requested_version" = "latest" ]; then
  release_api="$api_base/latest"
else
  case "$requested_version" in
    v*) tag="$requested_version" ;;
    *) tag="v$requested_version" ;;
  esac
  release_api="$api_base/tags/$tag"
fi

operating_system="$(uname -s)"
machine_architecture="$(uname -m)"

case "$machine_architecture" in
  x86_64|amd64) architecture="x64" ;;
  arm64|aarch64) architecture="arm64" ;;
  *)
    echo "지원하지 않는 CPU 아키텍처입니다: $machine_architecture" >&2
    exit 1
    ;;
esac

case "$operating_system" in
  Darwin)
    asset_name="ThinkFrame-macOS-$architecture.dmg"
    ;;
  Linux)
    if [ "$architecture" != "x64" ]; then
      echo "Linux는 현재 x64만 지원합니다." >&2
      exit 1
    fi
    asset_name="ThinkFrame-linux-x64.deb"
    ;;
  *)
    echo "이 스크립트는 macOS와 Linux에서만 사용할 수 있습니다." >&2
    exit 1
    ;;
esac

for command_name in curl awk; do
  if ! command -v "$command_name" >/dev/null 2>&1; then
    echo "필수 명령을 찾을 수 없습니다: $command_name" >&2
    exit 1
  fi
done

temporary_directory="$(mktemp -d "${TMPDIR:-/tmp}/thinkframe-install.XXXXXX")"
mounted_volume=""

cleanup() {
  if [ -n "$mounted_volume" ] && [ -d "$mounted_volume" ]; then
    hdiutil detach "$mounted_volume" -quiet || true
  fi
  if [ -n "$temporary_directory" ] && [ -d "$temporary_directory" ]; then
    rm -rf -- "$temporary_directory"
  fi
}
trap cleanup EXIT HUP INT TERM

echo "ThinkFrame 릴리스 정보를 확인합니다..."
release_json="$(curl -fsSL \
  -H "Accept: application/vnd.github+json" \
  -H "X-GitHub-Api-Version: 2022-11-28" \
  -H "User-Agent: ThinkFrame-Installer" \
  "$release_api")"

asset_url="$(printf '%s' "$release_json" |
  tr ',' '\n' |
  sed -n 's/.*"browser_download_url":[[:space:]]*"\([^"]*\)".*/\1/p' |
  awk -v name="/$asset_name" 'index($0, name) == length($0) - length(name) + 1 { print; exit }')"
checksum_url="$(printf '%s' "$release_json" |
  tr ',' '\n' |
  sed -n 's/.*"browser_download_url":[[:space:]]*"\([^"]*\)".*/\1/p' |
  awk '/\/SHA256SUMS\.txt$/ { print; exit }')"

if [ -z "$asset_url" ]; then
  echo "선택한 릴리스에서 $asset_name 파일을 찾을 수 없습니다." >&2
  exit 1
fi
if [ -z "$checksum_url" ]; then
  echo "선택한 릴리스에서 SHA256SUMS.txt 파일을 찾을 수 없습니다." >&2
  exit 1
fi

asset_path="$temporary_directory/$asset_name"
checksum_path="$temporary_directory/SHA256SUMS.txt"

echo "$asset_name 파일을 다운로드합니다..."
curl -fsSL "$asset_url" -o "$asset_path"
curl -fsSL "$checksum_url" -o "$checksum_path"

expected_hash="$(awk -v name="$asset_name" \
  '($2 == name || $2 == "*" name) && $1 ~ /^[[:xdigit:]]{64}$/ { print $1; exit }' \
  "$checksum_path")"
if [ -z "$expected_hash" ]; then
  echo "SHA256SUMS.txt에서 $asset_name 체크섬을 찾을 수 없습니다." >&2
  exit 1
fi

if [ "$operating_system" = "Darwin" ]; then
  actual_hash="$(shasum -a 256 "$asset_path" | awk '{ print $1 }')"
else
  actual_hash="$(sha256sum "$asset_path" | awk '{ print $1 }')"
fi

if [ "$actual_hash" != "$expected_hash" ]; then
  echo "설치 파일의 SHA-256 체크섬이 일치하지 않습니다." >&2
  exit 1
fi

echo "체크섬 확인 완료. ThinkFrame 설치를 시작합니다..."

if [ "$operating_system" = "Darwin" ]; then
  mounted_volume="$(hdiutil attach "$asset_path" -nobrowse -readonly |
    awk '/\/Volumes\// { sub(/^.*\/Volumes\//, "/Volumes/"); print; exit }')"
  app_source="$mounted_volume/ThinkFrame.app"
  if [ ! -d "$app_source" ]; then
    echo "DMG에서 ThinkFrame.app을 찾을 수 없습니다." >&2
    exit 1
  fi

  if [ -w "/Applications" ]; then
    ditto "$app_source" "/Applications/ThinkFrame.app"
  elif command -v sudo >/dev/null 2>&1; then
    sudo ditto "$app_source" "/Applications/ThinkFrame.app"
  else
    echo "/Applications에 설치하려면 관리자 권한이 필요합니다." >&2
    exit 1
  fi
else
  if [ "$(id -u)" -eq 0 ]; then
    dpkg -i "$asset_path" || {
      apt-get install -f -y
      dpkg -i "$asset_path"
    }
  elif command -v sudo >/dev/null 2>&1; then
    sudo dpkg -i "$asset_path" || {
      sudo apt-get install -f -y
      sudo dpkg -i "$asset_path"
    }
  else
    echo "DEB 설치에는 root 권한 또는 sudo가 필요합니다." >&2
    exit 1
  fi
fi

echo "ThinkFrame 설치가 완료되었습니다."

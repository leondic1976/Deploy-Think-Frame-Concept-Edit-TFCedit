import { describe, expect, it } from 'vitest';
import { installationDirectory } from '../src/main/services/installationPath';

describe('installationDirectory', () => {
  it('개발 환경에서는 앱 프로젝트 경로를 사용한다', () => {
    expect(
      installationDirectory({
        appPath: 'D:\\Gits\\ThinkFrame',
        executablePath: 'D:\\node_modules\\electron\\electron.exe',
        isPackaged: false,
        platform: 'win32',
      }),
    ).toBe('D:\\Gits\\ThinkFrame');
  });

  it('Windows Squirrel의 버전 폴더 바깥을 설치 폴더로 사용한다', () => {
    expect(
      installationDirectory({
        appPath: 'C:\\ThinkFrame\\app-0.3.0\\resources\\app.asar',
        executablePath: 'C:\\ThinkFrame\\app-0.3.0\\ThinkFrame.exe',
        isPackaged: true,
        platform: 'win32',
      }),
    ).toBe('C:\\ThinkFrame');
  });

  it('Windows 압축 배포판에서는 실행 파일 폴더를 사용한다', () => {
    expect(
      installationDirectory({
        appPath: 'C:\\Portable\\ThinkFrame\\resources\\app.asar',
        executablePath: 'C:\\Portable\\ThinkFrame\\ThinkFrame.exe',
        isPackaged: true,
        platform: 'win32',
      }),
    ).toBe('C:\\Portable\\ThinkFrame');
  });

  it('macOS에서는 앱 번들이 있는 설치 폴더를 사용한다', () => {
    expect(
      installationDirectory({
        appPath: '/ThinkFrame/ThinkFrame.app/Contents/Resources/app.asar',
        executablePath: '/ThinkFrame/ThinkFrame.app/Contents/MacOS/ThinkFrame',
        isPackaged: true,
        platform: 'darwin',
      }),
    ).toBe('/ThinkFrame');
  });

  it('Linux에서는 실행 파일 폴더를 사용한다', () => {
    expect(
      installationDirectory({
        appPath: '/ThinkFrame/resources/app.asar',
        executablePath: '/ThinkFrame/ThinkFrame',
        isPackaged: true,
        platform: 'linux',
      }),
    ).toBe('/ThinkFrame');
  });
});

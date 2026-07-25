import type { ForgeConfig } from '@electron-forge/shared-types';
import { MakerDeb } from '@electron-forge/maker-deb';
import { MakerDMG } from '@electron-forge/maker-dmg';
import { MakerSquirrel } from '@electron-forge/maker-squirrel';
import { MakerZIP } from '@electron-forge/maker-zip';
import { AutoUnpackNativesPlugin } from '@electron-forge/plugin-auto-unpack-natives';
import { FusesPlugin } from '@electron-forge/plugin-fuses';
import { VitePlugin } from '@electron-forge/plugin-vite';
import { FuseV1Options, FuseVersion } from '@electron/fuses';

const config: ForgeConfig = {
  packagerConfig: {
    asar: true,
    icon:
      process.platform === 'win32'
        ? './assets/icon.ico'
        : process.platform === 'darwin'
          ? './assets/icon.icns'
          : './assets/icon.png',
    executableName: 'ThinkFrame',
  },
  rebuildConfig: {},
  makers: [
    new MakerSquirrel(
      {
        name: 'ThinkFrame',
        setupExe: 'ThinkFrameSetup.exe',
        setupIcon: './assets/icon.ico',
        iconUrl:
          'https://raw.githubusercontent.com/leondic1976/Deploy-Think-Frame-Concept-Edit-TFCedit/main/assets/icon.ico',
        noMsi: true,
      },
      ['win32'],
    ),
    new MakerDMG(
      {
        name: `ThinkFrame-macOS-${process.arch}`,
        overwrite: true,
      },
      ['darwin'],
    ),
    new MakerZIP({}, ['darwin', 'linux']),
    new MakerDeb(
      {
        options: {
          name: 'thinkframe',
          productName: 'ThinkFrame',
          genericName: 'Text Editor',
          description: 'Local Markdown and text editor with an AI thinking assistant',
          section: 'editors',
          priority: 'optional',
          categories: ['Utility', 'Office'],
          maintainer: 'ThinkFrame <leondic1976@gmail.com>',
          homepage:
            'https://github.com/leondic1976/Deploy-Think-Frame-Concept-Edit-TFCedit',
          icon: './assets/icon.png',
          mimeType: ['text/plain', 'text/markdown'],
        },
      },
      ['linux'],
    ),
  ],
  plugins: [
    new AutoUnpackNativesPlugin({}),
    new VitePlugin({
      build: [
        {
          entry: 'src/main/main.ts',
          config: 'vite.main.config.ts',
          target: 'main',
        },
        {
          entry: 'src/preload/preload.ts',
          config: 'vite.preload.config.ts',
          target: 'preload',
        },
      ],
      renderer: [
        {
          name: 'main_window',
          config: 'vite.renderer.config.ts',
        },
      ],
    }),
    new FusesPlugin({
      version: FuseVersion.V1,
      [FuseV1Options.RunAsNode]: false,
      [FuseV1Options.EnableCookieEncryption]: true,
      [FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
      [FuseV1Options.EnableNodeCliInspectArguments]: false,
      [FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: true,
      [FuseV1Options.OnlyLoadAppFromAsar]: true,
    }),
  ],
};

export default config;

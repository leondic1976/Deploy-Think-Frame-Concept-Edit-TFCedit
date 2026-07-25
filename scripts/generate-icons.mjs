import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import pngToIco from 'png-to-ico';
import png2icons from 'png2icons';
import sharp from 'sharp';

const root = process.cwd();
const svgPath = path.join(root, 'assets', 'icon.svg');
const pngPath = path.join(root, 'assets', 'icon.png');
const icoPath = path.join(root, 'assets', 'icon.ico');
const icnsPath = path.join(root, 'assets', 'icon.icns');

await sharp(svgPath).resize(512, 512).png().toFile(pngPath);
const png = await readFile(pngPath);
const ico = await pngToIco(png);
await writeFile(icoPath, ico);
const icns = png2icons.createICNS(png, png2icons.BILINEAR, 0);
if (!icns) throw new Error('macOS ICNS 아이콘을 생성하지 못했습니다.');
await writeFile(icnsPath, icns);

console.log(
  `아이콘 생성 완료: ${path.relative(root, pngPath)}, ${path.relative(root, icoPath)}, ${path.relative(root, icnsPath)}`,
);

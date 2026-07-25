import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import pngToIco from 'png-to-ico';
import sharp from 'sharp';

const root = process.cwd();
const svgPath = path.join(root, 'assets', 'icon.svg');
const pngPath = path.join(root, 'assets', 'icon.png');
const icoPath = path.join(root, 'assets', 'icon.ico');

await sharp(svgPath).resize(512, 512).png().toFile(pngPath);
const png = await readFile(pngPath);
const ico = await pngToIco(png);
await writeFile(icoPath, ico);

console.log(
  `아이콘 생성 완료: ${path.relative(root, pngPath)}, ${path.relative(root, icoPath)}`,
);

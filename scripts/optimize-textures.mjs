// @ts-check
import { readdirSync, statSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import sharp from 'sharp';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const TEX_DIR = resolve(ROOT, 'public/textures');

/**
 * non-color 데이터(ORM: occlusion/roughness/metallic 패킹)로 취급해
 * 채널 스미어를 방지하기 위해 near-lossless로 인코딩할 파일 스템 목록.
 */
const ORM_STEMS = new Set(['gear_ORM', 'hair_ORM', 'outfit_ORM', 'room_ORM', 'skin_ORM']);

/**
 * 바이트 수를 사람이 읽기 쉬운 KB/MB 문자열로 변환한다.
 * @param {number} bytes - 대상 바이트 수
 * @returns {string} 사이즈 표기
 */
const formatSize = bytes =>
  bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(2)}MB` : `${(bytes / 1024).toFixed(1)}KB`;

/**
 * public/textures의 PNG 텍스처를 WebP(*.v2.webp)로 변환한다.
 * ORM 5종은 non-color라 near-lossless(q80), outfit_map은 컬러라 lossy(q88)로 인코딩한다.
 * @returns {Promise<void>}
 */
const run = async () => {
  const pngFiles = readdirSync(TEX_DIR).filter(file => file.endsWith('.png'));

  console.log('--- textures: before -> after ---');
  for (const file of pngFiles) {
    const stem = file.replace(/\.png$/, '');
    const srcPath = resolve(TEX_DIR, file);
    const outPath = resolve(TEX_DIR, `${stem}.v2.webp`);
    const isOrm = ORM_STEMS.has(stem);

    const webpOptions = isOrm ? { nearLossless: true, quality: 80 } : { quality: 88 };

    await sharp(srcPath).webp(webpOptions).toFile(outPath);

    const beforeBytes = statSync(srcPath).size;
    const afterBytes = statSync(outPath).size;
    const delta = ((1 - afterBytes / beforeBytes) * 100).toFixed(1);
    console.log(
      `${file} -> ${stem}.v2.webp  [${isOrm ? 'non-color' : 'color'}]  ${formatSize(
        beforeBytes,
      )} -> ${formatSize(afterBytes)}  (-${delta}%)`,
    );
  }
  console.log('--- done ---');
};

run().catch(error => {
  console.error(error);
  process.exit(1);
});

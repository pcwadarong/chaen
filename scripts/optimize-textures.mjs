// @ts-check
import { readdirSync, statSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { encodeToKTX2 } from 'ktx2-encoder';
import sharp from 'sharp';

import { UASTC_LINEAR_OPTIONS } from './ktx2-presets.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const SRC_DIR = resolve(ROOT, 'assets-src/textures');
const OUT_DIR = resolve(ROOT, 'public/textures');
const ASSET_VERSION = 'v3';

/**
 * GLB 밖에서 `useKTX2`로 로드해 런타임에 주입하는 ORM(occlusion/roughness/metallic) texture.
 * 이 목록에 없는 PNG는 어떤 코드도 참조하지 않으므로 변환하지 않는다
 * (`outfit_map`은 #93 이후 참조자가 없다).
 */
const ORM_STEMS = ['gear_ORM', 'hair_ORM', 'outfit_ORM', 'room_ORM', 'skin_ORM'];

/**
 * ORM은 색이 아니라 셰이딩 계수(occlusion/roughness/metallic)라 baseColor만큼의 텍셀 밀도가
 * 필요 없다. 2048²을 그대로 UASTC로 구우면 다운로드가 오히려 늘어나므로 1024²로 내린다.
 */
const ORM_SIZE = 1024;

/**
 * 바이트 수를 사람이 읽기 쉬운 KB/MB 문자열로 변환한다.
 * @param {number} bytes - 대상 바이트 수
 * @returns {string} 사이즈 표기
 */
const formatSize = bytes =>
  bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(2)}MB` : `${(bytes / 1024).toFixed(1)}KB`;

/**
 * PNG를 basis 인코더가 받는 32bit RGBA raster로 디코딩한다.
 * alpha가 전부 불투명하면 인코더가 alpha 슬라이스를 만들지 않으므로(전송 후 BC3 대신 BC1),
 * 채널을 인위적으로 지우지 않고 원본 그대로 넘긴다.
 * @param {Uint8Array} buffer - PNG 바이트
 * @returns {Promise<{ data: Uint8Array, height: number, width: number }>} RGBA raster
 */
const decodeImage = async buffer => {
  const { data, info } = await sharp(Buffer.from(buffer))
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  return {
    data: new Uint8Array(data.buffer, data.byteOffset, data.byteLength),
    height: info.height,
    width: info.width,
  };
};

/**
 * assets-src/textures의 ORM PNG를 KTX2(UASTC, 선형)로 변환해 public/textures/*.v3.ktx2로 쓴다.
 * WebP는 파일만 줄이고 GPU에는 RGBA8로 올라가지만, KTX2는 GPU 압축 포맷 그대로 올라가
 * 파일과 VRAM이 함께 준다.
 * @returns {Promise<void>}
 */
const run = async () => {
  const pngStems = readdirSync(SRC_DIR)
    .filter(file => file.endsWith('.png'))
    .map(file => file.replace(/\.png$/, ''));
  const skipped = pngStems.filter(stem => !ORM_STEMS.includes(stem));

  console.log('--- textures: before -> after ---');

  for (const stem of ORM_STEMS) {
    const srcPath = resolve(SRC_DIR, `${stem}.png`);
    const outPath = resolve(OUT_DIR, `${stem}.${ASSET_VERSION}.ktx2`);
    const resized = await sharp(srcPath)
      .resize(ORM_SIZE, ORM_SIZE, { fit: 'inside' })
      .png()
      .toBuffer();
    const ktx2 = await encodeToKTX2(new Uint8Array(resized), {
      ...UASTC_LINEAR_OPTIONS,
      imageDecoder: decodeImage,
    });

    writeFileSync(outPath, ktx2);

    const beforeBytes = statSync(srcPath).size;
    const afterBytes = statSync(outPath).size;
    const delta = ((1 - afterBytes / beforeBytes) * 100).toFixed(1);
    console.log(
      `${stem}.png -> ${stem}.${ASSET_VERSION}.ktx2  [UASTC/linear/${ORM_SIZE}²]  ${formatSize(
        beforeBytes,
      )} -> ${formatSize(afterBytes)}  (-${delta}%)`,
    );
  }

  if (skipped.length > 0) {
    console.log(`skipped (참조자 없음): ${skipped.join(', ')}`);
  }

  console.log('--- done ---');
};

run().catch(error => {
  console.error(error);
  process.exit(1);
});

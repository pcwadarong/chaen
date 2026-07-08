// @ts-check
import { statSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import {
  dedup,
  meshopt,
  prune,
  resample,
  sparse,
  textureCompress,
  weld,
} from '@gltf-transform/functions';
import draco3d from 'draco3dgltf';
import { MeshoptEncoder } from 'meshoptimizer';
import sharp from 'sharp';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const SRC_DIR = resolve(ROOT, 'assets-src/models');
const OUT_DIR = resolve(ROOT, 'public/models');

/**
 * 바이트 수를 사람이 읽기 쉬운 MB 문자열로 변환한다.
 * @param {number} bytes - 대상 바이트 수
 * @returns {string} 소수점 둘째 자리까지의 MB 표기
 */
const formatMb = bytes => `${(bytes / 1024 / 1024).toFixed(2)}MB`;

/**
 * gltf-transform NodeIO 인스턴스를 생성한다.
 * 소스의 Draco 지오메트리를 디코딩하기 위한 draco3d.decoder와,
 * 출력 시 EXT_meshopt_compression 인코딩을 위한 meshopt.encoder를 등록한다.
 * @returns {Promise<NodeIO>} 확장/의존성이 등록된 IO
 */
const createIO = async () => {
  await MeshoptEncoder.ready;
  return new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({
    'draco3d.decoder': await draco3d.createDecoderModule(),
    'meshopt.encoder': MeshoptEncoder,
  });
};

/**
 * 프롭(bass/table/sofa)용 최적화 트랜스폼 목록을 반환한다.
 * 노드 병합/리네임을 유발하는 flatten/join/palette/instance/simplify/optimize는 사용하지 않는다.
 * @returns {import('@gltf-transform/core').Transform[]} 순차 적용할 트랜스폼
 */
const propTransforms = () => [
  dedup(),
  prune(),
  weld(),
  textureCompress({
    encoder: sharp,
    targetFormat: 'webp',
    quality: 85,
    resize: [1024, 1024],
  }),
  meshopt({ encoder: MeshoptEncoder, level: 'medium' }),
];

/**
 * 캐릭터(character)용 보수적 최적화 트랜스폼 목록을 반환한다.
 * 스킨/모프 보존을 위해 weld·단독 quantize·flatten 계열은 사용하지 않는다.
 * 텍스처는 슬롯/이름 인지 2패스로 압축한다:
 *  1) fabric_pattern(4K metallicRoughness)만 1024로 리사이즈 + WebP q90
 *  2) 나머지 전역 WebP q90 (리사이즈 없음 — 피부/얼굴 텍셀 밀도 유지)
 * @returns {import('@gltf-transform/core').Transform[]} 순차 적용할 트랜스폼
 */
const characterTransforms = () => [
  dedup(),
  prune({ keepAttributes: true }),
  resample(),
  sparse(),
  textureCompress({
    encoder: sharp,
    targetFormat: 'webp',
    quality: 90,
    pattern: /fabric_pattern/i,
    resize: [1024, 1024],
  }),
  textureCompress({
    encoder: sharp,
    targetFormat: 'webp',
    quality: 90,
  }),
  meshopt({ encoder: MeshoptEncoder, level: 'medium' }),
];

/**
 * 단일 GLB를 최적화해 public/models/{name}.v2.glb로 출력하고 전후 사이즈를 출력한다.
 * @param {NodeIO} io - 확장/의존성이 등록된 NodeIO
 * @param {string} name - 확장자 없는 파일명(character/bass/table/sofa)
 * @param {import('@gltf-transform/core').Transform[]} transforms - 적용할 트랜스폼 목록
 * @returns {Promise<void>}
 */
const optimizeModel = async (io, name, transforms) => {
  const srcPath = resolve(SRC_DIR, `${name}.glb`);
  const outPath = resolve(OUT_DIR, `${name}.v2.glb`);

  const beforeBytes = statSync(srcPath).size;
  const document = await io.read(srcPath);
  await document.transform(...transforms);

  // 소스는 읽는 시점에 Draco 지오메트리가 raw accessor로 디코딩되지만
  // KHR_draco_mesh_compression 확장 객체는 문서에 남아 write 시 재인코딩을 시도한다.
  // Meshopt로 전환하므로 Draco 확장을 제거해 EXT_meshopt_compression만 기록되게 한다.
  for (const extension of document.getRoot().listExtensionsUsed()) {
    if (extension.extensionName === 'KHR_draco_mesh_compression') {
      extension.dispose();
    }
  }

  const glb = await io.writeBinary(document);
  writeFileSync(outPath, glb);
  const afterBytes = statSync(outPath).size;

  const delta = ((1 - afterBytes / beforeBytes) * 100).toFixed(1);
  console.log(
    `${name}.glb -> ${name}.v2.glb  ${formatMb(beforeBytes)} -> ${formatMb(
      afterBytes,
    )}  (-${delta}%)`,
  );
};

/**
 * 모든 모델을 최적화한다. 프롭 3종과 캐릭터를 각각의 파이프라인으로 처리한다.
 * @returns {Promise<void>}
 */
const run = async () => {
  const io = await createIO();

  console.log('--- models: before -> after ---');
  for (const name of ['bass', 'table', 'sofa']) {
    await optimizeModel(io, name, propTransforms());
  }
  await optimizeModel(io, 'character', characterTransforms());
  console.log('--- done ---');
};

run().catch(error => {
  console.error(error);
  process.exit(1);
});

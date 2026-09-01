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
import { ktx2 } from 'ktx2-encoder/gltf-transform';
import { MeshoptEncoder } from 'meshoptimizer';
import sharp from 'sharp';

import { ETC1S_COLOR_OPTIONS, UASTC_NORMAL_OPTIONS } from './ktx2-presets.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const SRC_DIR = resolve(ROOT, 'assets-src/models');
const OUT_DIR = resolve(ROOT, 'public/models');
const ASSET_VERSION = 'v4';

/**
 * 런타임이 외부 ORM texture로 덮어쓰는 mesh 이름 집합.
 * `src/entities/character/lib/use-character-materials.ts`의 네 집합과 같아야 한다.
 * 여기에 걸리는 mesh의 material은 aoMap/roughnessMap/metalnessMap이 전부 교체되므로,
 * GLB에 남은 metallicRoughness/occlusion texture는 디코딩된 뒤 한 번도 안 쓰이고 버려진다.
 */
const CHARACTER_RUNTIME_ORM_MESH_NAMES = new Set([
  // skin
  'body',
  'face',
  // hair
  'brows',
  'eyebrow',
  'hair',
  // outfit
  'inner',
  'neck_collar',
  'outer',
  'pants',
  'ribon',
  'sock',
  // gear
  'headphone_band',
  'headphone_housing',
  'headphone_pads',
  'heart',
  'laptop',
  'laptop_cover',
  'laptop_logo',
  'shoes',
  'shoes_strip',
]);

/**
 * 소품은 `src/entities/scene/lib/use-scene-prop-materials.ts`가 frame_screen을 뺀
 * 모든 mesh를 room ORM으로 덮어쓴다.
 */
const PROP_RUNTIME_ORM_EXCLUDED_MESH_NAMES = new Set(['frame_screen']);

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
 * KTX2 인코더가 Node에서 쓸 이미지 디코더. basis 인코더는 32bit RGBA raster만 받는다.
 * `toColourspace('srgb')`가 먼저 필요하다 — grayscale roughness/AO PNG는 sharp에서 1채널이라
 * `ensureAlpha()`만 걸면 2채널(gray+alpha)이 나오고, 인코더는 그걸 조용히 RGBA로 읽는다.
 * @param {Uint8Array} buffer - PNG/WebP 등 인코딩된 이미지 바이트
 * @returns {Promise<{ data: Uint8Array, height: number, width: number }>} RGBA raster
 */
const decodeImage = async buffer => {
  const { data, info } = await sharp(Buffer.from(buffer))
    .toColourspace('srgb')
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
 * material이 어떤 mesh 노드에서 쓰이는지 역방향 색인을 만든다.
 * @param {import('@gltf-transform/core').Document} document - 대상 문서
 * @returns {Map<import('@gltf-transform/core').Material, string[]>} material → 사용 노드 이름 목록
 */
const collectMaterialConsumers = document => {
  /** @type {Map<import('@gltf-transform/core').Material, string[]>} */
  const consumers = new Map();

  for (const node of document.getRoot().listNodes()) {
    const mesh = node.getMesh();

    if (!mesh) continue;

    for (const primitive of mesh.listPrimitives()) {
      const material = primitive.getMaterial();

      if (!material) continue;

      const names = consumers.get(material) ?? [];
      names.push(node.getName());
      consumers.set(material, names);
    }
  }

  return consumers;
};

/**
 * 런타임에 외부 ORM으로 덮어써지는 material에서 metallicRoughness/occlusion texture 참조를 끊는다.
 *
 * 판정은 보수적이다 — 하나의 material을 여러 노드가 공유할 수 있고, three는 glTF material 하나당
 * 인스턴스 하나를 만들어 공유하므로, **모든** 소비 노드가 덮어쓰기 대상일 때만 끊는다.
 * 소비 노드가 하나라도 집합 밖에 있으면(예: `eye_left`/`eye_right`) 그대로 둔다.
 *
 * 참조만 끊고 texture 자체는 뒤따르는 prune()이 정리한다.
 * @param {(nodeName: string) => boolean} isOverriddenAtRuntime - 노드 이름이 덮어쓰기 대상인지
 * @returns {import('@gltf-transform/core').Transform} 트랜스폼
 */
const stripRuntimeOverriddenOrmTextures = isOverriddenAtRuntime => document => {
  const consumers = collectMaterialConsumers(document);

  for (const material of document.getRoot().listMaterials()) {
    const consumerNames = consumers.get(material);

    if (!consumerNames || consumerNames.length === 0) continue;
    if (!consumerNames.every(isOverriddenAtRuntime)) continue;

    const dropped = [
      material.getMetallicRoughnessTexture()?.getName(),
      material.getOcclusionTexture()?.getName(),
    ].filter(Boolean);

    if (dropped.length === 0) continue;

    material.setMetallicRoughnessTexture(null);
    material.setOcclusionTexture(null);
    console.log(`  drop ${dropped.join(', ')} <- material "${material.getName()}"`);
  }
};

/**
 * 모든 texture가 KTX2로 바뀌었는지 확인하고, 남은 EXT_texture_webp 확장을 제거한다.
 *
 * ktx2 트랜스폼은 인코딩 실패를 `logger.warn`으로만 남기고 그 texture를 원본 포맷 그대로
 * 통과시킨다. 로그를 놓치면 절반만 변환된 에셋이 조용히 배포되므로 여기서 빌드를 세운다.
 * @returns {import('@gltf-transform/core').Transform} 트랜스폼
 */
const assertAllTexturesAreKtx2 = () => document => {
  const notConverted = document
    .getRoot()
    .listTextures()
    .filter(texture => texture.getMimeType() !== 'image/ktx2');

  if (notConverted.length > 0) {
    const summary = notConverted
      .map(texture => `${texture.getName() || '(unnamed)'} (${texture.getMimeType()})`)
      .join(', ');

    throw new Error(`KTX2로 변환되지 않은 texture가 남았다: ${summary}`);
  }

  for (const extension of document.getRoot().listExtensionsUsed()) {
    if (extension.extensionName === 'EXT_texture_webp') extension.dispose();
  }
};

/**
 * 런타임이 코드로 map/texture를 주입하는 mesh 이름 집합.
 * `use-scene-prop-materials.ts`의 frame_screen(선택 이미지)과
 * `use-monitor-overlay-texture.ts`의 laptop_screen(모니터 오버레이)이 여기 속한다.
 * 이 mesh들은 GLB 시점엔 어떤 texture도 UV를 참조하지 않아, prune()의
 * keepAttributes 기본값(false)이 TEXCOORD_0을 "미사용"으로 지운다.
 * 지워지면 런타임 map은 붙어도 UV가 없어 화면이 조용히 단색으로 렌더된다.
 */
const RUNTIME_TEXTURED_MESH_NAMES = new Set(['frame_screen', 'laptop_screen']);

/**
 * RUNTIME_TEXTURED_MESH_NAMES에 속한 mesh가 TEXCOORD_0을 유지하는지 확인한다.
 *
 * prune()이 UV를 지우면 런타임 map이 에러 없이 단색으로 렌더되므로 로그로는 못 잡는다.
 * assertAllTexturesAreKtx2()와 같은 이유로 여기서 빌드를 세운다.
 * @returns {import('@gltf-transform/core').Transform} 트랜스폼
 */
const assertRuntimeTexturedMeshesKeepUv = () => document => {
  const missing = new Set();

  for (const node of document.getRoot().listNodes()) {
    if (!RUNTIME_TEXTURED_MESH_NAMES.has(node.getName())) continue;

    const mesh = node.getMesh();

    if (!mesh) continue;

    for (const primitive of mesh.listPrimitives()) {
      if (!primitive.getAttribute('TEXCOORD_0')) missing.add(node.getName());
    }
  }

  if (missing.size > 0) {
    throw new Error(
      `런타임에 texture를 주입하는 mesh에 TEXCOORD_0이 없다: ${[...missing].join(', ')}`,
    );
  }
};

/**
 * KTX2 압축 트랜스폼 목록을 반환한다. 앞 단계에서 이미 image/ktx2가 된 texture는 건너뛰므로
 * 좁은 규칙(normal)부터 넓은 규칙(나머지) 순으로 나열한다.
 *
 * 죽은 metallicRoughness/occlusion을 앞에서 이미 제거했으므로 GLB에 남는 texture는
 * normal과 baseColor뿐이다. ORM 프리셋이 여기 없는 이유다.
 * @returns {import('@gltf-transform/core').Transform[]} 순차 적용할 트랜스폼
 */
const ktx2Transforms = () => [
  ktx2({ ...UASTC_NORMAL_OPTIONS, imageDecoder: decodeImage, slots: /normalTexture/ }),
  ktx2({ ...ETC1S_COLOR_OPTIONS, imageDecoder: decodeImage }),
  assertAllTexturesAreKtx2(),
];

/**
 * 프롭(bass/table/sofa)용 최적화 트랜스폼 목록을 반환한다.
 * 노드 병합/리네임을 유발하는 flatten/join/palette/instance/simplify/optimize는 사용하지 않는다.
 * @returns {import('@gltf-transform/core').Transform[]} 순차 적용할 트랜스폼
 */
const propTransforms = () => [
  dedup(),
  // keepAttributes: true — frame_screen은 빌드 시점엔 어떤 texture도 UV를 참조하지 않아
  // 기본값(false)이면 TEXCOORD_0을 "미사용"으로 지운다. 캐릭터 파이프라인과 대칭.
  prune({ keepAttributes: true }),
  weld(),
  stripRuntimeOverriddenOrmTextures(name => !PROP_RUNTIME_ORM_EXCLUDED_MESH_NAMES.has(name)),
  prune({ keepAttributes: true }),
  // KTX2 인코더는 리사이즈를 하지 않으므로 해상도 조정은 여기서 끝내고 무손실(PNG)로 넘긴다.
  textureCompress({
    encoder: sharp,
    targetFormat: 'png',
    resize: [1024, 1024],
  }),
  ...ktx2Transforms(),
  assertRuntimeTexturedMeshesKeepUv(),
  meshopt({ encoder: MeshoptEncoder, level: 'medium' }),
];

/**
 * 캐릭터(character)용 보수적 최적화 트랜스폼 목록을 반환한다.
 * 스킨/모프 보존을 위해 weld·단독 quantize·flatten 계열은 사용하지 않는다.
 * @returns {import('@gltf-transform/core').Transform[]} 순차 적용할 트랜스폼
 */
const characterTransforms = () => [
  dedup(),
  prune({ keepAttributes: true }),
  resample(),
  sparse(),
  stripRuntimeOverriddenOrmTextures(name => CHARACTER_RUNTIME_ORM_MESH_NAMES.has(name)),
  prune({ keepAttributes: true }),
  // skin_normal은 2048²인데 값 범위가 (128,128,255)에서 ±7뿐이라 실질 정보가 거의 없다.
  // baseColor(skin_color)가 1024²이므로 노멀만 더 높을 이유도 없다.
  textureCompress({
    encoder: sharp,
    targetFormat: 'png',
    pattern: /skin_normal/i,
    resize: [1024, 1024],
  }),
  ...ktx2Transforms(),
  assertRuntimeTexturedMeshesKeepUv(),
  meshopt({ encoder: MeshoptEncoder, level: 'medium' }),
];

/**
 * 단일 GLB를 최적화해 public/models/{name}.v4.glb로 출력하고 전후 사이즈를 출력한다.
 * @param {NodeIO} io - 확장/의존성이 등록된 NodeIO
 * @param {string} name - 확장자 없는 파일명(character/bass/table/sofa)
 * @param {import('@gltf-transform/core').Transform[]} transforms - 적용할 트랜스폼 목록
 * @returns {Promise<void>}
 */
const optimizeModel = async (io, name, transforms) => {
  const srcPath = resolve(SRC_DIR, `${name}.glb`);
  const outPath = resolve(OUT_DIR, `${name}.${ASSET_VERSION}.glb`);

  console.log(`\n[${name}]`);

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
    `  ${name}.glb -> ${name}.${ASSET_VERSION}.glb  ${formatMb(beforeBytes)} -> ${formatMb(
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
  console.log('\n--- done ---');
};

run().catch(error => {
  console.error(error);
  process.exit(1);
});

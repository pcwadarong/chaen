// @ts-check

/**
 * GLB 안팎의 texture를 같은 규칙으로 굽기 위한 KTX2(basis) 인코딩 프리셋.
 *
 * 포맷 선택 근거:
 * - baseColor  : ETC1S. 압축률 우선이고 색상은 블록 아티팩트가 덜 보인다.
 * - ORM        : **UASTC**. ETC1S는 RGB를 공동 인코딩해서 채널이 서로 번진다.
 *                ORM은 R/G/B가 각각 독립 신호(occlusion/roughness/metallic)라 이 번짐이
 *                그대로 셰이딩 오류로 보인다 — 노트북 커버의 "Chaen" 각인이 ETC1S에서
 *                획이 끊기고 번졌고, UASTC로 바꾸자 원본과 구분되지 않았다.
 * - normal     : UASTC. ETC1S로 구우면 노멀이 눈에 띄게 깨진다. 예외 없음.
 *
 * `isPerceptual`(인코더가 sRGB 가정으로 오차를 계산할지)과
 * `isSetKTX2SRGBTransferFunc`(KTX2 DFD에 sRGB transfer를 기록할지)는 항상 함께 움직인다.
 * ORM/normal은 선형 데이터라 둘 다 꺼야 밝기가 틀어지지 않는다.
 */

/** 모든 프리셋 공통. mipmap을 인코더가 만들게 해 축소 시 aliasing을 막는다. */
const BASE_OPTIONS = /** @type {const} */ ({
  generateMipmap: true,
  isKTX2File: true,
});

/**
 * sRGB 색상 texture(baseColor)용 ETC1S 프리셋.
 * `qualityLevel`은 최대치(255)를 쓴다 — 200에서는 `gear_color`의 노트북 로고처럼
 * 저대비 얇은 글자가 블록 경계로 끊겨 보였고, 올려도 파일 증가폭이 작다.
 */
export const ETC1S_COLOR_OPTIONS = {
  ...BASE_OPTIONS,
  compressionLevel: 4,
  isPerceptual: true,
  isSetKTX2SRGBTransferFunc: true,
  isUASTC: false,
  qualityLevel: 255,
};

/**
 * 선형 데이터(ORM 등)용 UASTC 프리셋.
 * RDO + zstd supercompression으로 파일 크기를 줄인다. UASTC는 GPU에서 항상 8bpp(BC7/ASTC/ETC2)로
 * 풀리므로 RDO는 VRAM이 아니라 다운로드 용량에만 영향을 준다.
 */
export const UASTC_LINEAR_OPTIONS = {
  ...BASE_OPTIONS,
  enableRDO: true,
  isPerceptual: false,
  isSetKTX2SRGBTransferFunc: false,
  isUASTC: true,
  needSupercompression: true,
  rdoQualityLevel: 1,
  uastcLDRQualityLevel: 2,
};

/**
 * normal map용 UASTC 프리셋. 선형 프리셋에 basisu의 `-normal_map` 튜닝을 더한 것이다.
 */
export const UASTC_NORMAL_OPTIONS = {
  ...UASTC_LINEAR_OPTIONS,
  isNormalMap: true,
};

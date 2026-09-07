const SCENE_TIMING_GLB_READY_PREFIX = 'scene:glb-ready:';
const SCENE_TIMING_FIRST_FRAME_MARK = 'scene:first-frame';
const SCENE_TIMING_FIRST_CONTENT_FRAME_MARK = 'scene:first-content-frame';

/**
 * 같은 이름의 mark가 이미 있으면 다시 찍지 않습니다.
 * Suspense는 같은 컴포넌트를 여러 번 평가하므로, 최초 시점만 남겨야 의미가 있습니다.
 */
const markOnce = (name: string): void => {
  if (typeof performance === 'undefined') return;
  if (performance.getEntriesByName(name, 'mark').length > 0) return;

  performance.mark(name);
};

/**
 * GLB 하나가 파싱과 KTX2 transcode를 마쳐 사용 가능해진 시점을 기록합니다.
 *
 * 다운로드 구간은 브라우저의 Resource Timing에 이미 있으므로 따로 재지 않습니다.
 * 여기서 재야 하는 것은 **바이트가 도착한 뒤에 일어나는 일**뿐입니다.
 */
export const markSceneGlbReady = (path: string): void => {
  markOnce(`${SCENE_TIMING_GLB_READY_PREFIX}${path}`);
};

/**
 * 캔버스가 살아나 첫 프레임을 그린 시점을 기록합니다. 이때 씬은 아직 비어 있습니다.
 */
export const markSceneFirstFrame = (): void => {
  markOnce(SCENE_TIMING_FIRST_FRAME_MARK);
};

/**
 * 씬 내용(캐릭터·소품)이 실제로 그려진 첫 프레임을 기록합니다.
 *
 * {@link markSceneFirstFrame}과 반드시 나눠야 합니다 — `<Canvas>`는 GLB를 기다리지 않고
 * 빈 씬으로 먼저 그려지므로(실측 약 430ms 앞섬), 그 시점을 "첫 프레임"으로 쓰면
 * 로딩 비용 전체가 숫자에서 사라집니다.
 */
export const markSceneFirstContentFrame = (): void => {
  markOnce(SCENE_TIMING_FIRST_CONTENT_FRAME_MARK);
};

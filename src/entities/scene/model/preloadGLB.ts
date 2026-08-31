/**
 * 씬에서 사용할 GLB 자산 경로를 한곳에서 관리합니다.
 *
 * 버전 규칙: 에셋 내용 변경 시 `.vN` 접미사를 올리고 이 상수만 갱신합니다.
 * `next.config.ts`의 HTTP immutable 캐싱(`max-age=31536000, immutable`)은
 * 파일명이 절대 바뀌지 않는다는 전제에 의존하므로, 같은 파일명으로 내용만
 * 교체하면 브라우저/CDN에 캐시된 옛 버전이 계속 서빙됩니다.
 */
export const CHARACTER_MODEL_PATH = '/models/character.v3.glb';
export const BASS_MODEL_PATH = '/models/bass.v3.glb';
export const TABLE_MODEL_PATH = '/models/table.v3.glb';
export const SOFA_MODEL_PATH = '/models/sofa.v3.glb';

export const sceneModelPaths = [
  CHARACTER_MODEL_PATH,
  BASS_MODEL_PATH,
  TABLE_MODEL_PATH,
  SOFA_MODEL_PATH,
] as const;

type SceneGlbPath = (typeof sceneModelPaths)[number];

/**
 * 전달받은 preload 함수로 주요 GLB 경로를 순서대로 등록합니다.
 */
export const preloadSceneGlbs = (preload: (path: SceneGlbPath) => void): void => {
  sceneModelPaths.forEach(path => {
    preload(path);
  });
};

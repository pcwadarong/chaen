/**
 * 씬에서 사용할 GLB 자산 경로를 한곳에서 관리합니다.
 */
export const sceneModelPaths = [
  '/models/character.glb',
  '/models/bass.glb',
  '/models/table.glb',
  '/models/sofa.glb',
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

import { useGLTF } from '@react-three/drei';

/**
 * 씬에서 사용할 GLB 자산 경로를 한곳에서 관리합니다.
 */
export const sceneModelPaths = [
  '/models/character.glb',
  '/models/guitar.glb',
  '/models/table.glb',
  '/models/sofa.glb',
] as const;

/**
 * 초기 렌더 이전에 주요 GLB를 미리 로드합니다.
 */
export const preloadSceneGlbs = (): void => {
  sceneModelPaths.forEach(path => {
    useGLTF.preload(path);
  });
};

preloadSceneGlbs();

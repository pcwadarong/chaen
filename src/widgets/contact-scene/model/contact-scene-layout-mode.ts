import type { SceneMode } from '@/entities/scene/model/breakpointConfig';
import { SCENE_LAYOUT_HEIGHT_THRESHOLDS } from '@/shared/config/responsive';

export type ContactSceneLayoutMode = 'compact' | 'full' | 'hidden';

type GetContactSceneLayoutModeParams = Readonly<{
  availableHeight: number;
  sceneMode: SceneMode;
}>;

/**
 * contact scene이 어떤 레이아웃 모드로 렌더되어야 하는지 계산합니다.
 * 모바일 scene에서는 숨기고, desktop이지만 높이가 짧으면 compact copy-only 레이아웃으로 전환합니다.
 */
export const getContactSceneLayoutMode = ({
  availableHeight,
  sceneMode,
}: GetContactSceneLayoutModeParams): ContactSceneLayoutMode => {
  if (sceneMode !== 'desktop') {
    return 'hidden';
  }

  if (availableHeight < SCENE_LAYOUT_HEIGHT_THRESHOLDS.contactCompactDesktopMax) {
    return 'compact';
  }

  return 'full';
};

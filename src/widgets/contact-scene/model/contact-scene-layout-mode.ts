import {
  SCENE_VIEWPORT_MODE,
  type SceneViewportMode,
} from '@/entities/scene/model/breakpointConfig';
import { SCENE_LAYOUT_HEIGHT_THRESHOLDS } from '@/shared/config/responsive';

/**
 * contact scene이 취할 수 있는 레이아웃 모드 집합입니다.
 *
 * - `hidden`
 *   stacked viewport이거나 contact scene 자체를 노출하지 않아야 하는 상태입니다.
 * - `centeredCopy`
 *   wide viewport이지만 높이가 짧아 캐릭터 씬을 제거하고 copy만 중앙 정렬로 보여주는 상태입니다.
 * - `splitScene`
 *   좌측 copy, 우측 캐릭터 씬을 함께 보여주는 기본 wide 상태입니다.
 */
export const CONTACT_SCENE_LAYOUT_MODE = {
  centeredCopy: 'centeredCopy',
  hidden: 'hidden',
  splitScene: 'splitScene',
} as const;

export type ContactSceneLayoutMode =
  (typeof CONTACT_SCENE_LAYOUT_MODE)[keyof typeof CONTACT_SCENE_LAYOUT_MODE];

type GetContactSceneLayoutModeParams = Readonly<{
  availableHeight: number;
  sceneViewportMode: SceneViewportMode;
}>;

/**
 * contact scene이 어떤 레이아웃 모드로 렌더되어야 하는지 계산합니다.
 * stacked viewport에서는 숨기고, wide이지만 높이가 짧으면 copy-only 레이아웃으로 전환합니다.
 */
export const getContactSceneLayoutMode = ({
  availableHeight,
  sceneViewportMode,
}: GetContactSceneLayoutModeParams): ContactSceneLayoutMode => {
  if (sceneViewportMode !== SCENE_VIEWPORT_MODE.wide) return CONTACT_SCENE_LAYOUT_MODE.hidden;
  if (availableHeight < SCENE_LAYOUT_HEIGHT_THRESHOLDS.contactCompactDesktopMax)
    return CONTACT_SCENE_LAYOUT_MODE.centeredCopy;
  return CONTACT_SCENE_LAYOUT_MODE.splitScene;
};

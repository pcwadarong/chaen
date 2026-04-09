import {
  SCENE_VIEWPORT_MODE,
  type SceneViewportMode,
} from '@/entities/scene/model/breakpointConfig';

type HomeHeroStageCanvasBassString = 'line1' | 'line2' | 'line3' | 'line4';

type CreateHomeHeroStageCanvasInteractionHandlersParams = Readonly<{
  onBrowseProjects?: () => void;
  onOpenImageViewer?: () => void;
  onPlayBassString: (stringName: HomeHeroStageCanvasBassString) => void | Promise<void>;
  onPrepareAudioPlayback: () => void;
  onToggleBackgroundMusicPlayback: () => void | Promise<void>;
  sceneViewportMode: SceneViewportMode;
  scrollToProjects: (triggerElement: HTMLElement | null) => void;
  triggerElementRef: Readonly<{
    current: HTMLElement | null;
  }>;
}>;

export type HomeHeroStageCanvasInteractionHandlers = Readonly<{
  onBrowseProjects: () => void;
  onOpenImageViewer?: () => void;
  onPlayBassString: (stringName: HomeHeroStageCanvasBassString) => void | Promise<void>;
  onPrepareAudioPlayback: () => void;
  onToggleBackgroundMusicPlayback: () => void | Promise<void>;
}>;

/**
 * 홈 히어로 stage에서 쓰는 상호작용 콜백 묶음을 viewport 모드에 맞게 조합합니다.
 * stacked에서는 외부 browse callback을 그대로 쓰고, wide에서는 trigger 기준 스크롤 이동으로 치환합니다.
 */
export const createHomeHeroStageCanvasInteractionHandlers = ({
  onBrowseProjects,
  onOpenImageViewer,
  onPlayBassString,
  onPrepareAudioPlayback,
  onToggleBackgroundMusicPlayback,
  sceneViewportMode,
  scrollToProjects,
  triggerElementRef,
}: CreateHomeHeroStageCanvasInteractionHandlersParams): HomeHeroStageCanvasInteractionHandlers => ({
  onBrowseProjects: () => {
    if (sceneViewportMode === SCENE_VIEWPORT_MODE.stacked) {
      onBrowseProjects?.();
      return;
    }

    scrollToProjects(triggerElementRef.current);
  },
  onOpenImageViewer,
  onPlayBassString,
  onPrepareAudioPlayback,
  onToggleBackgroundMusicPlayback,
});

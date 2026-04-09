/**
 * @vitest-environment node
 */

import { describe, expect, it, vi } from 'vitest';

import { SCENE_VIEWPORT_MODE } from '@/entities/scene/model/breakpointConfig';
import { createHomeHeroStageCanvasInteractionHandlers } from '@/widgets/home-hero-scene/model/home-hero-stage-canvas-interaction';

describe('createHomeHeroStageCanvasInteractionHandlers', () => {
  it('stacked viewport에서는 외부 browse callback을 그대로 호출해야 한다', () => {
    const onBrowseProjects = vi.fn();
    const scrollToProjects = vi.fn();

    const handlers = createHomeHeroStageCanvasInteractionHandlers({
      onBrowseProjects,
      onPlayBassString: vi.fn(),
      onPrepareAudioPlayback: vi.fn(),
      onToggleBackgroundMusicPlayback: vi.fn(),
      sceneViewportMode: SCENE_VIEWPORT_MODE.stacked,
      scrollToProjects,
      triggerElementRef: { current: null },
    });

    handlers.onBrowseProjects();

    expect(onBrowseProjects).toHaveBeenCalledOnce();
    expect(scrollToProjects).not.toHaveBeenCalled();
  });

  it('wide viewport에서는 trigger 기준 스크롤 이동을 사용해야 한다', () => {
    const triggerElement = {} as HTMLElement;
    const onBrowseProjects = vi.fn();
    const scrollToProjects = vi.fn();

    const handlers = createHomeHeroStageCanvasInteractionHandlers({
      onBrowseProjects,
      onPlayBassString: vi.fn(),
      onPrepareAudioPlayback: vi.fn(),
      onToggleBackgroundMusicPlayback: vi.fn(),
      sceneViewportMode: SCENE_VIEWPORT_MODE.wide,
      scrollToProjects,
      triggerElementRef: { current: triggerElement },
    });

    handlers.onBrowseProjects();

    expect(onBrowseProjects).not.toHaveBeenCalled();
    expect(scrollToProjects).toHaveBeenCalledWith(triggerElement);
  });

  it('wide viewport에서 ref가 나중에 채워지면, browse handler는 호출 시점의 trigger를 읽어야 한다', () => {
    const triggerElementRef = { current: null as HTMLElement | null };
    const scrollToProjects = vi.fn();

    const handlers = createHomeHeroStageCanvasInteractionHandlers({
      onPlayBassString: vi.fn(),
      onPrepareAudioPlayback: vi.fn(),
      onToggleBackgroundMusicPlayback: vi.fn(),
      sceneViewportMode: SCENE_VIEWPORT_MODE.wide,
      scrollToProjects,
      triggerElementRef,
    });

    triggerElementRef.current = {} as HTMLElement;
    handlers.onBrowseProjects();

    expect(scrollToProjects).toHaveBeenCalledWith(triggerElementRef.current);
  });

  it('bass/audio/image viewer 콜백은 변경 없이 그대로 전달해야 한다', () => {
    const onOpenImageViewer = vi.fn();
    const onPlayBassString = vi.fn();
    const onPrepareAudioPlayback = vi.fn();
    const onToggleBackgroundMusicPlayback = vi.fn();

    const handlers = createHomeHeroStageCanvasInteractionHandlers({
      onOpenImageViewer,
      onPlayBassString,
      onPrepareAudioPlayback,
      onToggleBackgroundMusicPlayback,
      sceneViewportMode: SCENE_VIEWPORT_MODE.wide,
      scrollToProjects: vi.fn(),
      triggerElementRef: { current: null },
    });

    handlers.onOpenImageViewer?.();
    handlers.onPrepareAudioPlayback();
    handlers.onPlayBassString('line3');
    handlers.onToggleBackgroundMusicPlayback();

    expect(onOpenImageViewer).toHaveBeenCalledOnce();
    expect(onPrepareAudioPlayback).toHaveBeenCalledOnce();
    expect(onPlayBassString).toHaveBeenCalledWith('line3');
    expect(onToggleBackgroundMusicPlayback).toHaveBeenCalledOnce();
  });
});

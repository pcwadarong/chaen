/* @vitest-environment jsdom */

import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';

import { HomeHeroStageCanvas } from '@/widgets/home-hero-scene/ui/home-hero-stage-canvas';

import '@testing-library/jest-dom/vitest';

const homeHeroStageCanvasMockState = vi.hoisted(() => ({
  createdCanvasElement: null as HTMLCanvasElement | null,
  interactionControllerProps: null as null | {
    onBrowseProjects?: () => void;
    onPlayBassString?: (stringName: 'line1' | 'line2' | 'line3' | 'line4') => void;
    onPrepareAudioPlayback?: () => void;
    showOutlineEffect?: boolean;
    onToggleBackgroundMusicPlayback?: () => void;
  },
  orbitControlsProps: null as null | Record<string, unknown>,
  sceneViewportMode: 'wide' as 'stacked' | 'wide',
  viewportWidth: 1280,
  timelineState: {
    isCloseupCostumeHidden: false,
    isMonitorOverlayVisible: false,
    monitorOverlayOpacity: 0,
    isScrollDriven: false,
    isSequenceActive: false,
    progress: 0,
  },
}));

const bassAudioMockState = vi.hoisted(() => ({
  isBackgroundMusicPlaying: false,
  pauseBackgroundMusicPlayback: vi.fn(),
  playBassString: vi.fn(),
  prepareBassAudioPlayback: vi.fn(),
  toggleBackgroundMusicPlayback: vi.fn(),
}));

vi.mock('next-intl', () => ({
  useLocale: () => 'ko',
  useTranslations: (namespace: string) => (key: string) => `${namespace}.${key}`,
}));

vi.mock('@react-three/fiber', () => ({
  Canvas: ({
    children,
    dpr,
    shadows,
    onCreated,
  }: {
    children: React.ReactNode;
    dpr?: unknown;
    shadows?: boolean;
    onCreated?: (state: {
      gl: {
        domElement: HTMLCanvasElement;
        setClearColor: ReturnType<typeof vi.fn>;
      };
    }) => void;
  }) => {
    const hasCreatedRef = React.useRef(false);

    React.useEffect(() => {
      if (hasCreatedRef.current) return;

      hasCreatedRef.current = true;
      const domElement = document.createElement('canvas');
      const gl = {
        domElement,
        setClearColor: vi.fn(),
      };

      homeHeroStageCanvasMockState.createdCanvasElement = domElement;
      onCreated?.({ gl });
    }, [onCreated]);

    return (
      <div
        data-dpr={JSON.stringify(dpr)}
        data-shadows={String(Boolean(shadows))}
        data-testid="home-hero-stage-canvas"
      >
        {children}
      </div>
    );
  },
}));

vi.mock('@react-three/drei', () => ({
  Html: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="three-html">{children}</div>
  ),
  OrbitControls: (props: Record<string, unknown>) => {
    homeHeroStageCanvasMockState.orbitControlsProps = props;

    return <div data-testid="orbit-controls" />;
  },
}));

vi.mock('@/widgets/home-hero-scene/ui/home-hero-character', () => ({
  HomeHeroCharacter: ({ instance }: { instance: 'contact' | 'main' }) => (
    <div data-testid={`character-${instance}`} />
  ),
}));

vi.mock('@/entities/scene/ui/scene-prop', () => ({
  SceneProp: ({
    frameScreenImageSrc,
    path,
  }: {
    frameScreenImageSrc?: string | null;
    path: string;
    position: [number, number, number];
  }) => (
    <div
      data-frame-screen-src={frameScreenImageSrc ?? ''}
      data-path={path}
      data-testid={`prop-${path}`}
    />
  ),
}));

vi.mock('@/widgets/home-hero-scene/model/use-breakpoint', () => ({
  useBreakpoint: () => ({
    currentBP: 4,
    sceneViewportMode: homeHeroStageCanvasMockState.sceneViewportMode,
    viewportHeight: 800,
    viewportWidth: homeHeroStageCanvasMockState.viewportWidth,
  }),
}));

vi.mock('@/widgets/home-hero-scene/model/use-home-hero-scene-transition', () => ({
  useHomeHeroSceneTransition: () => homeHeroStageCanvasMockState.timelineState,
}));

vi.mock('@/features/monitor-overlay/model/use-monitor-overlay-texture', () => ({
  useMonitorOverlayTexture: () => null,
}));

vi.mock('@/features/interaction/ui/scene-interaction-controller', () => ({
  SceneInteractionController: (props: Record<string, unknown>) => {
    homeHeroStageCanvasMockState.interactionControllerProps = props;

    return <div data-testid="scene-interaction-controller" />;
  },
}));

vi.mock('@/features/audio/model/use-bass-audio', () => ({
  useBassAudio: () => bassAudioMockState,
}));

describe('HomeHeroStageCanvas', () => {
  beforeEach(() => {
    homeHeroStageCanvasMockState.createdCanvasElement = null;
    homeHeroStageCanvasMockState.interactionControllerProps = null;
    homeHeroStageCanvasMockState.orbitControlsProps = null;
    homeHeroStageCanvasMockState.sceneViewportMode = 'wide';
    homeHeroStageCanvasMockState.viewportWidth = 1280;
    homeHeroStageCanvasMockState.timelineState = {
      isCloseupCostumeHidden: false,
      isMonitorOverlayVisible: false,
      monitorOverlayOpacity: 0,
      isScrollDriven: false,
      isSequenceActive: false,
      progress: 0,
    };
    bassAudioMockState.isBackgroundMusicPlaying = false;
    bassAudioMockState.pauseBackgroundMusicPlayback.mockReset();
    bassAudioMockState.playBassString.mockReset();
    bassAudioMockState.prepareBassAudioPlayback.mockReset();
    bassAudioMockState.toggleBackgroundMusicPlayback.mockReset();
    Object.defineProperty(window, 'innerWidth', {
      configurable: true,
      value: 1280,
      writable: true,
    });
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('홈 전용 stage 내부에 main 캐릭터와 소품을 배치하고 orbit controls를 렌더링한다', () => {
    render(
      <HomeHeroStageCanvas
        blackoutOverlayRef={{ current: null }}
        triggerRef={{ current: null }}
        webUiRef={{ current: null }}
      />,
    );

    expect(screen.getByTestId('home-hero-stage-canvas')).toBeTruthy();
    expect(screen.getByTestId('orbit-controls')).toBeTruthy();
    expect(screen.getByTestId('scene-interaction-controller')).toBeTruthy();
    expect(screen.getByTestId('character-main')).toBeTruthy();
    expect(screen.queryByTestId('character-contact')).toBeNull();
    expect(screen.getByTestId('prop-/models/sofa.glb')).toBeTruthy();
    expect(screen.getByTestId('prop-/models/bass.glb')).toBeTruthy();
    expect(screen.getByTestId('prop-/models/table.glb')).toBeTruthy();
  });

  it('wide sceneViewportMode에서는 OrbitControls 줌이 비활성화되어야 한다', () => {
    render(
      <HomeHeroStageCanvas
        blackoutOverlayRef={{ current: null }}
        triggerRef={{ current: null }}
        webUiRef={{ current: null }}
      />,
    );

    expect(homeHeroStageCanvasMockState.orbitControlsProps?.enableZoom).toBe(false);
  });

  it('stacked viewport에서는 낮은 DPR과 shadow 비활성 preset을 사용해야 한다', () => {
    homeHeroStageCanvasMockState.sceneViewportMode = 'stacked';
    homeHeroStageCanvasMockState.viewportWidth = 768;

    render(
      <HomeHeroStageCanvas
        blackoutOverlayRef={{ current: null }}
        triggerRef={{ current: null }}
        webUiRef={{ current: null }}
      />,
    );

    expect(screen.getByTestId('home-hero-stage-canvas')).toHaveAttribute(
      'data-dpr',
      JSON.stringify([1, 1.25]),
    );
    expect(screen.getByTestId('home-hero-stage-canvas')).toHaveAttribute('data-shadows', 'false');
    expect(homeHeroStageCanvasMockState.interactionControllerProps?.showOutlineEffect).toBe(false);
  });

  it('wide viewport에서는 viewport 폭과 무관하게 full wide 품질 preset을 사용해야 한다', () => {
    homeHeroStageCanvasMockState.sceneViewportMode = 'wide';
    homeHeroStageCanvasMockState.viewportWidth = 812;

    render(
      <HomeHeroStageCanvas
        blackoutOverlayRef={{ current: null }}
        triggerRef={{ current: null }}
        webUiRef={{ current: null }}
      />,
    );

    expect(screen.getByTestId('home-hero-stage-canvas')).toHaveAttribute(
      'data-dpr',
      JSON.stringify([1, 2]),
    );
    expect(screen.getByTestId('home-hero-stage-canvas')).toHaveAttribute('data-shadows', 'true');
    expect(homeHeroStageCanvasMockState.interactionControllerProps?.showOutlineEffect).toBe(true);
  });

  it('캔버스 interaction controller에는 오디오 prewarm 콜백이 연결되어야 한다', () => {
    render(
      <HomeHeroStageCanvas
        blackoutOverlayRef={{ current: null }}
        triggerRef={{ current: null }}
        webUiRef={{ current: null }}
      />,
    );

    homeHeroStageCanvasMockState.interactionControllerProps?.onPrepareAudioPlayback?.();

    expect(bassAudioMockState.prepareBassAudioPlayback).toHaveBeenCalledOnce();
  });

  it('스크롤 시퀀스가 진행 중이면 데스크탑 OrbitControls는 잠겨야 한다', () => {
    homeHeroStageCanvasMockState.timelineState = {
      ...homeHeroStageCanvasMockState.timelineState,
      isScrollDriven: true,
      isSequenceActive: true,
    };

    render(
      <HomeHeroStageCanvas
        blackoutOverlayRef={{ current: null }}
        triggerRef={{ current: null }}
        webUiRef={{ current: null }}
      />,
    );

    expect(homeHeroStageCanvasMockState.orbitControlsProps?.enabled).toBe(false);
  });

  it('스크롤 시퀀스가 끝나면 데스크탑 OrbitControls는 다시 활성화되어야 한다', () => {
    homeHeroStageCanvasMockState.timelineState = {
      ...homeHeroStageCanvasMockState.timelineState,
      isScrollDriven: true,
      isSequenceActive: false,
    };

    render(
      <HomeHeroStageCanvas
        blackoutOverlayRef={{ current: null }}
        triggerRef={{ current: null }}
        webUiRef={{ current: null }}
      />,
    );

    expect(homeHeroStageCanvasMockState.orbitControlsProps?.enabled).toBe(true);
  });

  it('스크롤 progress가 0.5 이상이면 scene interaction controller를 비활성화해야 한다', () => {
    homeHeroStageCanvasMockState.timelineState = {
      ...homeHeroStageCanvasMockState.timelineState,
      progress: 0.5,
    };

    render(
      <HomeHeroStageCanvas
        blackoutOverlayRef={{ current: null }}
        triggerRef={{ current: null }}
        webUiRef={{ current: null }}
      />,
    );

    expect(screen.queryByTestId('scene-interaction-controller')).toBeNull();
  });

  it('interaction threshold를 올리면 같은 progress에서도 scene interaction controller를 유지해야 한다', () => {
    homeHeroStageCanvasMockState.timelineState = {
      ...homeHeroStageCanvasMockState.timelineState,
      progress: 0.5,
    };

    render(
      <HomeHeroStageCanvas
        blackoutOverlayRef={{ current: null }}
        interactionDisabledProgressThreshold={0.6}
        triggerRef={{ current: null }}
        webUiRef={{ current: null }}
      />,
    );

    expect(screen.getByTestId('scene-interaction-controller')).toBeTruthy();
  });

  it('stacked sceneViewportMode에서는 OrbitControls 줌이 유지되어야 한다', () => {
    homeHeroStageCanvasMockState.sceneViewportMode = 'stacked';
    const onBrowseProjects = vi.fn();

    render(
      <HomeHeroStageCanvas
        blackoutOverlayRef={{ current: null }}
        onBrowseProjects={onBrowseProjects}
        triggerRef={{ current: null }}
        webUiRef={{ current: null }}
      />,
    );

    expect(homeHeroStageCanvasMockState.orbitControlsProps?.enableZoom).toBe(true);

    homeHeroStageCanvasMockState.interactionControllerProps?.onBrowseProjects?.();

    expect(onBrowseProjects).toHaveBeenCalledOnce();
  });

  it('wide sceneViewportMode에서는 viewport 폭과 무관하게 프로젝트 스크롤 이동을 사용해야 한다', () => {
    homeHeroStageCanvasMockState.sceneViewportMode = 'wide';
    homeHeroStageCanvasMockState.viewportWidth = 812;
    const onBrowseProjects = vi.fn();

    Object.defineProperty(window, 'innerWidth', {
      configurable: true,
      value: 812,
      writable: true,
    });

    render(
      <HomeHeroStageCanvas
        blackoutOverlayRef={{ current: null }}
        onBrowseProjects={onBrowseProjects}
        triggerRef={{ current: null }}
        webUiRef={{ current: null }}
      />,
    );

    homeHeroStageCanvasMockState.interactionControllerProps?.onBrowseProjects?.();

    expect(onBrowseProjects).not.toHaveBeenCalled();
  });

  it('Canvas는 과한 DPR 상한 대신 2까지로 제한되어야 한다', () => {
    render(
      <HomeHeroStageCanvas
        blackoutOverlayRef={{ current: null }}
        triggerRef={{ current: null }}
        webUiRef={{ current: null }}
      />,
    );

    expect(screen.getByTestId('home-hero-stage-canvas')).toHaveAttribute('data-dpr', '[1,2]');
  });

  it('선택된 frame 이미지 src가 table prop까지 전달되어야 한다', () => {
    render(
      <HomeHeroStageCanvas
        blackoutOverlayRef={{ current: null }}
        selectedFrameImageSrc="https://example.com/frame.jpg"
        triggerRef={{ current: null }}
        webUiRef={{ current: null }}
      />,
    );

    expect(screen.getByTestId('prop-/models/table.glb')).toHaveAttribute(
      'data-frame-screen-src',
      'https://example.com/frame.jpg',
    );
  });

  it('scene interaction controller는 background music 토글과 bass string 콜백을 함께 받아야 한다', () => {
    render(
      <HomeHeroStageCanvas
        blackoutOverlayRef={{ current: null }}
        triggerRef={{ current: null }}
        webUiRef={{ current: null }}
      />,
    );

    homeHeroStageCanvasMockState.interactionControllerProps?.onToggleBackgroundMusicPlayback?.();
    homeHeroStageCanvasMockState.interactionControllerProps?.onPlayBassString?.('line3');

    expect(bassAudioMockState.toggleBackgroundMusicPlayback).toHaveBeenCalledOnce();
    expect(bassAudioMockState.playBassString).toHaveBeenCalledWith('line3');
  });

  it('background music 재생 중이면 bass 위 정지 버튼 오버레이를 노출해야 한다', () => {
    bassAudioMockState.isBackgroundMusicPlaying = true;

    render(
      <HomeHeroStageCanvas
        blackoutOverlayRef={{ current: null }}
        triggerRef={{ current: null }}
        webUiRef={{ current: null }}
      />,
    );

    expect(screen.getByRole('button', { name: 'Navigation.pauseMusic' })).toBeTruthy();
  });

  it('정지 버튼 오버레이를 누르면 background music 일시정지 콜백을 호출해야 한다', () => {
    bassAudioMockState.isBackgroundMusicPlaying = true;

    render(
      <HomeHeroStageCanvas
        blackoutOverlayRef={{ current: null }}
        triggerRef={{ current: null }}
        webUiRef={{ current: null }}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Navigation.pauseMusic' }));

    expect(bassAudioMockState.pauseBackgroundMusicPlayback).toHaveBeenCalledOnce();
  });

  it('실제 three canvas는 접근성 트리에서 숨기고 presentation role을 가져야 한다', () => {
    render(
      <HomeHeroStageCanvas
        blackoutOverlayRef={{ current: null }}
        triggerRef={{ current: null }}
        webUiRef={{ current: null }}
      />,
    );

    expect(homeHeroStageCanvasMockState.createdCanvasElement).not.toBeNull();
    expect(homeHeroStageCanvasMockState.createdCanvasElement).toHaveAttribute(
      'aria-hidden',
      'true',
    );
    expect(homeHeroStageCanvasMockState.createdCanvasElement).toHaveAttribute(
      'role',
      'presentation',
    );
  });
});

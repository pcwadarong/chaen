import { render, screen } from '@testing-library/react';
import React from 'react';

import { HomeHeroStageCanvas } from '@/widgets/home-hero-scene/ui/home-hero-stage-canvas';

import '@testing-library/jest-dom/vitest';

const homeHeroStageCanvasMockState = vi.hoisted(() => ({
  interactionControllerProps: null as null | Record<string, unknown>,
  orbitControlsProps: null as null | Record<string, unknown>,
  sceneMode: 'desktop' as 'desktop' | 'mobile',
  timelineState: {
    isCloseupCostumeHidden: false,
    isMonitorOverlayVisible: false,
    progress: 0,
    isScrollDriven: false,
    isSequenceActive: false,
  },
}));

vi.mock('@react-three/fiber', () => ({
  Canvas: ({ children, dpr }: { children: React.ReactNode; dpr?: unknown }) => (
    <div data-dpr={JSON.stringify(dpr)} data-testid="home-hero-stage-canvas">
      {children}
    </div>
  ),
}));

vi.mock('@react-three/drei', () => ({
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
    sceneMode: homeHeroStageCanvasMockState.sceneMode,
  }),
}));

vi.mock('@/widgets/home-hero-scene/model/use-home-hero-scene-transition', () => ({
  useHomeHeroSceneTransition: () => homeHeroStageCanvasMockState.timelineState,
}));

vi.mock('@/features/interaction/ui/scene-interaction-controller', () => ({
  SceneInteractionController: (props: Record<string, unknown>) => {
    homeHeroStageCanvasMockState.interactionControllerProps = props;

    return <div data-testid="scene-interaction-controller" />;
  },
}));

describe('HomeHeroStageCanvas', () => {
  beforeEach(() => {
    homeHeroStageCanvasMockState.interactionControllerProps = null;
    homeHeroStageCanvasMockState.orbitControlsProps = null;
    homeHeroStageCanvasMockState.sceneMode = 'desktop';
    homeHeroStageCanvasMockState.timelineState = {
      isCloseupCostumeHidden: false,
      isMonitorOverlayVisible: false,
      progress: 0,
      isScrollDriven: false,
      isSequenceActive: false,
    };
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

  it('데스크탑 sceneMode에서는 OrbitControls 줌이 비활성화되어야 한다', () => {
    render(
      <HomeHeroStageCanvas
        blackoutOverlayRef={{ current: null }}
        triggerRef={{ current: null }}
        webUiRef={{ current: null }}
      />,
    );

    expect(homeHeroStageCanvasMockState.orbitControlsProps?.enableZoom).toBe(false);
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

  it('모바일 sceneMode에서는 OrbitControls 줌이 유지되어야 한다', () => {
    homeHeroStageCanvasMockState.sceneMode = 'mobile';
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
    expect(homeHeroStageCanvasMockState.interactionControllerProps?.onBrowseProjects).toBe(
      onBrowseProjects,
    );
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
});

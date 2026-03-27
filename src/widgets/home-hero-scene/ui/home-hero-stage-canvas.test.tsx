import { render, screen } from '@testing-library/react';
import React from 'react';

import { HomeHeroStageCanvas } from '@/widgets/home-hero-scene/ui/home-hero-stage-canvas';

import '@testing-library/jest-dom/vitest';

const homeHeroStageCanvasMockState = vi.hoisted(() => ({
  orbitControlsProps: null as null | Record<string, unknown>,
  sceneMode: 'desktop' as 'desktop' | 'mobile',
  timelineState: {
    isCloseupCostumeHidden: false,
    isMonitorOverlayVisible: false,
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
  SceneProp: ({ path }: { path: string; position: [number, number, number] }) => (
    <div data-path={path} data-testid={`prop-${path}`} />
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

describe('HomeHeroStageCanvas', () => {
  beforeEach(() => {
    homeHeroStageCanvasMockState.orbitControlsProps = null;
    homeHeroStageCanvasMockState.sceneMode = 'desktop';
    homeHeroStageCanvasMockState.timelineState = {
      isCloseupCostumeHidden: false,
      isMonitorOverlayVisible: false,
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

  it('모바일 sceneMode에서는 OrbitControls 줌이 유지되어야 한다', () => {
    homeHeroStageCanvasMockState.sceneMode = 'mobile';

    render(
      <HomeHeroStageCanvas
        blackoutOverlayRef={{ current: null }}
        triggerRef={{ current: null }}
        webUiRef={{ current: null }}
      />,
    );

    expect(homeHeroStageCanvasMockState.orbitControlsProps?.enableZoom).toBe(true);
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
});

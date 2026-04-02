/* @vitest-environment jsdom */

import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { vi } from 'vitest';

import { useSceneWebglAvailability } from '@/shared/lib/dom/use-scene-webgl-availability';
import { HomeHeroStage } from '@/widgets/home-hero-scene/ui/home-hero-stage';

import '@testing-library/jest-dom/vitest';

const homeHeroStageMockState = vi.hoisted(() => ({
  isSceneAssetLoading: true,
  isSceneReady: false,
}));

vi.mock('next-intl', () => ({
  useTranslations: (namespace?: string) => (key: string) => {
    if (namespace === 'Common' && key === 'pageLoading') return '페이지 로딩 중';

    return (
      {
        webglDescription: '브라우저 fallback 설명',
        webglTitle: '브라우저 fallback 제목',
      }[key] ?? key
    );
  },
}));

vi.mock('next/dynamic', () => ({
  default: () => {
    const DynamicComponent = ({
      onSceneReadyChange,
    }: {
      onSceneReadyChange?: (isReady: boolean) => void;
    }) => {
      React.useEffect(() => {
        onSceneReadyChange?.(homeHeroStageMockState.isSceneReady);
      });

      return <div data-testid="home-hero-stage-canvas" />;
    };

    return DynamicComponent;
  },
}));

vi.mock('@/shared/lib/dom/use-scene-webgl-availability', () => ({
  useSceneWebglAvailability: vi.fn(),
}));

vi.mock('@/widgets/home-hero-scene/ui/home-hero-stage-loading-bridge', () => ({
  HomeHeroStageLoadingProgressBridge: ({
    onLoadingChange,
  }: {
    onLoadingChange: (isLoading: boolean) => void;
  }) => {
    React.useEffect(() => {
      onLoadingChange(homeHeroStageMockState.isSceneAssetLoading);
    });

    return null;
  },
}));

const mockedUseSceneWebglAvailability = vi.mocked(useSceneWebglAvailability);

const sceneRefs = {
  blackoutOverlayRef: { current: null },
  triggerRef: { current: null },
  webUiRef: { current: null },
};

describe('HomeHeroStage', () => {
  beforeEach(() => {
    homeHeroStageMockState.isSceneAssetLoading = true;
    homeHeroStageMockState.isSceneReady = false;
  });

  it('WebGL을 사용할 수 있을 때, HomeHeroStage는 3D canvas를 렌더링해야 한다', () => {
    mockedUseSceneWebglAvailability.mockReturnValue(true);

    render(<HomeHeroStage sceneRefs={sceneRefs} />);

    expect(screen.getByTestId('home-hero-stage-canvas')).toBeTruthy();
    expect(screen.queryByTestId('scene-browser-fallback')).toBeNull();
  });

  it('WebGL을 사용할 수 없을 때, HomeHeroStage는 브라우저 fallback을 렌더링해야 한다', () => {
    mockedUseSceneWebglAvailability.mockReturnValue(false);

    render(<HomeHeroStage sceneRefs={sceneRefs} />);

    expect(screen.getByRole('region', { name: '브라우저 fallback 제목' })).toBeTruthy();
    expect(screen.queryByTestId('home-hero-stage-canvas')).toBeNull();
  });

  it('WebGL 확인 전에는 공통 페이지 로딩 문구를 가진 오버레이를 보여야 한다', () => {
    mockedUseSceneWebglAvailability.mockReturnValue(null);

    render(<HomeHeroStage sceneRefs={sceneRefs} />);

    expect(screen.getByRole('status')).toHaveTextContent('페이지 로딩 중');
  });

  it('초기 blocking 로딩이 끝난 뒤의 후속 Three.js 로드는 전체 오버레이를 다시 띄우지 않아야 한다', async () => {
    mockedUseSceneWebglAvailability.mockReturnValue(true);

    const { rerender } = render(<HomeHeroStage sceneRefs={sceneRefs} />);

    expect(screen.getByRole('status')).toBeInTheDocument();

    homeHeroStageMockState.isSceneAssetLoading = false;
    homeHeroStageMockState.isSceneReady = true;

    rerender(<HomeHeroStage sceneRefs={sceneRefs} />);

    await waitFor(() => {
      expect(screen.queryByRole('status')).toBeNull();
    });

    homeHeroStageMockState.isSceneAssetLoading = true;

    rerender(<HomeHeroStage sceneRefs={sceneRefs} />);

    expect(screen.queryByRole('status')).toBeNull();
  });
});

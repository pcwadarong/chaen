/* @vitest-environment jsdom */

import { render, screen } from '@testing-library/react';
import React from 'react';
import { vi } from 'vitest';

import { useSceneWebglAvailability } from '@/shared/lib/dom/use-scene-webgl-availability';
import { HomeHeroStage } from '@/widgets/home-hero-scene/ui/home-hero-stage';

import '@testing-library/jest-dom/vitest';

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) =>
    ({
      webglDescription: '브라우저 fallback 설명',
      webglTitle: '브라우저 fallback 제목',
    })[key] ?? key,
}));

vi.mock('next/dynamic', () => ({
  default: () => {
    const DynamicComponent = () => <div data-testid="home-hero-stage-canvas" />;

    return DynamicComponent;
  },
}));

vi.mock('@/shared/lib/dom/use-scene-webgl-availability', () => ({
  useSceneWebglAvailability: vi.fn(),
}));

const mockedUseSceneWebglAvailability = vi.mocked(useSceneWebglAvailability);

describe('HomeHeroStage', () => {
  it('WebGL을 사용할 수 있을 때, HomeHeroStage는 3D canvas를 렌더링해야 한다', () => {
    mockedUseSceneWebglAvailability.mockReturnValue(true);

    render(
      <HomeHeroStage
        blackoutOverlayRef={{ current: null }}
        triggerRef={{ current: null }}
        webUiRef={{ current: null }}
      />,
    );

    expect(screen.getByTestId('home-hero-stage-canvas')).toBeTruthy();
    expect(screen.queryByTestId('scene-browser-fallback')).toBeNull();
  });

  it('WebGL을 사용할 수 없을 때, HomeHeroStage는 브라우저 fallback을 렌더링해야 한다', () => {
    mockedUseSceneWebglAvailability.mockReturnValue(false);

    render(
      <HomeHeroStage
        blackoutOverlayRef={{ current: null }}
        triggerRef={{ current: null }}
        webUiRef={{ current: null }}
      />,
    );

    expect(screen.getByRole('region', { name: '브라우저 fallback 제목' })).toBeTruthy();
    expect(screen.queryByTestId('home-hero-stage-canvas')).toBeNull();
  });
});

// @vitest-environment node

import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { vi } from 'vitest';

import HomeLayout from '@/app/[locale]/(home)/layout';

vi.mock('@/entities/scene/ui/scene-asset-preloader', () => ({
  SceneAssetPreloader: () => <div data-testid="scene-asset-preloader" />,
}));

describe('HomeLayout', () => {
  it('3D 프리로드가 홈 페이지의 데이터 조회를 기다리지 않도록, 프리로더는 페이지가 아니라 홈 라우트 그룹 레이아웃에서 마운트되어야 한다', () => {
    const markup = renderToStaticMarkup(
      <HomeLayout>
        <div data-testid="route-children" />
      </HomeLayout>,
    );

    expect(markup).toContain('data-testid="scene-asset-preloader"');
    expect(markup).toContain('data-testid="route-children"');
  });
});

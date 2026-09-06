// @vitest-environment node

import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { vi } from 'vitest';

import RootLayout from '@/app/layout';

vi.mock('@/app/fonts', () => ({
  d2Coding: { variable: 'font-d2-coding' },
  pretendard: { variable: 'font-pretendard' },
  pretendardJp: { variable: 'font-pretendard-jp' },
}));

vi.mock('@/shared/providers', () => ({
  QueryProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock('@/entities/scene/ui/scene-asset-preloader', () => ({
  SceneAssetPreloader: () => <div data-testid="scene-asset-preloader" />,
}));

describe('RootLayout', () => {
  it('3D를 렌더하지 않는 라우트까지 GLB를 받지 않도록, 루트 레이아웃은 3D 자산 프리로더를 마운트하지 않아야 한다', () => {
    const markup = renderToStaticMarkup(
      <RootLayout>
        <div data-testid="route-children" />
      </RootLayout>,
    );

    expect(markup).toContain('data-testid="route-children"');
    expect(markup).not.toContain('data-testid="scene-asset-preloader"');
  });
});

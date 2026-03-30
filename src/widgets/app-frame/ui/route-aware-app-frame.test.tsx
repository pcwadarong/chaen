/* @vitest-environment jsdom */

import { render, screen } from '@testing-library/react';
import React from 'react';

import { RouteAwareAppFrame } from '@/widgets/app-frame/ui/route-aware-app-frame';

import '@testing-library/jest-dom/vitest';

const routeAwareAppFrameMockState = vi.hoisted(() => ({
  pathname: '/articles',
}));

vi.mock('@/i18n/navigation', () => ({
  usePathname: () => routeAwareAppFrameMockState.pathname,
}));

vi.mock('@/widgets/app-frame/ui/app-frame', () => ({
  AppFrame: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="app-frame">{children}</div>
  ),
}));

describe('RouteAwareAppFrame', () => {
  it('관리자 경로일 때, RouteAwareAppFrame은 AppFrame 없이 전체 페이지를 렌더링해야 한다', () => {
    routeAwareAppFrameMockState.pathname = '/admin/content';

    render(<RouteAwareAppFrame nav={<div>nav</div>}>content</RouteAwareAppFrame>);

    expect(screen.queryByTestId('app-frame')).not.toBeInTheDocument();
    expect(screen.getByText('nav')).toBeInTheDocument();
    expect(screen.getByText('content')).toBeInTheDocument();
  });

  it('일반 경로에서는 기존 AppFrame 안에 렌더링한다', () => {
    routeAwareAppFrameMockState.pathname = '/project';

    render(<RouteAwareAppFrame nav={<div>nav</div>}>content</RouteAwareAppFrame>);

    expect(screen.getByTestId('app-frame')).toBeTruthy();
  });
});

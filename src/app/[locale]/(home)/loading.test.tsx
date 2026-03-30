/* @vitest-environment jsdom */

import { render, screen } from '@testing-library/react';
import React from 'react';

import HomeLoading from '@/app/[locale]/(home)/loading';

describe('HomeLoading', () => {
  it('홈 라우트 loading은 scene loading shell을 렌더링해야 한다', () => {
    const { container } = render(<HomeLoading />);

    expect(screen.getByRole('status')).toBeTruthy();
    expect(screen.getByText('Loading 3D scene')).toBeTruthy();
    expect(document.querySelector('main')).toBeTruthy();
    expect(container.querySelector('[data-hide-app-frame-footer="true"]')).toBeTruthy();
    expect(container.querySelectorAll('section').length).toBe(2);
    expect(container.querySelectorAll('[role="status"]').length).toBe(0);
    expect(document.body.querySelector('[role="status"]')).toBeTruthy();
  });
});

// @vitest-environment jsdom

import { render, screen } from '@testing-library/react';
import React from 'react';

import { SceneLoadingShell } from '@/entities/scene/ui/scene-loading-shell';

import '@testing-library/jest-dom/vitest';

describe('SceneLoadingShell', () => {
  it('씬 로딩 shell은 상태 역할과 공통 dot 인디케이터를 렌더링해야 한다', () => {
    render(<SceneLoadingShell />);

    expect(screen.getByRole('status')).toHaveAttribute('aria-busy', 'true');
    expect(screen.getByRole('status')).toHaveAttribute('aria-atomic', 'true');
    expect(
      document.querySelectorAll('span[aria-hidden="true"], div[aria-hidden="true"]').length,
    ).toBeGreaterThan(0);
  });

  it('씬 로딩 shell은 스크린리더용 로딩 문구를 유지해야 한다', () => {
    render(<SceneLoadingShell />);

    expect(screen.getByRole('status')).toBeTruthy();
    expect(screen.getByText('Loading 3D scene')).toBeTruthy();
  });
});

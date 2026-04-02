/* @vitest-environment jsdom */

import { render, screen } from '@testing-library/react';
import React from 'react';
import { vi } from 'vitest';

import HomeLoading from '@/app/[locale]/(home)/loading';

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => (key === 'pageLoading' ? '페이지 로딩 중' : key),
}));

describe('HomeLoading', () => {
  it('홈 라우트 loading은 홈 씬과 같은 로딩 오버레이를 렌더링해야 한다', () => {
    render(<HomeLoading />);

    expect(document.querySelector('main')).toBeTruthy();
    expect(screen.getByRole('status')).toBeTruthy();
    expect(screen.getByText('페이지 로딩 중')).toBeTruthy();
  });
});

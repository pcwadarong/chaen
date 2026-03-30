/* @vitest-environment jsdom */

import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { vi } from 'vitest';

import { useBreakpoint } from '@/widgets/home-hero-scene/model/use-breakpoint';
import { HomeHeroInteractionHint } from '@/widgets/home-hero-scene/ui/home-hero-interaction-hint';

import '@testing-library/jest-dom/vitest';

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) =>
    ({
      closeAriaLabel: '닫기',
      stackedText: '노트북, 기타, 카메라를 눌러보고 드래그해서 장면을 둘러보세요',
      wideText: '스크롤을 내리거나 기타, 카메라를 눌러보세요',
    })[key] ?? key,
}));

vi.mock('@/widgets/home-hero-scene/model/use-breakpoint', () => ({
  useBreakpoint: vi.fn(),
}));

const mockedUseBreakpoint = vi.mocked(useBreakpoint);

describe('HomeHeroInteractionHint', () => {
  beforeEach(() => {
    window.localStorage.clear();
    mockedUseBreakpoint.mockReturnValue({
      currentBP: 4,
      sceneViewportMode: 'wide',
      viewportHeight: 900,
      viewportWidth: 1440,
    });
  });

  it('첫 방문의 wide viewport일 때, HomeHeroInteractionHint는 wide 안내 문구를 렌더링해야 한다', () => {
    render(<HomeHeroInteractionHint />);

    expect(screen.getByText('스크롤을 내리거나 기타, 카메라를 눌러보세요')).toBeTruthy();
  });

  it('stacked viewport일 때, HomeHeroInteractionHint는 stacked 안내 문구를 렌더링해야 한다', () => {
    mockedUseBreakpoint.mockReturnValue({
      currentBP: 2,
      sceneViewportMode: 'stacked',
      viewportHeight: 844,
      viewportWidth: 390,
    });

    render(<HomeHeroInteractionHint />);

    expect(
      screen.getByText('노트북, 기타, 카메라를 눌러보고 드래그해서 장면을 둘러보세요'),
    ).toBeTruthy();
  });

  it('닫기 버튼을 누르면, HomeHeroInteractionHint는 localStorage에 dismissal을 기록하고 사라져야 한다', () => {
    render(<HomeHeroInteractionHint />);

    fireEvent.click(screen.getByRole('button', { name: '닫기' }));

    expect(window.localStorage.getItem('home-hero:interaction-hint-dismissed')).toBe('true');
    expect(screen.queryByText('스크롤을 내리거나 기타, 카메라를 눌러보세요')).toBeNull();
  });
});

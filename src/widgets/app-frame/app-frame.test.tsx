import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';

import { AppFrame } from '@/widgets/app-frame/app-frame';

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

type MatchMediaMock = {
  addEventListener: ReturnType<typeof vi.fn>;
  dispatchChange: (matches: boolean) => void;
  matches: boolean;
  media: string;
  removeEventListener: ReturnType<typeof vi.fn>;
};

/**
 * `window.matchMedia`를 제어할 수 있는 테스트용 mock 객체를 생성합니다.
 */
const createMatchMediaMock = (initialMatches: boolean): MatchMediaMock => {
  let matches = initialMatches;
  const listeners = new Set<(event: MediaQueryListEvent) => void>();

  return {
    addEventListener: vi.fn(
      (_eventName: string, listener: (event: MediaQueryListEvent) => void) => {
        listeners.add(listener);
      },
    ),
    dispatchChange: (nextMatches: boolean) => {
      matches = nextMatches;
      listeners.forEach(listener =>
        listener({ matches: nextMatches, media: '(min-width: 961px)' } as MediaQueryListEvent),
      );
    },
    get matches() {
      return matches;
    },
    media: '(min-width: 961px)',
    removeEventListener: vi.fn(
      (_eventName: string, listener: (event: MediaQueryListEvent) => void) => {
        listeners.delete(listener);
      },
    ),
  };
};

describe('AppFrame', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('초기 렌더에서는 스크롤 상단 이동 버튼을 렌더링하지 않는다', () => {
    const matchMediaMock = createMatchMediaMock(false);

    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      value: vi.fn().mockImplementation(() => matchMediaMock),
    });

    render(
      <AppFrame>
        <div>content</div>
      </AppFrame>,
    );

    expect(screen.queryByRole('button', { name: 'scrollToTopAriaLabel' })).toBeNull();
  });

  it('모바일 스크롤이 threshold를 넘으면 버튼을 노출하고 window를 최상단으로 이동시킨다', async () => {
    const matchMediaMock = createMatchMediaMock(false);
    const scrollToSpy = vi.fn();

    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      value: vi.fn().mockImplementation(() => matchMediaMock),
    });
    Object.defineProperty(window, 'scrollY', {
      configurable: true,
      value: 0,
      writable: true,
    });
    Object.defineProperty(window, 'scrollTo', {
      configurable: true,
      value: scrollToSpy,
      writable: true,
    });

    render(
      <AppFrame>
        <div style={{ height: '2000px' }}>content</div>
      </AppFrame>,
    );

    Object.defineProperty(window, 'scrollY', {
      configurable: true,
      value: 280,
      writable: true,
    });
    fireEvent.scroll(window);

    const button = await screen.findByRole('button', { name: 'scrollToTopAriaLabel' });
    fireEvent.click(button);

    expect(scrollToSpy).toHaveBeenCalledWith({ behavior: 'smooth', top: 0 });
  });

  it('데스크톱에서는 내부 스크롤 viewport 기준으로 버튼을 노출한다', async () => {
    const matchMediaMock = createMatchMediaMock(true);

    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      value: vi.fn().mockImplementation(() => matchMediaMock),
    });

    render(
      <AppFrame>
        <div style={{ height: '2000px' }}>content</div>
      </AppFrame>,
    );

    const viewport = document.querySelector<HTMLElement>('[data-app-scroll-viewport="true"]');
    expect(viewport).toBeTruthy();

    Object.defineProperty(viewport as HTMLElement, 'scrollTop', {
      configurable: true,
      value: 300,
      writable: true,
    });
    fireEvent.scroll(viewport as HTMLElement);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'scrollToTopAriaLabel' })).toBeTruthy();
    });
  });

  it('데스크톱 버튼 클릭은 내부 viewport를 최상단으로 이동시킨다', async () => {
    const matchMediaMock = createMatchMediaMock(true);
    const viewportScrollToSpy = vi.fn();

    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      value: vi.fn().mockImplementation(() => matchMediaMock),
    });

    render(
      <AppFrame>
        <div style={{ height: '2000px' }}>content</div>
      </AppFrame>,
    );

    const viewport = document.querySelector<HTMLElement>('[data-app-scroll-viewport="true"]');
    expect(viewport).toBeTruthy();

    Object.defineProperty(viewport as HTMLElement, 'scrollTop', {
      configurable: true,
      value: 320,
      writable: true,
    });
    Object.defineProperty(viewport as HTMLElement, 'scrollTo', {
      configurable: true,
      value: viewportScrollToSpy,
      writable: true,
    });
    fireEvent.scroll(viewport as HTMLElement);

    const button = await screen.findByRole('button', { name: 'scrollToTopAriaLabel' });
    fireEvent.click(button);

    expect(viewportScrollToSpy).toHaveBeenCalledWith({ behavior: 'smooth', top: 0 });
  });
});

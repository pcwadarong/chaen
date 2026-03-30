/* @vitest-environment jsdom */

import { act, renderHook } from '@testing-library/react';

import { usePrefersReducedMotion } from '@/shared/lib/dom/use-prefers-reduced-motion';

type MatchMediaMockController = {
  dispatchChange: (matches: boolean) => void;
  query: string;
};

/**
 * reduced motion media query를 제어할 수 있는 matchMedia mock을 설치합니다.
 */
const installMatchMediaMock = (initialMatches: boolean): MatchMediaMockController => {
  let changeListener: ((event: MediaQueryListEvent) => void) | null = null;
  let currentMatches = initialMatches;
  const query = '(prefers-reduced-motion: reduce)';

  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    value: vi.fn().mockImplementation((media: string) => ({
      addEventListener: vi.fn(
        (eventName: string, listener: (event: MediaQueryListEvent) => void) => {
          if (media === query && eventName === 'change') {
            changeListener = listener;
          }
        },
      ),
      matches: media === query ? currentMatches : false,
      media,
      removeEventListener: vi.fn(
        (eventName: string, listener: (event: MediaQueryListEvent) => void) => {
          if (media === query && eventName === 'change' && changeListener === listener) {
            changeListener = null;
          }
        },
      ),
    })),
  });

  return {
    dispatchChange: (matches: boolean) => {
      currentMatches = matches;
      changeListener?.({
        matches,
        media: query,
      } as MediaQueryListEvent);
    },
    query,
  };
};

describe('usePrefersReducedMotion', () => {
  it('reduced motion media query가 true일 때, usePrefersReducedMotion은 true를 반환해야 한다', () => {
    const { query } = installMatchMediaMock(true);

    const { result } = renderHook(() => usePrefersReducedMotion());

    expect(window.matchMedia).toHaveBeenCalledWith(query);
    expect(result.current).toBe(true);
  });

  it('reduced motion media query 값이 바뀔 때, usePrefersReducedMotion은 상태를 갱신해야 한다', () => {
    const controller = installMatchMediaMock(false);

    const { result } = renderHook(() => usePrefersReducedMotion());

    expect(result.current).toBe(false);

    act(() => {
      controller.dispatchChange(true);
    });

    expect(result.current).toBe(true);
  });

  it('window.matchMedia를 사용할 수 없을 때, usePrefersReducedMotion은 false를 반환해야 한다', () => {
    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      value: undefined,
    });

    const { result } = renderHook(() => usePrefersReducedMotion());

    expect(result.current).toBe(false);
  });
});

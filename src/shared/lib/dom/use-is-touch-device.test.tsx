import { act, renderHook } from '@testing-library/react';

import { useIsTouchDevice } from '@/shared/lib/dom/use-is-touch-device';

type MatchMediaMockController = {
  dispatchChange: (matches: boolean) => void;
  query: string;
};

/**
 * coarse pointer media query를 제어할 수 있는 matchMedia mock을 설치합니다.
 */
const installMatchMediaMock = (initialMatches: boolean): MatchMediaMockController => {
  let changeListener: ((event: MediaQueryListEvent) => void) | null = null;
  let currentMatches = initialMatches;
  const query = '(pointer: coarse)';

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

describe('useIsTouchDevice', () => {
  it('coarse pointer media query가 true면 터치 디바이스로 판정해야 한다', () => {
    const { query } = installMatchMediaMock(true);

    const { result } = renderHook(() => useIsTouchDevice());

    expect(window.matchMedia).toHaveBeenCalledWith(query);
    expect(result.current).toBe(true);
  });

  it('coarse pointer media query change를 구독해 입력 장치 상태를 갱신해야 한다', () => {
    const controller = installMatchMediaMock(false);

    const { result } = renderHook(() => useIsTouchDevice());

    expect(result.current).toBe(false);

    act(() => {
      controller.dispatchChange(true);
    });

    expect(result.current).toBe(true);
  });

  it('matchMedia를 쓸 수 없으면 false를 반환해야 한다', () => {
    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      value: undefined,
    });

    const { result } = renderHook(() => useIsTouchDevice());

    expect(result.current).toBe(false);
  });
});

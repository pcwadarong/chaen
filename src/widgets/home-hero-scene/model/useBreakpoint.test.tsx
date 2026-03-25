import { act, renderHook } from '@testing-library/react';

import { useBreakpoint } from '@/widgets/home-hero-scene/model/useBreakpoint';

const originalInnerWidth = window.innerWidth;

/**
 * 테스트에서 viewport 너비를 바꾸고 resize 이벤트를 발생시킵니다.
 */
const resizeViewport = (width: number) => {
  Object.defineProperty(window, 'innerWidth', {
    configurable: true,
    value: width,
    writable: true,
  });

  window.dispatchEvent(new Event('resize'));
};

describe('useBreakpoint', () => {
  afterEach(() => {
    Object.defineProperty(window, 'innerWidth', {
      configurable: true,
      value: originalInnerWidth,
      writable: true,
    });
  });

  it('현재 viewport 기준 breakpoint와 sceneMode를 반환한다', () => {
    resizeViewport(768);

    const { result } = renderHook(() => useBreakpoint());

    expect(result.current).toEqual({
      currentBP: 3,
      sceneMode: 'mobile',
    });
  });

  it('resize 시 스크롤 시퀀스가 아닐 때만 breakpoint를 갱신한다', () => {
    resizeViewport(768);

    const { result } = renderHook(({ isScrolling }) => useBreakpoint({ isScrolling }), {
      initialProps: { isScrolling: false },
    });

    act(() => {
      resizeViewport(1180);
    });

    expect(result.current).toEqual({
      currentBP: 4,
      sceneMode: 'desktop',
    });
  });

  it('스크롤 시퀀스 중에는 resize를 무시하고 종료 후 현재 너비로 동기화한다', () => {
    resizeViewport(768);

    const { result, rerender } = renderHook(({ isScrolling }) => useBreakpoint({ isScrolling }), {
      initialProps: { isScrolling: true },
    });

    act(() => {
      resizeViewport(1180);
    });

    expect(result.current).toEqual({
      currentBP: 3,
      sceneMode: 'mobile',
    });

    rerender({ isScrolling: false });

    expect(result.current).toEqual({
      currentBP: 4,
      sceneMode: 'desktop',
    });
  });
});

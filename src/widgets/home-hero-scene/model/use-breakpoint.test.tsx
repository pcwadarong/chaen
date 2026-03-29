// @vitest-environment jsdom

import { act, renderHook } from '@testing-library/react';

import { useBreakpoint } from '@/widgets/home-hero-scene/model/use-breakpoint';

const originalInnerWidth = window.innerWidth;
const originalInnerHeight = window.innerHeight;

/**
 * 테스트에서 viewport 크기를 바꾸고 resize 이벤트를 발생시킵니다.
 */
const resizeViewport = ({ height, width }: { height: number; width: number }) => {
  Object.defineProperty(window, 'innerWidth', {
    configurable: true,
    value: width,
    writable: true,
  });
  Object.defineProperty(window, 'innerHeight', {
    configurable: true,
    value: height,
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
    Object.defineProperty(window, 'innerHeight', {
      configurable: true,
      value: originalInnerHeight,
      writable: true,
    });
  });

  it('세로 비율이 큰 viewport에서는 mobile scene과 breakpoint를 반환해야 한다', () => {
    resizeViewport({
      height: 1024,
      width: 768,
    });

    const { result } = renderHook(() => useBreakpoint());

    expect(result.current).toEqual({
      currentBP: 2,
      sceneMode: 'mobile',
    });
  });

  it('가로 비율이 충분한 작은 viewport에서는 desktop scene으로 전환해야 한다', () => {
    resizeViewport({
      height: 375,
      width: 812,
    });

    const { result } = renderHook(() => useBreakpoint());

    expect(result.current).toEqual({
      currentBP: 3,
      sceneMode: 'desktop',
    });
  });

  it('resize 시 스크롤 시퀀스가 아닐 때만 현재 비율 기준 scene 상태를 갱신해야 한다', () => {
    resizeViewport({
      height: 1024,
      width: 768,
    });

    const { result } = renderHook(({ isScrolling }) => useBreakpoint({ isScrolling }), {
      initialProps: { isScrolling: false },
    });

    act(() => {
      resizeViewport({
        height: 800,
        width: 1040,
      });
    });

    expect(result.current).toEqual({
      currentBP: 3,
      sceneMode: 'desktop',
    });
  });

  it('스크롤 시퀀스 중에는 resize를 무시하고 종료 후 현재 비율로 동기화해야 한다', () => {
    resizeViewport({
      height: 1024,
      width: 768,
    });

    const { result, rerender } = renderHook(({ isScrolling }) => useBreakpoint({ isScrolling }), {
      initialProps: { isScrolling: true },
    });

    act(() => {
      resizeViewport({
        height: 800,
        width: 1040,
      });
    });

    expect(result.current).toEqual({
      currentBP: 2,
      sceneMode: 'mobile',
    });

    rerender({ isScrolling: false });

    expect(result.current).toEqual({
      currentBP: 3,
      sceneMode: 'desktop',
    });
  });
});

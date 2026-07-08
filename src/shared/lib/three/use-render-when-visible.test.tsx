/* @vitest-environment jsdom */

import { render } from '@testing-library/react';
import React from 'react';
import { vi } from 'vitest';

import { RenderWhenVisible } from '@/shared/lib/three/use-render-when-visible';

const fiberMockState = vi.hoisted(() => ({
  domElement: null as HTMLCanvasElement | null,
  invalidate: vi.fn(),
  setFrameloop: vi.fn(),
}));

vi.mock('@react-three/fiber', () => ({
  useThree: (selector: (state: Record<string, unknown>) => unknown) =>
    selector({
      gl: { domElement: fiberMockState.domElement },
      invalidate: fiberMockState.invalidate,
      setFrameloop: fiberMockState.setFrameloop,
    }),
}));

type IntersectionObserverCallback = (
  entries: Array<{ isIntersecting: boolean }>,
  observer: IntersectionObserver,
) => void;

const intersectionObserverMockState = vi.hoisted(() => ({
  callback: null as IntersectionObserverCallback | null,
  disconnect: vi.fn(),
  observe: vi.fn(),
  options: undefined as IntersectionObserverInit | undefined,
}));

class MockIntersectionObserver {
  constructor(callback: IntersectionObserverCallback, options?: IntersectionObserverInit) {
    intersectionObserverMockState.callback = callback;
    intersectionObserverMockState.options = options;
  }

  disconnect = intersectionObserverMockState.disconnect;
  observe = intersectionObserverMockState.observe;
  takeRecords = vi.fn(() => []);
  unobserve = vi.fn();
}

const setDocumentVisibilityState = (value: DocumentVisibilityState) => {
  Object.defineProperty(document, 'visibilityState', {
    configurable: true,
    value,
  });
};

describe('RenderWhenVisible', () => {
  beforeEach(() => {
    fiberMockState.domElement = document.createElement('canvas');
    fiberMockState.invalidate.mockReset();
    fiberMockState.setFrameloop.mockReset();
    intersectionObserverMockState.callback = null;
    intersectionObserverMockState.options = undefined;
    intersectionObserverMockState.disconnect.mockReset();
    intersectionObserverMockState.observe.mockReset();
    vi.stubGlobal('IntersectionObserver', MockIntersectionObserver);
    setDocumentVisibilityState('visible');
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('threshold 0과 rootMargin 10%로 gl.domElement를 관찰해야 한다', () => {
    render(<RenderWhenVisible />);

    expect(intersectionObserverMockState.observe).toHaveBeenCalledWith(fiberMockState.domElement);
    expect(intersectionObserverMockState.options).toMatchObject({
      rootMargin: '10%',
      threshold: 0,
    });
  });

  it('IntersectionObserver가 비가시 상태를 보고하면 frameloop을 never로 정지해야 한다', () => {
    render(<RenderWhenVisible />);
    fiberMockState.setFrameloop.mockClear();

    intersectionObserverMockState.callback?.(
      [{ isIntersecting: false }],
      {} as IntersectionObserver,
    );

    expect(fiberMockState.setFrameloop).toHaveBeenLastCalledWith('never');
  });

  it('탭이 background로 전환되면 canvas가 보여도 frameloop을 never로 정지해야 한다', () => {
    render(<RenderWhenVisible />);
    fiberMockState.setFrameloop.mockClear();

    setDocumentVisibilityState('hidden');
    document.dispatchEvent(new Event('visibilitychange'));

    expect(fiberMockState.setFrameloop).toHaveBeenLastCalledWith('never');
  });

  it('탭만 다시 보여도 canvas가 화면 밖이면 계속 never를 유지해야 한다', () => {
    render(<RenderWhenVisible />);

    intersectionObserverMockState.callback?.(
      [{ isIntersecting: false }],
      {} as IntersectionObserver,
    );
    setDocumentVisibilityState('hidden');
    document.dispatchEvent(new Event('visibilitychange'));
    fiberMockState.setFrameloop.mockClear();

    setDocumentVisibilityState('visible');
    document.dispatchEvent(new Event('visibilitychange'));

    expect(fiberMockState.setFrameloop).toHaveBeenLastCalledWith('never');
  });

  it('두 신호가 모두 가시 상태로 돌아오면 always로 재개하고 invalidate를 1회 호출해야 한다', () => {
    render(<RenderWhenVisible />);

    intersectionObserverMockState.callback?.(
      [{ isIntersecting: false }],
      {} as IntersectionObserver,
    );
    setDocumentVisibilityState('hidden');
    document.dispatchEvent(new Event('visibilitychange'));
    fiberMockState.setFrameloop.mockClear();
    fiberMockState.invalidate.mockClear();

    setDocumentVisibilityState('visible');
    document.dispatchEvent(new Event('visibilitychange'));
    expect(fiberMockState.setFrameloop).toHaveBeenLastCalledWith('never');

    intersectionObserverMockState.callback?.(
      [{ isIntersecting: true }],
      {} as IntersectionObserver,
    );

    expect(fiberMockState.setFrameloop).toHaveBeenLastCalledWith('always');
    expect(fiberMockState.invalidate).toHaveBeenCalledTimes(1);
  });

  it('언마운트 시 observer와 visibilitychange 리스너를 정리해야 한다', () => {
    const removeEventListenerSpy = vi.spyOn(document, 'removeEventListener');
    const { unmount } = render(<RenderWhenVisible />);

    unmount();

    expect(intersectionObserverMockState.disconnect).toHaveBeenCalledOnce();
    expect(removeEventListenerSpy).toHaveBeenCalledWith('visibilitychange', expect.any(Function));
  });
});

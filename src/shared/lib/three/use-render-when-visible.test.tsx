/* @vitest-environment jsdom */

import { act, renderHook } from '@testing-library/react';
import { vi } from 'vitest';

import { useCanvasVisibilityFrameloop } from '@/shared/lib/three/use-render-when-visible';

type IntersectionObserverCallback = (
  entries: Array<{ isIntersecting: boolean }>,
  observer: IntersectionObserver,
) => void;

const intersectionObserverMockState = vi.hoisted(() => ({
  callback: null as IntersectionObserverCallback | null,
  disconnect: vi.fn(),
  observe: vi.fn(),
  observed: null as Element | null,
  options: undefined as IntersectionObserverInit | undefined,
}));

class MockIntersectionObserver {
  constructor(callback: IntersectionObserverCallback, options?: IntersectionObserverInit) {
    intersectionObserverMockState.callback = callback;
    intersectionObserverMockState.options = options;
  }

  disconnect = intersectionObserverMockState.disconnect;
  observe = (element: Element) => {
    intersectionObserverMockState.observed = element;
    intersectionObserverMockState.observe(element);
  };
  takeRecords = vi.fn(() => []);
  unobserve = vi.fn();
}

const setDocumentVisibilityState = (value: DocumentVisibilityState) => {
  Object.defineProperty(document, 'visibilityState', {
    configurable: true,
    value,
  });
};

const emitIntersection = (isIntersecting: boolean) => {
  act(() => {
    intersectionObserverMockState.callback?.([{ isIntersecting }], {} as IntersectionObserver);
  });
};

const emitVisibilityChange = (value: DocumentVisibilityState) => {
  act(() => {
    setDocumentVisibilityState(value);
    document.dispatchEvent(new Event('visibilitychange'));
  });
};

describe('useCanvasVisibilityFrameloop', () => {
  let canvas: HTMLCanvasElement;

  beforeEach(() => {
    canvas = document.createElement('canvas');
    intersectionObserverMockState.callback = null;
    intersectionObserverMockState.observed = null;
    intersectionObserverMockState.options = undefined;
    intersectionObserverMockState.disconnect.mockReset();
    intersectionObserverMockState.observe.mockReset();
    vi.stubGlobal('IntersectionObserver', MockIntersectionObserver);
    setDocumentVisibilityState('visible');
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('canvasElement가 아직 없으면 관찰하지 않고 always를 반환해야 한다', () => {
    const { result } = renderHook(() => useCanvasVisibilityFrameloop(null));

    expect(result.current).toBe('always');
    expect(intersectionObserverMockState.observe).not.toHaveBeenCalled();
  });

  it('threshold 0과 rootMargin 10%로 canvasElement를 관찰해야 한다', () => {
    renderHook(() => useCanvasVisibilityFrameloop(canvas));

    expect(intersectionObserverMockState.observed).toBe(canvas);
    expect(intersectionObserverMockState.options).toMatchObject({
      rootMargin: '10%',
      threshold: 0,
    });
  });

  it('초기값은 always이고, 캔버스가 화면 밖으로 나가면 never를 반환해야 한다', () => {
    const { result } = renderHook(() => useCanvasVisibilityFrameloop(canvas));
    expect(result.current).toBe('always');

    emitIntersection(false);

    expect(result.current).toBe('never');
  });

  it('탭이 background로 전환되면 캔버스가 보여도 never를 반환해야 한다', () => {
    const { result } = renderHook(() => useCanvasVisibilityFrameloop(canvas));
    emitIntersection(true);
    expect(result.current).toBe('always');

    emitVisibilityChange('hidden');

    expect(result.current).toBe('never');
  });

  it('탭만 다시 보여도 캔버스가 화면 밖이면 계속 never를 유지해야 한다', () => {
    const { result } = renderHook(() => useCanvasVisibilityFrameloop(canvas));

    emitIntersection(false);
    emitVisibilityChange('hidden');
    emitVisibilityChange('visible');

    expect(result.current).toBe('never');
  });

  it('두 신호가 모두 가시 상태로 돌아온 순간에만 always로 재개해야 한다', () => {
    const { result } = renderHook(() => useCanvasVisibilityFrameloop(canvas));

    emitIntersection(false);
    emitVisibilityChange('hidden');
    expect(result.current).toBe('never');

    // 탭만 먼저 돌아왔을 때는 아직 화면 밖이라 never를 유지해야 한다.
    emitVisibilityChange('visible');
    expect(result.current).toBe('never');

    emitIntersection(true);
    expect(result.current).toBe('always');
  });

  it('언마운트 시 observer와 visibilitychange 리스너를 정리해야 한다', () => {
    const removeEventListenerSpy = vi.spyOn(document, 'removeEventListener');
    const { unmount } = renderHook(() => useCanvasVisibilityFrameloop(canvas));

    unmount();

    expect(intersectionObserverMockState.disconnect).toHaveBeenCalledOnce();
    expect(removeEventListenerSpy).toHaveBeenCalledWith('visibilitychange', expect.any(Function));
  });
});

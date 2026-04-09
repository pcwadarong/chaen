import { render } from '@testing-library/react';
import React, { useRef } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { useDetailArchiveAutoLoad } from '@/widgets/detail-page/archive/model/use-detail-archive-auto-load';

type ObserverCallback = IntersectionObserverCallback;

let observerCallback: ObserverCallback | null = null;
let observerOptions: IntersectionObserverInit | null = null;

type HarnessProps = Readonly<{
  errorMessage: string | null;
  isAutoLoadEnabled: boolean;
  loadMore: () => Promise<void>;
}>;

const AutoLoadHarness = ({ errorMessage, isAutoLoadEnabled, loadMore }: HarnessProps) => {
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const viewportRef = useRef<HTMLDivElement | null>(null);

  useDetailArchiveAutoLoad({
    errorMessage,
    isAutoLoadEnabled,
    loadMore,
    sentinelRef,
    viewportRef,
  });

  return (
    <div data-testid="viewport" ref={viewportRef}>
      <div data-testid="sentinel" ref={sentinelRef} />
    </div>
  );
};

describe('useDetailArchiveAutoLoad', () => {
  beforeEach(() => {
    observerCallback = null;
    observerOptions = null;

    Object.defineProperty(globalThis, 'IntersectionObserver', {
      configurable: true,
      value: class {
        constructor(callback: ObserverCallback, options?: IntersectionObserverInit) {
          observerCallback = callback;
          observerOptions = options ?? null;
        }

        disconnect() {}

        observe() {}
      },
      writable: true,
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('viewport를 observer root로 연결하고 sentinel 교차 시 추가 로드를 호출해야 한다', () => {
    const loadMore = vi.fn().mockResolvedValue(undefined);

    const { getByTestId } = render(
      <AutoLoadHarness errorMessage={null} isAutoLoadEnabled loadMore={loadMore} />,
    );

    expect(observerOptions?.root).toBe(getByTestId('viewport'));
    expect(observerOptions?.threshold).toBe(0.25);

    observerCallback?.(
      [{ isIntersecting: true } as IntersectionObserverEntry],
      {} as IntersectionObserver,
    );

    expect(loadMore).toHaveBeenCalledTimes(1);
  });

  it('auto-load gate가 닫혀 있거나 에러가 있으면 sentinel 교차만으로는 추가 로드를 호출하지 않아야 한다', () => {
    const loadMore = vi.fn().mockResolvedValue(undefined);

    render(<AutoLoadHarness errorMessage={null} isAutoLoadEnabled={false} loadMore={loadMore} />);

    observerCallback?.(
      [{ isIntersecting: true } as IntersectionObserverEntry],
      {} as IntersectionObserver,
    );

    expect(loadMore).not.toHaveBeenCalled();

    render(<AutoLoadHarness errorMessage="load failed" isAutoLoadEnabled loadMore={loadMore} />);

    observerCallback?.(
      [{ isIntersecting: true } as IntersectionObserverEntry],
      {} as IntersectionObserver,
    );

    expect(loadMore).not.toHaveBeenCalled();
  });
});

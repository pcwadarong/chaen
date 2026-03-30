/* @vitest-environment jsdom */

import { renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { useSceneWebglAvailability } from '@/shared/lib/dom/use-scene-webgl-availability';

describe('useSceneWebglAvailability', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('WebGL context를 만들 수 있을 때, useSceneWebglAvailability는 true를 반환해야 한다', async () => {
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(((contextId: string) =>
      contextId === 'webgl2'
        ? ({
            isContextLost: () => false,
          } as unknown as RenderingContext)
        : null) as typeof HTMLCanvasElement.prototype.getContext);

    const { result } = renderHook(() => useSceneWebglAvailability());

    await waitFor(() => {
      expect(result.current).toBe(true);
    });
  });

  it('WebGL context를 만들 수 없을 때, useSceneWebglAvailability는 false를 반환해야 한다', async () => {
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);

    const { result } = renderHook(() => useSceneWebglAvailability());

    await waitFor(() => {
      expect(result.current).toBe(false);
    });
  });

  it('getContext 호출이 예외를 던질 때, useSceneWebglAvailability는 false를 반환해야 한다', async () => {
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(() => {
      throw new Error('context blocked');
    });

    const { result } = renderHook(() => useSceneWebglAvailability());

    await waitFor(() => {
      expect(result.current).toBe(false);
    });
  });
});

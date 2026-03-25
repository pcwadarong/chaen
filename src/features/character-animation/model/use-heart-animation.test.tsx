import { act, renderHook } from '@testing-library/react';
import { gsap } from 'gsap';
import { Group, Mesh, MeshStandardMaterial } from 'three';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { CharacterAnimState } from '@/entities/character/model/character-animation-state';
import { useHeartAnimation } from '@/features/character-animation/model/use-heart-animation';

vi.mock('gsap', () => ({
  gsap: {
    killTweensOf: vi.fn(),
    to: vi.fn(),
  },
}));

/**
 * 테스트용 heart mesh를 생성합니다.
 */
const createHeartMesh = () => {
  const heart = new Mesh(undefined, new MeshStandardMaterial({ opacity: 1, transparent: true }));
  heart.name = 'heart';
  return heart;
};

/**
 * 테스트용 일반 오브젝트를 생성합니다.
 */
const createObject = (name: string) => {
  const object = new Group();
  object.name = name;
  return object;
};

/**
 * gsap.to mock 반환값을 공통 모형으로 만듭니다.
 */
const createTween = () => ({
  kill: vi.fn(),
});

describe('useHeartAnimation', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.mocked(gsap.to).mockImplementation(() => createTween() as never);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('notification 진입 시 delay는 notification 진입 시점 기준으로 계산한다', () => {
    const heartMesh = createHeartMesh();
    const laptopMesh = createObject('laptop');

    const { rerender } = renderHook(
      ({ currentState }) =>
        useHeartAnimation({
          currentState,
          heartMesh,
          laptopMesh,
        }),
      {
        initialProps: {
          currentState: 'idle' as CharacterAnimState,
        },
      },
    );

    expect(heartMesh.visible).toBe(false);
    expect(laptopMesh.visible).toBe(true);

    rerender({ currentState: 'notification' });

    act(() => {
      vi.advanceTimersByTime(99);
    });

    expect(heartMesh.visible).toBe(false);

    act(() => {
      vi.advanceTimersByTime(1);
    });

    expect(heartMesh.visible).toBe(true);
    expect(gsap.to).toHaveBeenCalledTimes(3);

    rerender({ currentState: 'idle' });

    expect(heartMesh.visible).toBe(false);
    expect(heartMesh.position.x).toBe(0);
    expect(heartMesh.position.y).toBe(0);
    expect(heartMesh.rotation.y).toBe(0);
    expect(heartMesh.rotation.z).toBe(0);
  });

  it('music 상태에서는 laptop을 숨기고 다른 상태로 돌아오면 다시 보인다', () => {
    const heartMesh = createHeartMesh();
    const laptopMesh = createObject('laptop');

    const { rerender } = renderHook(
      ({ currentState }) =>
        useHeartAnimation({
          currentState,
          heartMesh,
          laptopMesh,
        }),
      {
        initialProps: {
          currentState: 'idle' as CharacterAnimState,
        },
      },
    );

    expect(laptopMesh.visible).toBe(true);

    rerender({ currentState: 'music' });
    expect(laptopMesh.visible).toBe(false);

    rerender({ currentState: 'typing' });
    expect(laptopMesh.visible).toBe(true);
  });

  it('heart 애니메이션 완료 시 visible과 위치를 원복한다', () => {
    const heartMesh = createHeartMesh();
    const laptopMesh = createObject('laptop');

    renderHook(() =>
      useHeartAnimation({
        currentState: 'notification',
        heartMesh,
        laptopMesh,
      }),
    );

    act(() => {
      vi.advanceTimersByTime(100);
    });

    const positionTweenArgs = vi.mocked(gsap.to).mock.calls[0]?.[1] as
      | { onComplete?: () => void }
      | undefined;

    expect(positionTweenArgs?.onComplete).toBeTypeOf('function');

    act(() => {
      positionTweenArgs?.onComplete?.();
    });

    expect(heartMesh.visible).toBe(false);
    expect(heartMesh.position.x).toBe(0);
    expect(heartMesh.position.y).toBe(0);
    expect(heartMesh.rotation.y).toBe(0);
    expect(heartMesh.rotation.z).toBe(0);
  });
});

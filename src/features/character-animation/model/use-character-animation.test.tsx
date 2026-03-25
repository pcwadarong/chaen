import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import type { CharacterClipDurations } from '@/entities/character/model/character-clip-durations';
import { useCharacterAnimation } from '@/features/character-animation/model/use-character-animation';

const useCharacterAutoPlayMock = vi.fn();
const useCharacterStateMock = vi.fn();

vi.mock('@/features/character-animation/model/use-character-auto-play', () => ({
  useCharacterAutoPlay: (options: unknown) => useCharacterAutoPlayMock(options),
}));

vi.mock('@/features/character-animation/model/use-character-state', () => ({
  useCharacterState: (options: unknown) => useCharacterStateMock(options),
}));

const clipDurations: CharacterClipDurations = {
  idle: 2500,
  music: 2500,
  notification: 900,
  typing: 1500,
};

describe('useCharacterAnimation', () => {
  it('상태 훅이 반환한 currentState와 transitionTo를 auto play 입력과 hook 반환값에 사용한다', () => {
    const transitionTo = vi.fn();
    const clips = [] as never[];
    const mixer = {} as never;

    useCharacterStateMock.mockReturnValue({
      currentState: 'typing',
      transitionTo,
    });

    const { result } = renderHook(() =>
      useCharacterAnimation({
        clipDurations,
        clips,
        instance: 'main',
        mixer,
      }),
    );

    expect(useCharacterStateMock).toHaveBeenCalledWith({
      clips,
      instance: 'main',
      mixer,
    });
    expect(useCharacterAutoPlayMock).toHaveBeenCalledWith({
      clipDurations,
      currentState: 'typing',
      instance: 'main',
      transitionTo,
    });
    expect(result.current).toEqual({
      currentState: 'typing',
      transitionTo,
    });
  });
});

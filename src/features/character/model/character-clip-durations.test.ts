import { AnimationClip } from 'three';
import { describe, expect, it } from 'vitest';

import {
  resolveCharacterClipDuration,
  resolveCharacterClipDurations,
} from '@/features/character/model/character-clip-durations';
import type { CharacterAnimState } from '@/features/character/model/use-character-state';

/**
 * 테스트용 캐릭터 clip을 생성합니다.
 */
const createClip = (name: CharacterAnimState, duration: number) =>
  new AnimationClip(name, duration, []);

describe('characterClipDurations', () => {
  it('상태 이름에 맞는 clip 길이를 밀리초로 변환한다', () => {
    expect(resolveCharacterClipDuration([createClip('typing', 2.5)], 'typing')).toBe(2500);
  });

  it('clip이 없거나 너무 짧으면 기본/최소 길이를 사용한다', () => {
    expect(resolveCharacterClipDuration([], 'notification')).toBe(1800);
    expect(resolveCharacterClipDuration([createClip('notification', 0.1)], 'notification')).toBe(
      300,
    );
  });

  it('상태별 duration 맵을 한 번에 계산한다', () => {
    expect(
      resolveCharacterClipDurations([
        createClip('idle', 2.5),
        createClip('typing', 1.5),
        createClip('notification', 0.9),
        createClip('music', 3),
      ]),
    ).toEqual({
      idle: 2500,
      music: 3000,
      notification: 900,
      typing: 1500,
    });
  });
});

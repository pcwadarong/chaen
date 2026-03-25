import type { AnimationClip } from 'three';

import type { CharacterAnimState } from '@/features/character/model/use-character-state';

export type CharacterClipDurations = Readonly<Record<CharacterAnimState, number>>;

const DEFAULT_CHARACTER_CLIP_DURATION_MS = 1800;
const MIN_CHARACTER_CLIP_DURATION_MS = 300;

/**
 * 캐릭터 상태 이름에 해당하는 clip 길이를 밀리초 단위로 반환합니다.
 * clip이 없더라도 상태 순환이 멈추지 않게 기본 길이를 보장합니다.
 */
export const resolveCharacterClipDuration = (
  clips: AnimationClip[],
  name: CharacterAnimState,
): number => {
  const clip = clips.find(item => item.name === name);

  if (!clip) return DEFAULT_CHARACTER_CLIP_DURATION_MS;

  return Math.max(clip.duration * 1000, MIN_CHARACTER_CLIP_DURATION_MS);
};

/**
 * 캐릭터 상태별 clip 길이를 한 번에 계산합니다.
 */
export const resolveCharacterClipDurations = (clips: AnimationClip[]): CharacterClipDurations => ({
  idle: resolveCharacterClipDuration(clips, 'idle'),
  music: resolveCharacterClipDuration(clips, 'music'),
  notification: resolveCharacterClipDuration(clips, 'notification'),
  typing: resolveCharacterClipDuration(clips, 'typing'),
});

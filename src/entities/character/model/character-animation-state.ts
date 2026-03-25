/**
 * 캐릭터 GLB에서 실제로 재생하는 애니메이션 상태 이름입니다.
 */
export type CharacterAnimState = 'idle' | 'typing' | 'notification' | 'music';

export const isLoopingCharacterAnimState = (state: CharacterAnimState): boolean =>
  state === 'idle' || state === 'music';

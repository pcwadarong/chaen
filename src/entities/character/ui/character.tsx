'use client';

import type { Group } from 'three';

type CharacterProps = Readonly<{
  object: Group;
  position: [number, number, number];
}>;

/**
 * 준비된 캐릭터 scene instance를 원하는 위치에 렌더링합니다.
 */
export const Character = ({ object, position }: CharacterProps) => (
  <primitive dispose={null} object={object} position={position} />
);

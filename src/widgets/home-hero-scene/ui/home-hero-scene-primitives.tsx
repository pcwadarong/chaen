import React from 'react';
import type { Texture } from 'three';

import { SceneProp } from '@/entities/scene/ui/scene-prop';
import { HomeHeroCharacter } from '@/widgets/home-hero-scene/ui/home-hero-character';

type HomeHeroCharacterSeatSetProps = Readonly<{
  instance: 'contact' | 'main';
  isCloseupCostumeHidden?: boolean;
  monitorScreenOpacity?: number;
  monitorScreenTexture?: Texture | null;
  position?: [number, number, number];
}>;

/** 홈 히어로와 contact scene이 공유하는 기본 조명 세트를 렌더링합니다. */
export const HomeHeroStageLights = () => (
  <>
    <ambientLight color="#f8f4ff" intensity={1.5} />
    <directionalLight castShadow color="#fff8f0" intensity={2.2} position={[1.5, 5.0, 8.0]} />
    <pointLight
      color="#fff8e8"
      decay={1.5}
      distance={15}
      intensity={4}
      position={[1.1, 1.9, 7.2]}
    />
  </>
);

/** 캐릭터와 소파로 구성된 공통 기본 세트를 렌더링합니다. */
export const HomeHeroCharacterSeatSet = ({
  instance,
  isCloseupCostumeHidden = false,
  monitorScreenOpacity = 0,
  monitorScreenTexture = null,
  position = [0, 0, 0],
}: HomeHeroCharacterSeatSetProps) => (
  <>
    <HomeHeroCharacter
      instance={instance}
      isCloseupCostumeHidden={isCloseupCostumeHidden}
      monitorScreenOpacity={monitorScreenOpacity}
      monitorScreenTexture={monitorScreenTexture}
      position={position}
    />
    <SceneProp path="/models/sofa.glb" position={[0, 0, -1]} />
  </>
);

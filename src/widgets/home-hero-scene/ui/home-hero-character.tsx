'use client';

import React, { useEffect } from 'react';

import {
  type CharacterInstanceType,
  useCharacterInstance,
} from '@/entities/character/model/use-character-instance';
import { Character } from '@/entities/character/ui/character';
import { useBlinkAnimation } from '@/features/character-animation/model/use-blink-animation';
import { useCharacterAnimation } from '@/features/character-animation/model/use-character-animation';
import { useHeartAnimation } from '@/features/character-animation/model/use-heart-animation';
import { useShapeKeyController } from '@/features/character-shape/model/use-shape-key-controller';
import { setHomeHeroCostumeVisibility } from '@/widgets/home-hero-scene/model/set-home-hero-costume-visibility';

type HomeHeroCharacterProps = Readonly<{
  isCloseupCostumeHidden?: boolean;
  instance: CharacterInstanceType;
  position: [number, number, number];
}>;

/**
 * 홈 히어로 스테이지에서 사용하는 캐릭터 조합 컴포넌트입니다.
 * entity가 준비한 scene instance 위에 animation/shape feature를 얹어 실제 연출을 완성합니다.
 */
export const HomeHeroCharacter = ({
  instance,
  isCloseupCostumeHidden = false,
  position,
}: HomeHeroCharacterProps) => {
  const { clipDurations, clips, mixer, nodeRefs, object } = useCharacterInstance({ instance });
  const { currentState } = useCharacterAnimation({
    clipDurations,
    clips,
    instance,
    mixer,
  });

  useShapeKeyController({
    browMesh: nodeRefs.brow,
    clipDurations,
    currentState,
    eyebrowMesh: nodeRefs.eyebrow,
    headMesh: nodeRefs.head,
  });
  useBlinkAnimation({
    currentState,
    eyebrowMesh: nodeRefs.eyebrow,
    headMesh: nodeRefs.head,
  });
  useHeartAnimation({
    currentState,
    heartMesh: nodeRefs.heart,
    laptopMesh: nodeRefs.laptop,
  });

  useEffect(() => {
    setHomeHeroCostumeVisibility(object, !isCloseupCostumeHidden);

    return () => {
      setHomeHeroCostumeVisibility(object, true);
    };
  }, [isCloseupCostumeHidden, object]);

  return <Character object={object} position={position} />;
};

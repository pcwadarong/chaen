'use client';

import { useGLTF, useTexture } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo } from 'react';
import { AnimationMixer, type Group, NoColorSpace, type Texture } from 'three';
import type { GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js';

import {
  CHARACTER_OUTFIT_COLOR_CONFIG,
  prepareCharacterInstance,
} from '@/entities/character/model/prepare-character-instance';
import { analyzeGLB } from '@/shared/lib/analyzeGLB';

type CharacterInstanceType = 'main' | 'contact';

type CharacterProps = Readonly<{
  instance: CharacterInstanceType;
  position: [number, number, number];
}>;

type CharacterInstanceCache = {
  contact: Group;
  contactMixer: AnimationMixer;
  lastUpdatedFrame: number | null;
  main: Group;
  mainMixer: AnimationMixer;
  outfitIdMap: Texture;
  sourceScene: Group;
};

let characterInstanceCache: CharacterInstanceCache | null = null;

const analyzedScenes = new WeakSet<Group>();

/**
 * 캐릭터 GLB를 두 인스턴스로 분리해 scene 내 원하는 위치에 렌더링합니다.
 */
export const Character = ({ instance, position }: CharacterProps) => {
  const gltf = useGLTF('/models/character.glb');
  const outfitIdMap = useTexture('/textures/outfit_map.png');
  const configuredOutfitIdMap = useMemo(() => {
    outfitIdMap.colorSpace = NoColorSpace;
    outfitIdMap.flipY = false;
    outfitIdMap.needsUpdate = true;

    return outfitIdMap;
  }, [outfitIdMap]);

  const characterCache = useMemo(
    () => getOrCreateCharacterCache(gltf.scene, configuredOutfitIdMap),
    [configuredOutfitIdMap, gltf.scene],
  );

  useEffect(() => {
    if (analyzedScenes.has(gltf.scene)) return;

    analyzeGLB(gltf as unknown as GLTF);
    analyzedScenes.add(gltf.scene);
  }, [gltf]);

  useFrame((state, delta) => {
    const currentFrame = state.gl.info.render.frame;

    if (characterCache.lastUpdatedFrame === currentFrame) return;

    characterCache.lastUpdatedFrame = currentFrame;
    characterCache.mainMixer.update(delta);
    characterCache.contactMixer.update(delta);
  });

  const object = instance === 'main' ? characterCache.main : characterCache.contact;

  return <primitive dispose={null} object={object} position={position} />;
};

/**
 * 캐릭터 두 인스턴스와 각 mixer를 모듈 스코프 캐시에 한 번만 생성해 재사용합니다.
 */
const getOrCreateCharacterCache = (scene: Group, outfitIdMap: Texture): CharacterInstanceCache => {
  if (
    characterInstanceCache?.sourceScene === scene &&
    characterInstanceCache.outfitIdMap === outfitIdMap
  ) {
    return characterInstanceCache;
  }

  const main = prepareCharacterInstance(scene, {
    outfitColors: CHARACTER_OUTFIT_COLOR_CONFIG.main,
    outfitIdMap,
  });
  const contact = prepareCharacterInstance(scene, {
    outfitColors: CHARACTER_OUTFIT_COLOR_CONFIG.contact,
    outfitIdMap,
  });

  characterInstanceCache = {
    contact,
    contactMixer: new AnimationMixer(contact),
    lastUpdatedFrame: null,
    main,
    mainMixer: new AnimationMixer(main),
    outfitIdMap,
    sourceScene: scene,
  };

  return characterInstanceCache;
};

'use client';

import { useGLTF } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo } from 'react';
import { AnimationMixer, type Group, type Mesh, type Object3D } from 'three';
import type { GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js';

import {
  CHARACTER_OUTFIT_COLOR_CONFIG,
  prepareCharacterInstance,
} from '@/entities/character/model/prepare-character-instance';
import { useBlinkAnimation } from '@/features/character/model/use-blink-animation';
import { useCharacterAutoPlay } from '@/features/character/model/use-character-auto-play';
import {
  applyCharacterMaterials,
  type CharacterOrmTextures,
  useCharacterMaterials,
} from '@/features/character/model/use-character-materials';
import { useCharacterState } from '@/features/character/model/use-character-state';
import { useHeartAnimation } from '@/features/character/model/use-heart-animation';
import { useShapeKeyController } from '@/features/character/model/use-shape-key-controller';
import { analyzeGLB } from '@/shared/lib/analyzeGLB';
import { isMeshNode } from '@/shared/lib/three/orm-material';

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
  sourceScene: Group;
};

let characterInstanceCache: CharacterInstanceCache | null = null;

const analyzedScenes = new WeakSet<Group>();

type CharacterNodeRefs = Readonly<{
  brow: Mesh | null;
  eyebrow: Mesh | null;
  head: Mesh | null;
  heart: Object3D | null;
  laptop: Object3D | null;
}>;

/**
 * 캐릭터 GLB를 두 인스턴스로 분리해 scene 내 원하는 위치에 렌더링합니다.
 */
export const Character = ({ instance, position }: CharacterProps) => {
  const gltf = useGLTF('/models/character.glb');
  const ormTextures = useCharacterMaterials();
  const characterCache = useMemo(
    () => getOrCreateCharacterCache(gltf.scene, ormTextures),
    [gltf.scene, ormTextures],
  );
  const mixer = instance === 'main' ? characterCache.mainMixer : characterCache.contactMixer;
  const object = instance === 'main' ? characterCache.main : characterCache.contact;
  const nodeRefs = useMemo(() => findCharacterNodeRefs(object), [object]);
  const { currentState, transitionTo } = useCharacterState({
    clips: gltf.animations,
    instance,
    mixer,
  });

  useCharacterAutoPlay({
    clips: gltf.animations,
    currentState,
    instance,
    transitionTo,
  });
  useShapeKeyController({
    browMesh: nodeRefs.brow,
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
    mixer,
  });

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

  return <primitive dispose={null} object={object} position={position} />;
};

/**
 * 캐릭터 두 인스턴스와 각 mixer를 모듈 스코프 캐시에 한 번만 생성해 재사용합니다.
 */
const getOrCreateCharacterCache = (
  scene: Group,
  ormTextures: CharacterOrmTextures,
): CharacterInstanceCache => {
  if (characterInstanceCache?.sourceScene === scene) {
    return characterInstanceCache;
  }

  const main = prepareCharacterInstance(scene, {
    instance: 'main',
    outfitColors: CHARACTER_OUTFIT_COLOR_CONFIG.main,
  });
  const contact = prepareCharacterInstance(scene, {
    instance: 'contact',
    outfitColors: CHARACTER_OUTFIT_COLOR_CONFIG.contact,
  });

  applyCharacterMaterials(main, ormTextures);
  applyCharacterMaterials(contact, ormTextures);

  characterInstanceCache = {
    contact,
    contactMixer: new AnimationMixer(contact),
    lastUpdatedFrame: null,
    main,
    mainMixer: new AnimationMixer(main),
    sourceScene: scene,
  };

  return characterInstanceCache;
};

/**
 * 캐릭터 clone에서 상태 재생과 표정 제어에 필요한 node 참조를 이름 기준으로 수집합니다.
 */
const findCharacterNodeRefs = (scene: Group): CharacterNodeRefs => {
  let brow: Mesh | null = null;
  let eyebrow: Mesh | null = null;
  let head: Mesh | null = null;
  let heart: Object3D | null = null;
  let laptop: Object3D | null = null;

  scene.traverse(node => {
    if (node.name === 'heart') {
      heart = node;
      return;
    }

    if (node.name === 'laptop') {
      laptop = node;
      return;
    }

    if (!isMeshNode(node)) return;

    if (node.name === 'brows') {
      brow = node;
      return;
    }

    if (node.name === 'eyebrow') {
      eyebrow = node;
      return;
    }

    if (node.name === 'head' || node.name === 'face') {
      head = node;
    }
  });

  return {
    brow,
    eyebrow,
    head,
    heart,
    laptop,
  };
};

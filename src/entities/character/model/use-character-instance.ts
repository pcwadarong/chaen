'use client';

import { useGLTF } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo } from 'react';
import { type AnimationClip, AnimationMixer, type Group, type Mesh, type Object3D } from 'three';
import type { GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js';

import {
  applyCharacterMaterials,
  type CharacterOrmTextures,
  useCharacterMaterials,
} from '@/entities/character/lib/use-character-materials';
import { CHARACTER_OUTFIT_COLOR_CONFIG } from '@/entities/character/model/character-appearance-config';
import {
  type CharacterClipDurations,
  resolveCharacterClipDurations,
} from '@/entities/character/model/character-clip-durations';
import { prepareCharacterInstance } from '@/entities/character/model/prepare-character-instance';
import { analyzeGLB } from '@/shared/lib/analyzeGLB';
import { isMeshNode } from '@/shared/lib/three/orm-material';

export type CharacterInstanceType = 'main' | 'contact';

export type CharacterNodeRefs = Readonly<{
  brow: Mesh | null;
  eyebrow: Mesh | null;
  head: Mesh | null;
  heart: Object3D | null;
  laptop: Object3D | null;
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

/**
 * 캐릭터 GLB를 entity 레이어에서 로드하고, 인스턴스/재질/mixer/node 참조를 준비합니다.
 * animation 전환과 shape key 같은 사용자 경험 조합은 상위 feature 또는 widget에서 담당합니다.
 */
export const useCharacterInstance = ({
  instance,
}: Readonly<{
  instance: CharacterInstanceType;
}>): {
  clips: AnimationClip[];
  clipDurations: CharacterClipDurations;
  mixer: AnimationMixer;
  nodeRefs: CharacterNodeRefs;
  object: Group;
} => {
  const gltf = useGLTF('/models/character.glb');
  const ormTextures = useCharacterMaterials();
  const characterCache = useMemo(
    () => getOrCreateCharacterCache(gltf.scene, ormTextures),
    [gltf.scene, ormTextures],
  );
  const mixer = instance === 'main' ? characterCache.mainMixer : characterCache.contactMixer;
  const object = instance === 'main' ? characterCache.main : characterCache.contact;
  const nodeRefs = useMemo(() => findCharacterNodeRefs(object), [object]);
  const clipDurations = useMemo(
    () => resolveCharacterClipDurations(gltf.animations),
    [gltf.animations],
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

  return {
    clips: gltf.animations,
    clipDurations,
    mixer,
    nodeRefs,
    object,
  };
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

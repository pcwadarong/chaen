'use client';

import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo } from 'react';
import { type AnimationClip, AnimationMixer, type Group, type Mesh, type Object3D } from 'three';

import { analyzeCharacterGltf } from '@/entities/character/lib/analyze-character-gltf';
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
import { CHARACTER_MODEL_PATH } from '@/entities/scene/model/preloadGLB';
import { useSceneGltf } from '@/entities/scene/model/use-scene-gltf';
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
  main: Group;
  mainMixer: AnimationMixer;
  sourceScene: Group;
};

/**
 * frameloop가 'never'에서 재개될 때 delta가 크게 튀어 애니메이션이 순간이동하는 것을 막는 상한입니다.
 */
const MIXER_MAX_DELTA_SECONDS = 1 / 30;

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
  const gltf = useSceneGltf(CHARACTER_MODEL_PATH);
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

    analyzeCharacterGltf(gltf);
    analyzedScenes.add(gltf.scene);
  }, [gltf]);

  // 이 훅은 캔버스마다 한 번씩 호출되고 그 캔버스의 rAF에서만 실행되므로, 자기 인스턴스의 mixer만 진행시킨다.
  // 두 캔버스를 아우르는 프레임 가드를 두지 않는 이유는 `gl.info.render.frame`이 렌더러별 카운터이기 때문이다.
  useFrame((_, delta) => {
    mixer.update(Math.min(delta, MIXER_MAX_DELTA_SECONDS));
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

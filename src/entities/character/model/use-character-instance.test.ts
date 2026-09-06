import { renderHook } from '@testing-library/react';
import { type AnimationMixer, Group } from 'three';
import { vi } from 'vitest';

import {
  type CharacterInstanceType,
  useCharacterInstance,
} from '@/entities/character/model/use-character-instance';

type FrameState = Readonly<{ gl: { info: { render: { frame: number } } } }>;
type FrameCallback = (state: FrameState, delta: number) => void;

const fiberMockState = vi.hoisted(() => ({
  frameCallbacks: [] as FrameCallback[],
}));

vi.mock('@react-three/fiber', () => ({
  useFrame: (callback: FrameCallback) => {
    fiberMockState.frameCallbacks.push(callback);
  },
}));

const gltfMockState = vi.hoisted(() => ({
  gltf: { animations: [], scene: null as unknown as Group },
  ormTextures: {},
}));

// 캐릭터 GLB는 `useSceneGltf`를 통해서만 열린다. 이 모듈은 import 시점에 drei의 draco 경로를 세팅하고
// 호출 시점에 실제 WebGLRenderer에서 KTX2Loader를 만들므로, drei를 흉내 내지 않고 이 경계를 통째로 대체한다.
vi.mock('@/entities/scene/model/use-scene-gltf', () => ({
  useSceneGltf: () => gltfMockState.gltf,
}));

vi.mock('@/entities/character/lib/use-character-materials', () => ({
  applyCharacterMaterials: vi.fn(),
  useCharacterMaterials: () => gltfMockState.ormTextures,
}));

vi.mock('@/entities/character/lib/analyze-character-gltf', () => ({
  analyzeCharacterGltf: vi.fn(),
}));

const HERO_DELTA = 1 / 60;
const CONTACT_DELTA = 1 / 40;
const FRAME_COUNT = 60;
const MIXER_DELTA_CEILING = 1 / 30;

/**
 * 캔버스 하나가 마운트된 상태를 흉내 내고, 그 캔버스의 useFrame 콜백과 믹서를 돌려줍니다.
 */
const mountCanvas = (instance: CharacterInstanceType) => {
  fiberMockState.frameCallbacks = [];

  const rendered = renderHook(() => useCharacterInstance({ instance }));
  const onFrame = fiberMockState.frameCallbacks.at(-1);

  if (!onFrame) throw new Error('useFrame 콜백이 등록되지 않았습니다.');

  return {
    mixer: rendered.result.current.mixer,
    onFrame,
    unmount: rendered.unmount,
  };
};

/**
 * 자기 렌더러의 프레임 카운터를 독립적으로 증가시키는 rAF 루프를 만듭니다.
 */
const createRendererLoop = (onFrame: FrameCallback, startFrame: number) => {
  let frame = startFrame;

  return (delta: number) => {
    frame += 1;
    onFrame({ gl: { info: { render: { frame } } } }, delta);
  };
};

/**
 * 믹서가 이번 구간에서 실제로 진행한 시간을 재기 위한 측정 헬퍼입니다.
 */
const measureAdvance = (mixer: AnimationMixer, run: () => void): number => {
  const before = mixer.time;

  run();

  return mixer.time - before;
};

describe('useCharacterInstance 믹서 프레임 갱신', () => {
  beforeEach(() => {
    gltfMockState.gltf = { animations: [], scene: new Group() };
    fiberMockState.frameCallbacks = [];
  });

  it('hero와 contact 두 캔버스가 각자의 렌더러 프레임을 진행할 때, 각 믹서는 자기 캔버스의 delta로 rAF당 정확히 한 번만 진행해야 한다', () => {
    const main = mountCanvas('main');
    const contact = mountCanvas('contact');
    // contact 캔버스는 dynamic import로 늦게 마운트되므로 두 렌더러의 프레임 카운터는 어긋나 있다.
    const heroLoop = createRendererLoop(main.onFrame, 1200);
    const contactLoop = createRendererLoop(contact.onFrame, 0);

    let mainAdvance = 0;
    const contactAdvance = measureAdvance(contact.mixer, () => {
      mainAdvance = measureAdvance(main.mixer, () => {
        for (let tick = 0; tick < FRAME_COUNT; tick += 1) {
          heroLoop(HERO_DELTA);
          contactLoop(CONTACT_DELTA);
        }
      });
    });

    expect(mainAdvance).toBeCloseTo(FRAME_COUNT * HERO_DELTA, 5);
    expect(contactAdvance).toBeCloseTo(FRAME_COUNT * CONTACT_DELTA, 5);
  });

  it('두 렌더러의 프레임 카운터가 우연히 같은 값일 때에도, 각 믹서는 갱신이 드롭되지 않고 자기 delta로 진행해야 한다', () => {
    const main = mountCanvas('main');
    const contact = mountCanvas('contact');
    const heroLoop = createRendererLoop(main.onFrame, 0);
    const contactLoop = createRendererLoop(contact.onFrame, 0);

    let mainAdvance = 0;
    const contactAdvance = measureAdvance(contact.mixer, () => {
      mainAdvance = measureAdvance(main.mixer, () => {
        for (let tick = 0; tick < FRAME_COUNT; tick += 1) {
          heroLoop(HERO_DELTA);
          contactLoop(CONTACT_DELTA);
        }
      });
    });

    expect(mainAdvance).toBeCloseTo(FRAME_COUNT * HERO_DELTA, 5);
    expect(contactAdvance).toBeCloseTo(FRAME_COUNT * CONTACT_DELTA, 5);
  });

  it('좁은 뷰포트라 contact 캔버스가 마운트되지 않은 동안, hero 캔버스의 프레임 진행은 contact 믹서를 건드리지 않아야 한다', () => {
    const contact = mountCanvas('contact');

    contact.unmount();

    const main = mountCanvas('main');
    const heroLoop = createRendererLoop(main.onFrame, 0);

    const contactAdvance = measureAdvance(contact.mixer, () => {
      for (let tick = 0; tick < FRAME_COUNT; tick += 1) {
        heroLoop(HERO_DELTA);
      }
    });

    expect(contactAdvance).toBe(0);
  });

  it('frameloop가 재개되어 delta가 크게 튈 때, 믹서 진행량은 1/30초로 제한되어야 한다', () => {
    const main = mountCanvas('main');
    const heroLoop = createRendererLoop(main.onFrame, 0);

    const mainAdvance = measureAdvance(main.mixer, () => {
      heroLoop(5);
    });

    expect(mainAdvance).toBeCloseTo(MIXER_DELTA_CEILING, 5);
  });
});

describe('useCharacterInstance 모듈 스코프 캐시', () => {
  // 캐시 키는 `sourceScene` 객체 동일성이다. drei useGLTF 캐시가 URL 단위로 scene 객체를 유지하므로
  // 라우트 이동 후 client-side 복귀에서도 같은 scene이 돌아오고, 인스턴스/mixer를 재생성하지 않아야 한다.
  it('같은 sourceScene으로 재마운트하면 캐릭터 인스턴스와 mixer를 그대로 재사용해야 한다', () => {
    const scene = new Group();
    gltfMockState.gltf = { animations: [], scene };

    const first = renderHook(() => useCharacterInstance({ instance: 'main' }));
    const firstObject = first.result.current.object;
    const firstMixer = first.result.current.mixer;
    // 홈 → 다른 라우트로 이동해 캔버스가 언마운트돼도 drei useGLTF 캐시는 비워지지 않는다.
    first.unmount();

    const second = renderHook(() => useCharacterInstance({ instance: 'main' }));

    expect(second.result.current.object).toBe(firstObject);
    expect(second.result.current.mixer).toBe(firstMixer);
  });

  it('sourceScene 객체가 달라지면(.vN 경로 변경·useGLTF.clear 상당) 인스턴스와 mixer를 새로 생성해야 한다', () => {
    gltfMockState.gltf = { animations: [], scene: new Group() };
    const first = renderHook(() => useCharacterInstance({ instance: 'main' }));
    const firstObject = first.result.current.object;
    const firstMixer = first.result.current.mixer;

    gltfMockState.gltf = { animations: [], scene: new Group() };
    const second = renderHook(() => useCharacterInstance({ instance: 'main' }));

    expect(second.result.current.object).not.toBe(firstObject);
    expect(second.result.current.mixer).not.toBe(firstMixer);
  });
});

import { act, renderHook } from '@testing-library/react';
import { Object3D } from 'three';

import { useRaycaster } from '@/features/interaction/model/useRaycaster';

const useIsTouchDeviceMock = vi.fn();

type TraversableSceneNode = {
  children?: TraversableSceneNode[];
};

const raycasterMockState = vi.hoisted(() => {
  const scene = {
    children: [] as TraversableSceneNode[],
    traverse(callback: (obj: TraversableSceneNode) => void) {
      callback(scene);
      const visit = (obj: TraversableSceneNode) => {
        if (Array.isArray(obj.children)) {
          for (const child of obj.children) {
            callback(child);
            visit(child);
          }
        }
      };

      for (const child of scene.children) {
        callback(child);
        visit(child);
      }
    },
  };

  return {
    camera: { kind: 'camera' },
    raycaster: {
      intersectObjects: vi.fn(),
      setFromCamera: vi.fn(),
    },
    scene,
  };
});

vi.mock('@react-three/fiber', () => ({
  useThree: () => ({
    camera: raycasterMockState.camera,
    raycaster: raycasterMockState.raycaster,
    scene: raycasterMockState.scene,
  }),
}));

vi.mock('@/shared/lib/dom/use-is-touch-device', () => ({
  useIsTouchDevice: () => useIsTouchDeviceMock(),
}));

/**
 * 테스트용 canvas target을 생성하고 고정된 bounding rect를 주입합니다.
 */
const createCanvasTarget = (): HTMLCanvasElement => {
  const canvas = document.createElement('canvas');

  vi.spyOn(canvas, 'getBoundingClientRect').mockReturnValue({
    bottom: 130,
    height: 100,
    left: 50,
    right: 250,
    toJSON: () => undefined,
    top: 30,
    width: 200,
    x: 50,
    y: 30,
  });

  return canvas;
};

/**
 * 테스트에서 필요한 최소 PointerEvent 모양만 만들어 전달합니다.
 */
const createPointerEvent = ({
  clientX,
  clientY,
  target,
  type,
}: {
  clientX: number;
  clientY: number;
  target: Element;
  type: 'pointerdown' | 'pointermove' | 'pointerup';
}) =>
  ({
    clientX,
    clientY,
    currentTarget: target,
    target,
    type,
  }) as unknown as PointerEvent;

describe('useRaycaster', () => {
  beforeEach(() => {
    useIsTouchDeviceMock.mockReturnValue(false);
    raycasterMockState.scene.children = [];
    raycasterMockState.raycaster.intersectObjects.mockReset();
    raycasterMockState.raycaster.setFromCamera.mockReset();
    raycasterMockState.raycaster.intersectObjects.mockReturnValue([]);
  });

  it('데스크톱 pointermove가 비대화형 자식 mesh를 가리키면 조상 interactive mesh로 승격되어야 한다', () => {
    const laptopMesh = new Object3D();
    laptopMesh.name = 'laptop';
    const laptopScreenMesh = new Object3D();
    laptopScreenMesh.name = 'laptop_screen';
    laptopMesh.add(laptopScreenMesh);
    raycasterMockState.scene.children = [laptopMesh];
    raycasterMockState.raycaster.intersectObjects.mockReturnValue([
      {
        object: laptopScreenMesh,
      },
    ]);

    const { result } = renderHook(() => useRaycaster({}));

    act(() => {
      result.current.onPointerMove(
        createPointerEvent({
          clientX: 150,
          clientY: 80,
          target: createCanvasTarget(),
          type: 'pointermove',
        }),
      );
    });

    expect(raycasterMockState.raycaster.setFromCamera).toHaveBeenCalledWith(
      expect.anything(),
      raycasterMockState.camera,
    );
    expect(raycasterMockState.raycaster.setFromCamera.mock.calls[0]?.[0]).toMatchObject({
      x: 0,
      y: -0,
    });
    expect(result.current.hoveredMesh).toBe(laptopMesh);
  });

  it('데스크톱 pointermove가 interactive가 아닌 mesh를 가리키면 hoveredMesh는 null이어야 한다', () => {
    const laptopMesh = new Object3D();
    laptopMesh.name = 'laptop';
    const otherMesh = new Object3D();
    otherMesh.name = 'other';
    raycasterMockState.scene.children = [laptopMesh, otherMesh];

    const { result } = renderHook(() => useRaycaster({}));

    raycasterMockState.raycaster.intersectObjects.mockReturnValue([
      {
        object: laptopMesh,
      },
    ]);

    act(() => {
      result.current.onPointerMove(
        createPointerEvent({
          clientX: 120,
          clientY: 70,
          target: createCanvasTarget(),
          type: 'pointermove',
        }),
      );
    });

    expect(result.current.hoveredMesh).toBe(laptopMesh);

    raycasterMockState.raycaster.intersectObjects.mockReturnValue([
      {
        object: otherMesh,
      },
    ]);

    act(() => {
      result.current.onPointerMove(
        createPointerEvent({
          clientX: 130,
          clientY: 72,
          target: createCanvasTarget(),
          type: 'pointermove',
        }),
      );
    });

    expect(result.current.hoveredMesh).toBeNull();
  });

  it('같은 interactive mesh에서 pointerdown 뒤 5px 미만으로 pointerup 되면 onMeshClick이 호출되어야 한다', () => {
    const cameraMesh = new Object3D();
    cameraMesh.name = 'camera';
    const onMeshClick = vi.fn();
    raycasterMockState.scene.children = [cameraMesh];
    raycasterMockState.raycaster.intersectObjects.mockReturnValue([
      {
        object: cameraMesh,
      },
    ]);

    const { result } = renderHook(() =>
      useRaycaster({
        onMeshClick,
      }),
    );

    act(() => {
      result.current.onPointerClick(
        createPointerEvent({
          clientX: 100,
          clientY: 60,
          target: createCanvasTarget(),
          type: 'pointerdown',
        }),
      );
      result.current.onPointerClick(
        createPointerEvent({
          clientX: 103,
          clientY: 63,
          target: createCanvasTarget(),
          type: 'pointerup',
        }),
      );
    });

    expect(onMeshClick).toHaveBeenCalledWith(cameraMesh);
    expect(onMeshClick).toHaveBeenCalledTimes(1);
  });

  it('bass 계열 자식 mesh를 가리키면 hoveredMesh는 실제로 교차한 줄 mesh여야 한다', () => {
    const bassBodyMesh = new Object3D();
    bassBodyMesh.name = 'bass_body';
    const lineMesh = new Object3D();
    lineMesh.name = 'line1';
    bassBodyMesh.add(lineMesh);
    raycasterMockState.scene.children = [bassBodyMesh];
    raycasterMockState.raycaster.intersectObjects.mockReturnValue([
      {
        object: lineMesh,
      },
    ]);

    const { result } = renderHook(() => useRaycaster({}));

    act(() => {
      result.current.onPointerMove(
        createPointerEvent({
          clientX: 140,
          clientY: 76,
          target: createCanvasTarget(),
          type: 'pointermove',
        }),
      );
    });

    expect(result.current.hoveredMesh).toBe(lineMesh);
  });

  it('pointer 이동량이 5px 이상이면 onMeshClick은 호출되지 않아야 한다', () => {
    const cameraMesh = new Object3D();
    cameraMesh.name = 'camera';
    const onMeshClick = vi.fn();
    raycasterMockState.scene.children = [cameraMesh];
    raycasterMockState.raycaster.intersectObjects.mockReturnValue([
      {
        object: cameraMesh,
      },
    ]);

    const { result } = renderHook(() =>
      useRaycaster({
        onMeshClick,
      }),
    );

    act(() => {
      result.current.onPointerClick(
        createPointerEvent({
          clientX: 100,
          clientY: 60,
          target: createCanvasTarget(),
          type: 'pointerdown',
        }),
      );
      result.current.onPointerClick(
        createPointerEvent({
          clientX: 106,
          clientY: 60,
          target: createCanvasTarget(),
          type: 'pointerup',
        }),
      );
    });

    expect(onMeshClick).not.toHaveBeenCalled();
  });

  it('coarse pointer 디바이스에서는 pointermove hover를 무시하고 pointerdown/pointerup 클릭만 처리해야 한다', () => {
    useIsTouchDeviceMock.mockReturnValue(true);
    const laptopMesh = new Object3D();
    laptopMesh.name = 'laptop';
    const onMeshClick = vi.fn();
    raycasterMockState.scene.children = [laptopMesh];
    raycasterMockState.raycaster.intersectObjects.mockReturnValue([
      {
        object: laptopMesh,
      },
    ]);

    const { result } = renderHook(() =>
      useRaycaster({
        onMeshClick,
      }),
    );

    act(() => {
      result.current.onPointerMove(
        createPointerEvent({
          clientX: 120,
          clientY: 70,
          target: createCanvasTarget(),
          type: 'pointermove',
        }),
      );
    });

    expect(raycasterMockState.raycaster.setFromCamera).not.toHaveBeenCalled();
    expect(result.current.hoveredMesh).toBeNull();

    act(() => {
      result.current.onPointerClick(
        createPointerEvent({
          clientX: 100,
          clientY: 60,
          target: createCanvasTarget(),
          type: 'pointerdown',
        }),
      );
      result.current.onPointerClick(
        createPointerEvent({
          clientX: 101,
          clientY: 62,
          target: createCanvasTarget(),
          type: 'pointerup',
        }),
      );
    });

    expect(onMeshClick).toHaveBeenCalledWith(laptopMesh);
    expect(result.current.hoveredMesh).toBeNull();
  });
});

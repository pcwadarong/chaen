'use client';

import { useThree } from '@react-three/fiber';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Object3D } from 'three';
import { Vector2 } from 'three';

import { useIsTouchDevice } from '@/shared/lib/dom/use-is-touch-device';

export const INTERACTIVE_MESH_NAMES = [
  'laptop',
  'bass_body',
  'camera',
  'camera_button',
  'camera_lens',
  'camera_lens_inner',
  'camera_lens_outer',
  'camera_mirror',
  'camera_screen',
  'frame',
] as const;

type InteractiveMeshName = (typeof INTERACTIVE_MESH_NAMES)[number];

type UseRaycasterOptions = Readonly<{
  onMeshClick?: (mesh: Object3D) => void;
}>;

type PointerPosition = Readonly<{
  x: number;
  y: number;
}>;

const INTERACTIVE_MESH_NAME_SET = new Set<string>(INTERACTIVE_MESH_NAMES);
const CLICK_DELTA_THRESHOLD = 5;

/**
 * 홈 씬에서 상호작용 가능한 mesh hover/click 판정을 관리합니다.
 * 실제 입력 장치 기준으로 hover/click 판정을 분기합니다.
 * coarse pointer 환경은 hover 없이 pointerdown/up 클릭만 처리합니다.
 */
export const useRaycaster = ({
  onMeshClick,
}: UseRaycasterOptions): {
  hoveredMesh: Object3D | null;
  onPointerClick: (event: PointerEvent) => void;
  onPointerMove: (event: PointerEvent) => void;
} => {
  const { camera, raycaster, scene } = useThree();
  const isTouchDevice = useIsTouchDevice();
  const pointer = useMemo(() => new Vector2(), []);
  const pressedMeshRef = useRef<Object3D | null>(null);
  const pressedPointerRef = useRef<PointerPosition | null>(null);
  const [hoveredMesh, setHoveredMesh] = useState<Object3D | null>(null);

  useEffect(() => {
    if (isTouchDevice) setHoveredMesh(null);
  }, [isTouchDevice]);

  /**
   * 전달된 포인터 이벤트 위치에서 첫 번째 interactive mesh를 찾습니다.
   */
  const resolveInteractiveMesh = useCallback(
    (event: PointerEvent): Object3D | null => {
      const targetElement = resolvePointerTargetElement(event);

      if (!targetElement) return null;

      const normalizedPointer = resolveNormalizedPointer({
        event,
        pointer,
        targetElement,
      });

      if (!normalizedPointer) return null;

      raycaster.setFromCamera(normalizedPointer, camera);

      const intersections = raycaster.intersectObjects(scene.children, true);

      return findFirstInteractiveMesh(intersections);
    },
    [camera, pointer, raycaster, scene],
  );

  /**
   * hover 가능한 입력 장치에서만 interactive mesh를 다시 계산합니다.
   */
  const onPointerMove = useCallback(
    (event: PointerEvent) => {
      if (isTouchDevice) return;

      setHoveredMesh(resolveInteractiveMesh(event));
    },
    [isTouchDevice, resolveInteractiveMesh],
  );

  /**
   * pointerdown/up 쌍의 이동량을 비교해 클릭으로 인정될 때만 mesh action을 호출합니다.
   */
  const onPointerClick = useCallback(
    (event: PointerEvent) => {
      if (event.type === 'pointerdown') {
        pressedPointerRef.current = {
          x: event.clientX,
          y: event.clientY,
        };
        pressedMeshRef.current = resolveInteractiveMesh(event);

        return;
      }

      if (event.type !== 'pointerup') return;

      const releasedMesh = resolveInteractiveMesh(event);
      const pressedPointer = pressedPointerRef.current;
      const pressedMesh = pressedMeshRef.current;

      pressedPointerRef.current = null;
      pressedMeshRef.current = null;

      if (!pressedPointer || !releasedMesh || !pressedMesh) return;
      if (releasedMesh !== pressedMesh) return;
      if (!isClickDeltaWithinThreshold(pressedPointer, event, CLICK_DELTA_THRESHOLD)) return;

      onMeshClick?.(releasedMesh);
    },
    [onMeshClick, resolveInteractiveMesh],
  );

  return {
    hoveredMesh,
    onPointerClick,
    onPointerMove,
  };
};

/**
 * pointer event에서 raycast 기준 element를 찾습니다.
 */
const resolvePointerTargetElement = (event: PointerEvent): Element | null => {
  if (event.currentTarget instanceof Element) return event.currentTarget;
  if (event.target instanceof Element) return event.target;

  return null;
};

/**
 * 포인터 좌표를 raycaster가 사용하는 NDC 좌표계로 변환합니다.
 */
const resolveNormalizedPointer = ({
  event,
  pointer,
  targetElement,
}: {
  event: PointerEvent;
  pointer: Vector2;
  targetElement: Element;
}): Vector2 | null => {
  const rect = targetElement.getBoundingClientRect();

  if (rect.width <= 0 || rect.height <= 0) return null;

  pointer.set(
    ((event.clientX - rect.left) / rect.width) * 2 - 1,
    -(((event.clientY - rect.top) / rect.height) * 2 - 1),
  );

  return pointer;
};

/**
 * raycast 결과에서 interactive 이름을 가진 가장 가까운 조상을 찾아 반환합니다.
 */
const findFirstInteractiveMesh = (intersections: Array<{ object: Object3D }>): Object3D | null => {
  for (const intersection of intersections) {
    const interactiveMesh = resolveInteractiveAncestor(intersection.object);

    if (interactiveMesh) return interactiveMesh;
  }

  return null;
};

/**
 * 현재 object에서 부모 방향으로 올라가며 interactive mesh 이름을 찾습니다.
 */
const resolveInteractiveAncestor = (object: Object3D | null): Object3D | null => {
  let currentObject = object;

  while (currentObject) {
    if (isInteractiveMeshName(currentObject.name)) {
      return currentObject;
    }

    currentObject = currentObject.parent;
  }

  return null;
};

/**
 * 포인터 down/up 이동량이 클릭 허용 범위 안에 있는지 계산합니다.
 */
const isClickDeltaWithinThreshold = (
  pressedPointer: PointerPosition,
  event: PointerEvent,
  threshold: number,
): boolean => {
  const deltaX = event.clientX - pressedPointer.x;
  const deltaY = event.clientY - pressedPointer.y;

  return Math.hypot(deltaX, deltaY) < threshold;
};

/**
 * 문자열이 interactive mesh 이름 집합에 포함되는지 판별합니다.
 */
const isInteractiveMeshName = (name: string): name is InteractiveMeshName =>
  INTERACTIVE_MESH_NAME_SET.has(name);

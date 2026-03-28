'use client';

import { useThree } from '@react-three/fiber';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Object3D } from 'three';
import { Vector2 } from 'three';

import { useIsTouchDevice } from '@/shared/lib/dom/use-is-touch-device';

export const INTERACTIVE_MESH_NAMES = [
  'laptop',
  'laptop_cover',
  'bass_body',
  'bass_stand',
  'bass_neck',
  'bass_bridge',
  'bass_head',
  'bass_peg',
  'bass_nut',
  'line1',
  'line2',
  'line3',
  'line4',
  'camera',
  'camera_button',
  'camera_lens',
  'camera_lens_inner',
  'camera_lens_outer',
  'camera_mirror',
  'camera_screen',
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

const BASS_GROUP_NAMES = new Set([
  'bass_body',
  'bass_stand',
  'bass_neck',
  'bass_bridge',
  'bass_head',
  'bass_peg',
  'bass_nut',
]);
const CAMERA_GROUP_NAMES = new Set([
  'camera',
  'camera_button',
  'camera_lens',
  'camera_lens_inner',
  'camera_lens_outer',
  'camera_mirror',
  'camera_screen',
]);
const LAPTOP_GROUP_TRIGGER_NAMES = new Set(['laptop', 'laptop_cover']);
const LAPTOP_OUTLINE_EXCLUDE_NAMES = new Set(['laptop_screen']);

/**
 * 홈 씬에서 상호작용 가능한 mesh hover/click 판정을 관리합니다.
 * 실제 입력 장치 기준으로 hover/click 판정을 분기합니다.
 * coarse pointer 환경은 hover 없이 pointerdown/up 클릭만 처리합니다.
 * click 액션 정규화는 상위 훅에서 담당하고, 여기서는 outline이 보이도록 실제로 렌더되는 mesh를 우선 반환합니다.
 */
export const useRaycaster = ({
  onMeshClick,
}: UseRaycasterOptions): {
  clearHoveredMesh: () => void;
  hoveredMesh: Object3D | null;
  hoveredOutlineMeshes: Object3D[];
  onPointerClick: (event: PointerEvent) => void;
  onPointerMove: (event: PointerEvent) => void;
  setHoveredMeshDirect: (mesh: Object3D | null) => void;
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

  const hoveredOutlineMeshes = useMemo(
    () => (hoveredMesh ? resolveOutlineMeshes(hoveredMesh, scene) : []),
    [hoveredMesh, scene],
  );

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
        const pressedMesh = resolveInteractiveMesh(event);

        pressedPointerRef.current = {
          x: event.clientX,
          y: event.clientY,
        };
        pressedMeshRef.current = pressedMesh;
        if (!isTouchDevice) setHoveredMesh(pressedMesh);

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

      if (!isTouchDevice) setHoveredMesh(releasedMesh);
      onMeshClick?.(releasedMesh);
    },
    [isTouchDevice, onMeshClick, resolveInteractiveMesh],
  );

  const clearHoveredMesh = useCallback(() => {
    setHoveredMesh(null);
  }, []);

  return {
    clearHoveredMesh,
    hoveredMesh,
    hoveredOutlineMeshes,
    onPointerClick,
    onPointerMove,
    setHoveredMeshDirect: setHoveredMesh,
  };
};

/**
 * 호버된 mesh가 속한 outline 그룹의 모든 mesh를 반환합니다.
 * bass/camera는 씬 전체에서 그룹 이름으로 수집하고, laptop은 laptop 노드 하위에서 수집합니다.
 * line 계열과 그 외 단일 mesh는 자기 자신만 반환합니다.
 */
const resolveOutlineMeshes = (mesh: Object3D, scene: Object3D): Object3D[] => {
  const { name } = mesh;

  if (BASS_GROUP_NAMES.has(name)) {
    return collectByNames(scene, BASS_GROUP_NAMES);
  }
  if (CAMERA_GROUP_NAMES.has(name)) {
    return collectByNames(scene, CAMERA_GROUP_NAMES);
  }
  if (LAPTOP_GROUP_TRIGGER_NAMES.has(name)) {
    const laptopNode = findDescendantByName(scene, 'laptop');

    return laptopNode ? collectDescendants(laptopNode, LAPTOP_OUTLINE_EXCLUDE_NAMES) : [mesh];
  }

  return [mesh];
};

/**
 * 씬을 순회해 names에 포함된 이름의 Mesh를 수집합니다.
 * Group 등 geometry가 없는 노드는 제외해 outline selection이 예상 범위 밖의 자식을 포함하지 않도록 합니다.
 */
const collectByNames = (root: Object3D, names: Set<string>): Object3D[] => {
  const result: Object3D[] = [];

  root.traverse(obj => {
    if (names.has(obj.name) && (obj as { isMesh?: boolean }).isMesh) result.push(obj);
  });

  return result;
};

/**
 * node를 루트로 순회하면서 excludeNames에 없는 모든 Object3D를 수집합니다.
 */
const collectDescendants = (node: Object3D, excludeNames: Set<string>): Object3D[] => {
  const result: Object3D[] = [];

  node.traverse(obj => {
    if (!excludeNames.has(obj.name)) result.push(obj);
  });

  return result;
};

/**
 * root를 순회해 이름이 일치하는 첫 번째 Object3D를 찾습니다.
 */
const findDescendantByName = (root: Object3D, name: string): Object3D | null => {
  let found: Object3D | null = null;

  root.traverse(obj => {
    if (!found && obj.name === name) found = obj;
  });

  return found;
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
 * raycast 결과에서 interactive 이름을 가진 가장 가까운 대상을 찾아 반환합니다.
 * 현재는 outline 렌더를 위해 교차한 mesh 자체가 interactive면 그 mesh를 우선 사용합니다.
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
 * leaf mesh가 interactive면 그대로 유지하고, 아니면 부모 interactive object로 승격합니다.
 */
const resolveInteractiveAncestor = (object: Object3D | null): Object3D | null => {
  let currentObject = object;

  while (currentObject) {
    if (isInteractiveMeshName(currentObject.name)) return currentObject;

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

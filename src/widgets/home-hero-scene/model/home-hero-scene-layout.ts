import type { SceneBreakpoint } from '@/entities/scene/model/breakpointConfig';

export type Vector3Tuple = readonly [number, number, number];

export type HomeHeroSceneCameraLayout = {
  /** OrbitControls 최대 방위각 */
  readonly maxAzimuthAngle: number;
  /** OrbitControls 최대 세로 각도 */
  readonly maxPolarAngle: number;
  /** 카메라 시야각 */
  readonly fov: number;
  /** 카메라가 기본으로 바라보는 기준점 */
  readonly lookAt: Vector3Tuple;
  /** OrbitControls 최소 방위각 */
  readonly minAzimuthAngle: number;
  /** OrbitControls 최대 거리 */
  readonly maxDistance: number;
  /** OrbitControls 최소 세로 각도 */
  readonly minPolarAngle: number;
  /** OrbitControls 최소 거리 */
  readonly minDistance: number;
  /** 카메라 기본 월드 좌표 */
  readonly position: Vector3Tuple;
};

export type HomeHeroSceneLayout = {
  /** 베이스 배치 좌표 */
  readonly bassPosition: Vector3Tuple;
  /** 베이스 회전값 */
  readonly bassRotation: Vector3Tuple;
  /** 현재 breakpoint용 카메라 설정 */
  readonly camera: HomeHeroSceneCameraLayout;
  /** 테이블 배치 좌표 */
  readonly tablePosition: Vector3Tuple;
  /** 테이블 회전값 */
  readonly tableRotation: Vector3Tuple;
};

type GetHomeHeroSceneLayoutParams = {
  readonly currentBP: SceneBreakpoint;
};

const MOBILE_ORBIT_TARGET: Vector3Tuple = [1, 0, 0.5];
const DESKTOP_ORBIT_TARGET: Vector3Tuple = [0, 0, 0];

export const HOME_HERO_CAMERA_NEAR = 0.1;
export const HOME_HERO_CAMERA_FAR = 100;

const MOBILE_SMALL_LAYOUT: HomeHeroSceneLayout = {
  bassPosition: [2.5, 0, -0.4],
  bassRotation: [0, -0.7, 0],
  camera: {
    fov: 55,
    lookAt: MOBILE_ORBIT_TARGET,
    maxAzimuthAngle: 0.25,
    maxDistance: 15,
    maxPolarAngle: 1.45,
    minAzimuthAngle: -0.9,
    minPolarAngle: 1.05,
    minDistance: 9,
    position: [-4.8, 5, 9],
  },
  tablePosition: [2.2, 0, 1.7],
  tableRotation: [0, -0.8, 0],
};

const MOBILE_LARGE_LAYOUT: HomeHeroSceneLayout = {
  bassPosition: [2.6, 0, -0.4],
  bassRotation: [0, -0.7, 0],
  camera: {
    fov: 50,
    lookAt: MOBILE_ORBIT_TARGET,
    maxAzimuthAngle: 0.35,
    maxDistance: 12,
    maxPolarAngle: 1.7,
    minAzimuthAngle: -0.8,
    minPolarAngle: 1.02,
    minDistance: 7,
    position: [-4.5, 5, 9],
  },
  tablePosition: [2.3, 0, 2],
  tableRotation: [0, -0.8, 0],
};

const DESKTOP_SMALL_LAYOUT: HomeHeroSceneLayout = {
  bassPosition: [-2.5, 0, 0],
  bassRotation: [0, 0, 0],
  camera: {
    fov: 50,
    lookAt: DESKTOP_ORBIT_TARGET,
    maxAzimuthAngle: 0.8,
    maxDistance: 10,
    maxPolarAngle: 1.5,
    minAzimuthAngle: -0.8,
    minPolarAngle: 1.18,
    minDistance: 8,
    position: [0, 1, 9],
  },
  tablePosition: [2.5, 0, 0],
  tableRotation: [0, 0, 0],
};

const DESKTOP_LARGE_LAYOUT: HomeHeroSceneLayout = {
  bassPosition: [-2.7, 0, 0],
  bassRotation: [0, 0.4, 0],
  camera: {
    fov: 45,
    lookAt: DESKTOP_ORBIT_TARGET,
    maxAzimuthAngle: 0.8,
    maxDistance: 10,
    maxPolarAngle: 1.6,
    minAzimuthAngle: -0.8,
    minPolarAngle: 1.12,
    minDistance: 8,
    position: [0, 0.75, 8.9],
  },
  tablePosition: [2.7, 0, 0],
  tableRotation: [0, -0.4, 0],
};

/**
 * 현재 홈 히어로 breakpoint에 맞는 4개 화면 프리셋 중 하나를 반환합니다.
 */
export const getHomeHeroSceneLayout = ({
  currentBP,
}: GetHomeHeroSceneLayoutParams): HomeHeroSceneLayout => {
  if (currentBP === 1) return MOBILE_SMALL_LAYOUT;
  if (currentBP === 2) return MOBILE_LARGE_LAYOUT;
  if (currentBP === 3) return DESKTOP_SMALL_LAYOUT;

  return DESKTOP_LARGE_LAYOUT;
};

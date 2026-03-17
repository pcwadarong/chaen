export type Vector3Tuple = readonly [number, number, number];

export type HomeHeroCameraMotion = {
  readonly pivotPosition: Vector3Tuple;
  readonly initialCameraOffset: Vector3Tuple;
  readonly intermediateCameraOffset: Vector3Tuple;
  readonly finalCameraOffset: Vector3Tuple;
  readonly initialRotationY: number;
  readonly finalRotationY: number;
  readonly canvasFadeStart: number;
  readonly interactiveThreshold: number;
  readonly webUiFadeStart: number;
  readonly scrub: number;
  readonly end: string;
};

/**
 * 홈 히어로에서 모니터에 포커싱하는 카메라 모션 기본값입니다.
 */
export const homeHeroCameraMotion: HomeHeroCameraMotion = {
  pivotPosition: [0.1, 1.35, 1.45],
  initialCameraOffset: [0, 3.4, 17],
  intermediateCameraOffset: [0, 2.05, 11.2],
  finalCameraOffset: [0, 0.24, 2.2],
  initialRotationY: 0,
  finalRotationY: Math.PI,
  canvasFadeStart: 0.915,
  interactiveThreshold: 0.9,
  webUiFadeStart: 0.95,
  scrub: 1.2,
  end: '+=220%',
};

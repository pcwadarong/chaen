export type Vector3Tuple = readonly [number, number, number];

export type ScrollTimelineSnapshot = {
  readonly blackoutOpacity: number;
  readonly cameraPosition: Vector3Tuple;
  readonly isCloseupCostumeHidden: boolean;
  readonly isMonitorOverlayVisible: boolean;
  readonly isScrollDriven: boolean;
  readonly isSequenceActive: boolean;
  readonly lookAt: Vector3Tuple;
  readonly progress: number;
  readonly webUiOpacity: number;
};

type GetScrollTimelineSnapshotParams = {
  readonly initialPosition: Vector3Tuple;
  readonly progress: number;
  readonly viewportHeight?: number;
  readonly webUiHeight?: number;
};

type DesktopScrollPreset = {
  /** 블랙아웃이 풀린 뒤 최종적으로 멈추는 카메라 위치 */
  readonly closeupEndPosition: Vector3Tuple;
  /** 클로즈업 구간에서 카메라가 계속 바라보는 기준점 */
  readonly closeupLookAt: Vector3Tuple;
  /** 블랙아웃 직후 점프해 도착하는 첫 클로즈업 위치 */
  readonly closeupStartPosition: Vector3Tuple;
  /** 스크롤 중 카메라가 계속 바라보는 기준점 */
  readonly focusTarget: Vector3Tuple;
  /** 스핀 구간에서 캐릭터를 도는 반경 */
  readonly spinRadius: number;
  /** 초반 정면 구도와 스핀 시작점이 공유하는 카메라 높이 */
  readonly focusViewY: number;
  /** 초반 줌 이동이 도착하는 완만한 정면 구도 */
  readonly zoomTargetPosition: Vector3Tuple;
};

const DESKTOP_SCROLL_PRESET: DesktopScrollPreset = {
  closeupEndPosition: [0, -0.3, -0.4],
  closeupLookAt: [0, -0.3, 1],
  closeupStartPosition: [0, -0.3, -0.85],
  focusViewY: 1.8,
  focusTarget: [0, 0, 0],
  spinRadius: 5,
  zoomTargetPosition: [0, 1.8, 5],
};

/** 최종 HTML web UI가 보이기 시작하는 progress. 값을 올리면 등장 타이밍이 더 늦어진다. */
const WEB_UI_FADE_START_PROGRESS = 0.88;

/** 최종 HTML web UI가 opacity 1에 도달하는 progress. start와 간격이 좁을수록 더 빠르게 올라온다. */
const WEB_UI_FADE_END_PROGRESS = 0.96;

/**
 * 16:9보다 세로 비중이 큰 desktop viewport에서 UI가 커지기 시작하는 하한 비율입니다.
 * `webUiHeight / viewportHeight` 비율값이며, 이 지점 전까지는 closeup 카메라 z 보정을 주지 않습니다.
 */
const CLOSEUP_UI_HEIGHT_BASE_RATIO = 0.34;

/**
 * QA에서 closeup 체감 차이가 가장 크게 보이던 short-height desktop 상한 비율입니다.
 * `webUiHeight / viewportHeight`가 이 값에 도달하면 카메라 전진 보정을 최대치까지 적용합니다.
 */
const CLOSEUP_UI_HEIGHT_MAX_RATIO = 0.72;

/**
 * closeupEnd 기준으로 카메라를 앞으로 당길 수 있는 최대 Z 오프셋입니다.
 * Three.js 월드 좌표의 z 이동량이며, UI가 가장 큰 desktop 구도에서만 최대 0.78까지 적용됩니다.
 */
const CLOSEUP_UI_HEIGHT_MAX_Z_OFFSET = 0.78;

/**
 * closeup 시작 구간은 블랙아웃 직후라 프레이밍이 급격하게 변하면 어색해 보입니다.
 * 같은 UI 높이 보정이라도 시작점에는 72%만 반영해, 시작 구도와 끝 구도의 시각 차이를 완만하게 유지합니다.
 */
const CLOSEUP_START_HEIGHT_RATIO = 0.72;

/**
 * 스크롤 타임라인 progress를 0~1 구간으로 제한합니다.
 */
const clampProgress = (progress: number) => Math.min(1, Math.max(0, progress));

/**
 * 두 숫자 사이를 선형 보간합니다.
 */
const lerp = (start: number, end: number, t: number) => start + (end - start) * t;

/**
 * 두 벡터를 선형 보간합니다.
 */
const lerpVector = (start: Vector3Tuple, end: Vector3Tuple, t: number): Vector3Tuple =>
  [lerp(start[0], end[0], t), lerp(start[1], end[1], t), lerp(start[2], end[2], t)] as const;

/**
 * 주어진 3차원 좌표의 z축만 보정한 새 좌표를 반환합니다.
 *
 * @param vector [x, y, z] 순서로 표현된 기준 카메라 좌표입니다.
 * @param offset 기준 좌표의 z값에 더할 보정량입니다. 양수면 카메라를 앞으로 당깁니다.
 * @returns 원본 x, y는 유지하고 z만 보정된 새 Vector3Tuple입니다.
 */
const offsetVectorZ = (vector: Vector3Tuple, offset: number): Vector3Tuple =>
  [vector[0], vector[1], vector[2] + offset] as const;

/**
 * 실제 web UI 콘텐츠 높이를 기준으로 closeup 카메라의 전진 보정량을 계산합니다.
 * UI가 높아질수록 같은 구도라도 피사체가 더 멀게 느껴져, closeup z값을 조금 앞으로 당깁니다.
 */
const getCloseupUiHeightCompensation = ({
  viewportHeight,
  webUiHeight,
}: Pick<GetScrollTimelineSnapshotParams, 'viewportHeight' | 'webUiHeight'>) => {
  if (!viewportHeight || !webUiHeight) return 0;

  const heightRatio = clampProgress(webUiHeight / viewportHeight);
  const normalizedRatio = getSegmentRatio(
    heightRatio,
    CLOSEUP_UI_HEIGHT_BASE_RATIO,
    CLOSEUP_UI_HEIGHT_MAX_RATIO,
  );

  return normalizedRatio * CLOSEUP_UI_HEIGHT_MAX_Z_OFFSET;
};

/**
 * 주어진 progress가 특정 segment 안에서 몇 퍼센트 진행됐는지 계산합니다.
 */
const getSegmentRatio = (progress: number, start: number, end: number) =>
  clampProgress((progress - start) / (end - start));

/**
 * 홈 히어로 데스크탑 스크롤 progress를 카메라/overlay 상태로 변환합니다.
 */
export const getScrollTimelineSnapshot = ({
  initialPosition,
  progress,
  viewportHeight,
  webUiHeight,
}: GetScrollTimelineSnapshotParams): ScrollTimelineSnapshot => {
  const normalizedProgress = clampProgress(progress);
  const preset = DESKTOP_SCROLL_PRESET;
  const closeupUiHeightCompensation = getCloseupUiHeightCompensation({
    viewportHeight,
    webUiHeight,
  });
  const closeupStartPosition = offsetVectorZ(
    preset.closeupStartPosition,
    closeupUiHeightCompensation * CLOSEUP_START_HEIGHT_RATIO,
  );
  const closeupEndPosition = offsetVectorZ(preset.closeupEndPosition, closeupUiHeightCompensation);
  const spinEndPosition: Vector3Tuple = [
    preset.focusTarget[0],
    preset.focusViewY,
    preset.focusTarget[2] - preset.spinRadius,
  ];

  if (normalizedProgress <= 0.25) {
    const ratio = getSegmentRatio(normalizedProgress, 0, 0.25);

    return {
      blackoutOpacity: 0,
      cameraPosition: lerpVector(initialPosition, preset.zoomTargetPosition, ratio),
      isCloseupCostumeHidden: false,
      isMonitorOverlayVisible: true,
      isScrollDriven: normalizedProgress > 0,
      isSequenceActive: normalizedProgress > 0,
      lookAt: preset.focusTarget,
      progress: normalizedProgress,
      webUiOpacity: 0,
    };
  }

  if (normalizedProgress <= 0.5) {
    const ratio = getSegmentRatio(normalizedProgress, 0.25, 0.5);
    const angle = Math.PI * ratio;
    const cameraPosition: Vector3Tuple = [
      preset.focusTarget[0] + Math.sin(angle) * preset.spinRadius,
      preset.focusViewY,
      preset.focusTarget[2] + Math.cos(angle) * preset.spinRadius,
    ];

    return {
      blackoutOpacity: 0,
      cameraPosition,
      isCloseupCostumeHidden: false,
      isMonitorOverlayVisible: true,
      isScrollDriven: true,
      isSequenceActive: true,
      lookAt: preset.focusTarget,
      progress: normalizedProgress,
      webUiOpacity: 0,
    };
  }

  if (normalizedProgress <= 0.56) {
    const ratio = getSegmentRatio(normalizedProgress, 0.5, 0.56);

    return {
      blackoutOpacity: ratio,
      cameraPosition: spinEndPosition,
      isCloseupCostumeHidden: false,
      isMonitorOverlayVisible: true,
      isScrollDriven: true,
      isSequenceActive: true,
      lookAt: preset.focusTarget,
      progress: normalizedProgress,
      webUiOpacity: 0,
    };
  }

  if (normalizedProgress <= 0.82) {
    const ratio = getSegmentRatio(normalizedProgress, 0.56, 0.82);

    return {
      blackoutOpacity: 1 - ratio,
      cameraPosition: lerpVector(closeupStartPosition, closeupEndPosition, ratio),
      isCloseupCostumeHidden: true,
      isMonitorOverlayVisible: true,
      isScrollDriven: true,
      isSequenceActive: true,
      lookAt: preset.closeupLookAt,
      progress: normalizedProgress,
      webUiOpacity: 0,
    };
  }

  if (normalizedProgress <= WEB_UI_FADE_START_PROGRESS) {
    return {
      blackoutOpacity: 0,
      cameraPosition: closeupEndPosition,
      isCloseupCostumeHidden: true,
      isMonitorOverlayVisible: true,
      isScrollDriven: true,
      isSequenceActive: true,
      lookAt: preset.closeupLookAt,
      progress: normalizedProgress,
      webUiOpacity: 0,
    };
  }

  const ratio = getSegmentRatio(
    normalizedProgress,
    WEB_UI_FADE_START_PROGRESS,
    WEB_UI_FADE_END_PROGRESS,
  );

  return {
    blackoutOpacity: 0,
    cameraPosition: closeupEndPosition,
    isCloseupCostumeHidden: true,
    isMonitorOverlayVisible: true,
    isScrollDriven: true,
    isSequenceActive: normalizedProgress < 1,
    lookAt: preset.closeupLookAt,
    progress: normalizedProgress,
    webUiOpacity: ratio,
  };
};

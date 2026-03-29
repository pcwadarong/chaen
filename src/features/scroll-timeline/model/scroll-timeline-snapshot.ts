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

/** web UI 높이 비율이 이 값보다 커질 때부터 closeup 카메라를 앞으로 당깁니다. */
const CLOSEUP_UI_HEIGHT_BASE_RATIO = 0.34;

/** web UI 높이 비율 보정이 최대치에 도달하는 지점입니다. */
const CLOSEUP_UI_HEIGHT_MAX_RATIO = 0.72;

/** closeupEnd 기준으로 카메라를 앞으로 당길 수 있는 최대 Z 보정량입니다. */
const CLOSEUP_UI_HEIGHT_MAX_Z_OFFSET = 0.78;

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
 * 주어진 벡터의 z값만 이동시킨 새 좌표를 반환합니다.
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
    closeupUiHeightCompensation * 0.72,
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

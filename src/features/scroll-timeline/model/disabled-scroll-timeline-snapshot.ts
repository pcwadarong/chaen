import {
  getScrollTimelineSnapshot,
  type ScrollTimelineSnapshot,
  type Vector3Tuple,
} from '@/features/scroll-timeline/model/scroll-timeline-snapshot';

type GetDisabledScrollTimelineSnapshotParams = {
  readonly initialPosition: Vector3Tuple;
};

/**
 * 스크롤 타임라인을 사용하지 않는 환경에서 적용할 정적 UI snapshot을 반환합니다.
 *
 * 모바일처럼 ScrollTrigger를 비활성화한 구간에서는 hero HTML UI가 기본 노출되면
 * 3D stage 위에 프로젝트 카드가 갑자기 떠 보이는 회귀가 생길 수 있어,
 * web UI는 숨긴 채 스크롤 진행 상태만 비활성화합니다.
 */
export const getDisabledScrollTimelineSnapshot = ({
  initialPosition,
}: GetDisabledScrollTimelineSnapshotParams): ScrollTimelineSnapshot => {
  const initialSnapshot = getScrollTimelineSnapshot({
    initialPosition,
    progress: 0,
  });

  return {
    ...initialSnapshot,
    blackoutOpacity: 0,
    isMonitorOverlayVisible: false,
    isScrollDriven: false,
    isSequenceActive: false,
    webUiOpacity: 0,
  };
};

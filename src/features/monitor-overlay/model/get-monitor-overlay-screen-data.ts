import { formatProjectPeriod } from '@/entities/project/model/format-project-period';
import type { ProjectListItem } from '@/entities/project/model/types';
import { normalizeImageUrl } from '@/shared/lib/url/normalize-image-url';
import { createImageViewerUrl } from '@/shared/ui/image-viewer/model/create-image-viewer-url';

export type MonitorOverlayProjectCard = Readonly<{
  description: string | null;
  periodLabel: string;
  thumbnailSrc: string | null;
  title: string;
}>;

export type MonitorOverlayScreenData = Readonly<{
  projects: ReadonlyArray<MonitorOverlayProjectCard>;
}>;

type GetMonitorOverlayScreenDataParams = Readonly<{
  items: ProjectListItem[];
  locale: string;
  ongoingLabel: string;
}>;

const MAX_PROJECT_COUNT = 3;
const DEFAULT_TITLE = 'No project';

/**
 * 개별 프로젝트를 monitor overlay 카드 한 장에 맞는 데이터로 정규화합니다.
 *
 * `item`이 없으면 빈 카드 placeholder를 만들고, 이때 기간 문구는 전달받은 `ongoingLabel`을 그대로 사용합니다.
 * `item`이 있으면 locale 기준 기간 문자열을 계산하고, 썸네일 URL은 정규화 후 image viewer preview URL로 변환합니다.
 *
 * @param item - 원본 프로젝트 항목입니다. `undefined`면 기본 placeholder 카드로 처리합니다.
 * @param locale - 기간 문자열 포맷에 사용할 로케일 문자열입니다. 예: `ko`, `en`.
 * @param ongoingLabel - 진행 중 프로젝트 및 빈 카드 placeholder에 사용할 진행 상태 문구입니다.
 * @returns monitor texture에 바로 그릴 수 있는 `MonitorOverlayProjectCard`를 반환합니다.
 */
const getProjectCardData = (
  item: ProjectListItem | undefined,
  locale: string,
  ongoingLabel: string,
): MonitorOverlayProjectCard => {
  if (!item) {
    return {
      description: null,
      periodLabel: ongoingLabel,
      thumbnailSrc: null,
      title: DEFAULT_TITLE,
    };
  }

  const normalizedThumbnailUrl = normalizeImageUrl(item.thumbnail_url);

  return {
    description: item.description ?? null,
    periodLabel: formatProjectPeriod(item, locale, ongoingLabel),
    thumbnailSrc: normalizedThumbnailUrl ? createImageViewerUrl(normalizedThumbnailUrl) : null,
    title: item.title,
  };
};

/**
 * 노트북 화면 텍스처에 그릴 프로젝트 카드 데이터를 계산합니다.
 * 항상 MAX_PROJECT_COUNT개를 반환하며, 데이터가 부족하면 기본값으로 채웁니다.
 */
export const getMonitorOverlayScreenData = ({
  items,
  locale,
  ongoingLabel,
}: GetMonitorOverlayScreenDataParams): MonitorOverlayScreenData => {
  const displayItems = items.slice(0, MAX_PROJECT_COUNT);

  return {
    projects: Array.from({ length: MAX_PROJECT_COUNT }, (_, i) =>
      getProjectCardData(displayItems[i], locale, ongoingLabel),
    ),
  };
};

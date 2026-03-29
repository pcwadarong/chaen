import { formatProjectPeriod } from '@/entities/project/model/format-project-period';
import type { ProjectListItem } from '@/entities/project/model/types';
import { normalizeImageUrl } from '@/shared/lib/url/normalize-image-url';
import { createImageViewerUrl } from '@/shared/ui/image-viewer/model/create-image-viewer-url';

export type MonitorOverlayProjectCard = Readonly<{
  description: string | null;
  periodLabel: string;
  techStackNames: string[];
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
const DEFAULT_PERIOD_LABEL = 'In Progress';

const getProjectCardData = (
  item: ProjectListItem | undefined,
  locale: string,
  ongoingLabel: string,
): MonitorOverlayProjectCard => {
  if (!item) {
    return {
      description: null,
      periodLabel: DEFAULT_PERIOD_LABEL,
      techStackNames: [],
      thumbnailSrc: null,
      title: DEFAULT_TITLE,
    };
  }

  const normalizedThumbnailUrl = normalizeImageUrl(item.thumbnail_url);

  return {
    description: item.description ?? null,
    periodLabel: formatProjectPeriod(item, locale, ongoingLabel),
    techStackNames: (item.tech_stacks ?? []).slice(0, 3).map(techStack => techStack.name),
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

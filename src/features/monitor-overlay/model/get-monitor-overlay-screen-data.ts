import { formatProjectPeriod } from '@/entities/project/model/format-project-period';
import type { ProjectListItem } from '@/entities/project/model/types';
import { normalizeImageUrl } from '@/shared/lib/url/normalize-image-url';
import { createImageViewerUrl } from '@/shared/ui/image-viewer/model/create-image-viewer-url';

export type MonitorOverlayScreenData = Readonly<{
  overlayTitle: string;
  projectCountLabel: string;
  primaryProject: Readonly<{
    description: string;
    label: string;
    periodLabel: string;
    techStackNames: string[];
    thumbnailSrc: string | null;
    title: string;
  }>;
  secondaryProjects: ReadonlyArray<
    Readonly<{
      periodLabel: string;
      techStackNames: string[];
      title: string;
    }>
  >;
}>;

type GetMonitorOverlayScreenDataParams = Readonly<{
  items: ProjectListItem[];
  locale: string;
  ongoingLabel: string;
  title: string;
}>;

const MAX_PROJECT_COUNT = 3;
const DEFAULT_OVERLAY_TITLE = 'Project Archive';
const DEFAULT_HERO_LABEL = 'Featured Project';
const DEFAULT_HERO_TITLE = 'No project selected';
const DEFAULT_HERO_DESCRIPTION = 'Overlay texture mount is active.';
const DEFAULT_PERIOD_LABEL = 'In Progress';

/**
 * 프로젝트 한 개를 노트북 화면용 표시 데이터로 축약합니다.
 */
const getProjectCardData = (
  item: ProjectListItem | undefined,
  locale: string,
  ongoingLabel: string,
) => {
  if (!item) {
    return {
      description: DEFAULT_HERO_DESCRIPTION,
      periodLabel: DEFAULT_PERIOD_LABEL,
      techStackNames: [],
      thumbnailSrc: null,
      title: DEFAULT_HERO_TITLE,
    };
  }

  const normalizedThumbnailUrl = normalizeImageUrl(item.thumbnail_url);

  return {
    description: item.description ?? DEFAULT_HERO_DESCRIPTION,
    periodLabel: formatProjectPeriod(item, locale, ongoingLabel),
    techStackNames: (item.tech_stacks ?? []).slice(0, 3).map(techStack => techStack.name),
    thumbnailSrc: normalizedThumbnailUrl ? createImageViewerUrl(normalizedThumbnailUrl) : null,
    title: item.title,
  };
};

/**
 * 노트북 화면 텍스처에 그릴 최소한의 텍스트 모델을 계산합니다.
 * DOM과 Canvas 렌더러가 같은 기준 문구를 공유하도록, 표시 규칙을 순수 함수로 고정합니다.
 */
export const getMonitorOverlayScreenData = ({
  items,
  locale,
  ongoingLabel,
  title,
}: GetMonitorOverlayScreenDataParams): MonitorOverlayScreenData => {
  const displayItems = items.slice(0, MAX_PROJECT_COUNT);
  const primaryProject = getProjectCardData(displayItems[0], locale, ongoingLabel);

  return {
    overlayTitle: title || DEFAULT_OVERLAY_TITLE,
    projectCountLabel: `${displayItems.length} projects`,
    primaryProject: {
      ...primaryProject,
      label: DEFAULT_HERO_LABEL,
    },
    secondaryProjects: displayItems.slice(1).map(item => {
      const cardData = getProjectCardData(item, locale, ongoingLabel);

      return {
        periodLabel: cardData.periodLabel,
        techStackNames: cardData.techStackNames,
        title: cardData.title,
      };
    }),
  };
};

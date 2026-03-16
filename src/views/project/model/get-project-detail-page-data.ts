import { getProject } from '@/entities/project/api/detail/get-project';
import { getProjectDetailList } from '@/entities/project/api/detail/get-project-detail-list';
import type {
  Project,
  ProjectArchivePage,
  ProjectDetailListItem,
} from '@/entities/project/model/types';
import { getTagLabelMapBySlugs } from '@/entities/tag/api/query-tags';
import { prependCurrentArchiveItem } from '@/shared/lib/pagination/prepend-current-archive-item';

type GetProjectDetailPageDataInput = {
  locale: string;
  projectSlug: string;
};

type ProjectDetailPageData = {
  archivePage: ProjectArchivePage;
  item: Project | null;
  tagLabels: string[];
};

/**
 * 상세 프로젝트를 public archive 요약 shape로 좁힙니다.
 */
const toCurrentProjectArchiveItem = (item: Project | null): ProjectDetailListItem | null => {
  if (!item?.publish_at || !item.slug) return null;

  return {
    description: item.description,
    id: item.id,
    publish_at: item.publish_at,
    slug: item.slug,
    title: item.title,
  };
};

/**
 * 상세 대상 프로젝트를 좌측 아카이브 목록에 보정합니다.
 */
const ensureCurrentProjectInArchive = (
  item: Project | null,
  archivePage: ProjectArchivePage,
): ProjectArchivePage =>
  prependCurrentArchiveItem<ProjectDetailListItem, ProjectDetailListItem>(
    toCurrentProjectArchiveItem(item),
    archivePage,
  );

/**
 * 상세 프로젝트 태그를 locale 기준 표시 라벨로 변환합니다.
 */
const getProjectTagLabels = async (item: Project | null, locale: string): Promise<string[]> => {
  const tags = item?.tags ?? [];

  if (tags.length === 0) return [];

  const tagLabelMap = await getTagLabelMapBySlugs({
    locale,
    slugs: tags,
  });

  if (tagLabelMap.schemaMissing) {
    throw new Error('[projects] 태그 label schema가 없습니다.');
  }

  return tags.map(tag => tagLabelMap.data.get(tag) ?? tag);
};

/**
 * 프로젝트 상세 페이지에 필요한 데이터 묶음을 조회합니다.
 */
export const getProjectDetailPageData = async ({
  locale,
  projectSlug,
}: GetProjectDetailPageDataInput): Promise<ProjectDetailPageData> => {
  const [item, archivePage] = await Promise.all([
    getProject(projectSlug, locale),
    getProjectDetailList({ locale }),
  ]);
  const tagLabels = await getProjectTagLabels(item, locale);

  return {
    archivePage: ensureCurrentProjectInArchive(item, archivePage),
    item,
    tagLabels,
  };
};

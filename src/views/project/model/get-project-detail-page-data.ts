import { getResolvedProject } from '@/entities/project/api/detail/get-project';
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

type GetProjectDetailArchivePageDataInput = {
  item: Project | null;
  locale: string;
};

type GetProjectTagLabelsInput = {
  item: Project | null;
  locale: string;
};

export type ProjectDetailShellData = Awaited<ReturnType<typeof getResolvedProject>>;

const EMPTY_PROJECT_ARCHIVE_PAGE: ProjectArchivePage = {
  items: [],
  nextCursor: null,
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
export const getProjectTagLabels = async ({
  item,
  locale,
}: GetProjectTagLabelsInput): Promise<string[]> => {
  const tags = item?.tags ?? [];

  if (tags.length === 0) return [];

  const tagLabelMap = await getTagLabelMapBySlugs({
    locale,
    slugs: tags,
  });

  if (tagLabelMap.schemaMissing) return tags;

  return tags.map(tag => tagLabelMap.data.get(tag) ?? tag);
};

/**
 * 프로젝트 상세 본문 shell에 필요한 최소 데이터를 조회합니다.
 */
export const getProjectDetailShellData = ({
  locale,
  projectSlug,
}: GetProjectDetailPageDataInput): Promise<ProjectDetailShellData> =>
  getResolvedProject(projectSlug, locale);

/**
 * 프로젝트 상세 좌측 아카이브를 조회하고 현재 항목을 목록에 보정합니다.
 */
export const getProjectDetailArchivePageData = async ({
  item,
  locale,
}: GetProjectDetailArchivePageDataInput): Promise<ProjectArchivePage> => {
  const archivePage = await getProjectDetailList({ locale }).catch(
    () => EMPTY_PROJECT_ARCHIVE_PAGE,
  );

  return ensureCurrentProjectInArchive(item, archivePage);
};

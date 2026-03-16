import { getProject } from '@/entities/project/api/detail/get-project';
import { getProjectDetailList } from '@/entities/project/api/detail/get-project-detail-list';
import type {
  Project,
  ProjectArchivePage,
  ProjectDetailListItem,
} from '@/entities/project/model/types';
import { prependCurrentArchiveItem } from '@/shared/lib/pagination/prepend-current-archive-item';

type GetProjectDetailPageDataInput = {
  locale: string;
  projectSlug: string;
};

type ProjectDetailPageData = {
  archivePage: ProjectArchivePage;
  item: Project | null;
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

  return {
    archivePage: ensureCurrentProjectInArchive(item, archivePage),
    item,
  };
};

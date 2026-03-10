import { getProject } from '@/entities/project/api/get-project';
import { getProjectDetailList } from '@/entities/project/api/get-project-detail-list';
import type {
  Project,
  ProjectArchivePage,
  ProjectDetailListItem,
} from '@/entities/project/model/types';
import { prependCurrentArchiveItem } from '@/shared/lib/pagination/prepend-current-archive-item';

type GetProjectDetailPageDataInput = {
  locale: string;
  projectId: string;
};

type ProjectDetailPageData = {
  archivePage: ProjectArchivePage;
  item: Project | null;
};

/**
 * 상세 대상 프로젝트를 좌측 아카이브 목록에 보정합니다.
 */
const ensureCurrentProjectInArchive = (
  item: Project | null,
  archivePage: ProjectArchivePage,
): ProjectArchivePage =>
  prependCurrentArchiveItem<ProjectDetailListItem, Project>(item, archivePage);

/**
 * 프로젝트 상세 페이지에 필요한 데이터 묶음을 조회합니다.
 */
export const getProjectDetailPageData = async ({
  locale,
  projectId,
}: GetProjectDetailPageDataInput): Promise<ProjectDetailPageData> => {
  const [item, archivePage] = await Promise.all([
    getProject(projectId, locale),
    getProjectDetailList({ locale }),
  ]);

  return {
    archivePage: ensureCurrentProjectInArchive(item, archivePage),
    item,
  };
};

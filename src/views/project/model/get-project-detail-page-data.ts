import { getProject } from '@/entities/project/api/get-project';
import { getProjectDetailList } from '@/entities/project/api/get-project-detail-list';
import type {
  Project,
  ProjectArchivePage,
  ProjectDetailListItem,
} from '@/entities/project/model/types';

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
): ProjectArchivePage => {
  if (!item) return archivePage;
  if (archivePage.items.some(archiveItem => archiveItem.id === item.id)) return archivePage;
  const remainingItemCount = Math.max(archivePage.items.length - 1, 0);

  const nextItems: ProjectDetailListItem[] = [
    {
      created_at: item.created_at,
      description: item.description,
      id: item.id,
      title: item.title,
    },
    ...archivePage.items.slice(0, remainingItemCount),
  ];

  return {
    ...archivePage,
    items: nextItems,
  };
};

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

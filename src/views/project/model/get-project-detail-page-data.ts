import { getProject } from '@/entities/project/api/get-project';
import { getProjectDetailList } from '@/entities/project/api/get-project-detail-list';
import type { Project, ProjectDetailListItem } from '@/entities/project/model/types';

type GetProjectDetailPageDataInput = {
  locale: string;
  projectId: string;
};

type ProjectDetailPageData = {
  archiveItems: ProjectDetailListItem[];
  item: Project | null;
};

/**
 * 상세 대상 프로젝트를 좌측 아카이브 목록에 보정합니다.
 */
const ensureCurrentProjectInArchive = (
  item: Project | null,
  archiveItems: ProjectDetailListItem[],
): ProjectDetailListItem[] => {
  if (!item) return archiveItems;
  if (archiveItems.some(archiveItem => archiveItem.id === item.id)) return archiveItems;

  return [
    {
      created_at: item.created_at,
      description: item.description,
      id: item.id,
      title: item.title,
    },
    ...archiveItems.slice(0, 199),
  ];
};

/**
 * 프로젝트 상세 페이지에 필요한 데이터 묶음을 조회합니다.
 */
export const getProjectDetailPageData = async ({
  locale,
  projectId,
}: GetProjectDetailPageDataInput): Promise<ProjectDetailPageData> => {
  const [item, archiveItems] = await Promise.all([
    getProject(projectId, locale),
    getProjectDetailList(locale),
  ]);

  return {
    archiveItems: ensureCurrentProjectInArchive(item, archiveItems),
    item,
  };
};

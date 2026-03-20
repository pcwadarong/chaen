import { getResolvedProject } from '@/entities/project/api/detail/get-project';
import {
  getProjectDetailList,
  getProjectDetailListWindow,
} from '@/entities/project/api/detail/get-project-detail-list';
import type { Project, ProjectArchivePage } from '@/entities/project/model/types';

type GetProjectDetailPageDataInput = {
  locale: string;
  projectSlug: string;
};

type GetProjectDetailArchivePageDataInput = {
  item: Project | null;
  locale: string;
};

export type ProjectDetailShellData = Awaited<ReturnType<typeof getResolvedProject>>;

type CurrentProjectArchiveItem = Parameters<typeof getProjectDetailListWindow>[0]['currentItem'];

const EMPTY_PROJECT_ARCHIVE_PAGE: ProjectArchivePage = {
  items: [],
  nextCursor: null,
};

/**
 * 상세 프로젝트를 public archive 요약 shape로 좁힙니다.
 */
const toCurrentProjectArchiveItem = (item: Project | null): CurrentProjectArchiveItem | null => {
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
 * 프로젝트 상세 본문 shell에 필요한 최소 데이터를 조회합니다.
 */
export const getProjectDetailShellData = ({
  locale,
  projectSlug,
}: GetProjectDetailPageDataInput): Promise<ProjectDetailShellData> =>
  getResolvedProject(projectSlug, locale);

/**
 * 프로젝트 상세 좌측 아카이브를 현재 프로젝트를 포함한 초기 slice로 조회합니다.
 */
export const getProjectDetailArchivePageData = async ({
  item,
  locale,
}: GetProjectDetailArchivePageDataInput): Promise<ProjectArchivePage> => {
  const currentArchiveItem = toCurrentProjectArchiveItem(item);

  if (!currentArchiveItem) {
    return getProjectDetailList({ locale }).catch(error => {
      console.error('[projects] getProjectDetailList failed for locale', {
        error,
        locale,
      });

      return EMPTY_PROJECT_ARCHIVE_PAGE;
    });
  }

  return getProjectDetailListWindow({
    currentItem: currentArchiveItem,
    locale,
  }).catch(error => {
    console.error('[projects] getProjectDetailListWindow failed for locale', {
      error,
      locale,
    });

    return {
      items: [currentArchiveItem],
      nextCursor: null,
    };
  });
};

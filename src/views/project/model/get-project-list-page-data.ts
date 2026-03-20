import { getTranslations } from 'next-intl/server';

import { getProjects } from '@/entities/project/api/list/get-projects';
import type { ProjectListPageProps } from '@/views/project/ui/project-list-page';

type GetProjectListPageDataInput = {
  locale: string;
};

/**
 * 프로젝트 목록 화면에 필요한 서버 데이터를 한 번에 조합합니다.
 * 목록/포트폴리오 URL/번역 문구를 route 밖에서 준비해 app 레이어를 얇게 유지합니다.
 */
export const getProjectListPageData = async ({
  locale,
}: GetProjectListPageDataInput): Promise<ProjectListPageProps> => {
  const [t, projectsPage] = await Promise.all([
    getTranslations({ locale, namespace: 'Project' }),
    getProjects({ locale }).catch(() => ({
      items: [],
      nextCursor: null,
    })),
  ]);

  return {
    initialCursor: projectsPage.nextCursor,
    initialItems: projectsPage.items,
    locale,
    portfolioButtonLabel: t('portfolioDownload'),
    portfolioButtonUnavailableLabel: t('portfolioDownloadUnavailable'),
  };
};

import { getProjects } from '@/entities/project/api/get-projects';

import type { HomePageProps } from '../ui/home-page';

type GetHomePageDataInput = {
  locale: string;
};

/**
 * 홈 화면에서 사용하는 프로젝트 미리보기 데이터를 조회합니다.
 * 홈에서는 첫 페이지 3개만 서버에서 미리 가져옵니다.
 */
export const getHomePageData = async ({ locale }: GetHomePageDataInput): Promise<HomePageProps> => {
  const projectsPage = await getProjects({
    locale,
    limit: 3,
  });

  return {
    items: projectsPage.items,
  };
};

import { listPhotoFiles } from '@/entities/hero-photo/api/list-photo-files';
import { getProjects } from '@/entities/project/api/list/get-projects';
import type { HomePageProps } from '@/views/home/ui/home-page';

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
  }).catch(() => ({
    items: [],
    nextCursor: null,
  }));
  const photoItems = await listPhotoFiles()
    .then(items =>
      items.map((item, index) => ({
        alt: item.fileName || `Hero photo ${index + 1}`,
        src: item.publicUrl,
      })),
    )
    .catch(() => []);

  return {
    items: projectsPage.items,
    photoItems,
  };
};

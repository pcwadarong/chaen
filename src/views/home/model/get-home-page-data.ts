import { listPhotoFiles } from '@/entities/hero-photo/api/list-photo-files';
import { getProjects } from '@/entities/project/api/list/get-projects';
import type { HomePageProps } from '@/views/home/ui/home-page';

type GetHomePageDataInput = {
  locale: string;
};

/**
 * 홈 화면 첫 진입에 필요한 프로젝트 미리보기와 hero photo 목록을 함께 조회합니다.
 *
 * @returns `items`에는 프로젝트 첫 페이지에서 최대 3개의 미리보기 항목이,
 * `photoItems`에는 photo storage 첫 조회 결과를 이미지 뷰어 계약으로 매핑한 목록이 담깁니다.
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

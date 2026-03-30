import { listPhotoFiles } from '@/entities/hero-photo/api/list-photo-files';
import type { HomePageProps } from '@/views/home/ui/home-page';

type GetHomePageDataInput = {
  locale: string;
};

/**
 * 홈 화면 첫 진입에 필요한 hero photo 목록과 locale만 조회합니다.
 *
 * 프로젝트 프리뷰는 스크롤 전환 또는 바텀 시트 열기 이후에만 실제로 필요하므로,
 * 서버 첫 렌더에서는 photo storage 결과만 우선 내려 홈 진입 속도를 확보합니다.
 *
 * @returns `photoItems`에는 이미지 뷰어 계약으로 매핑한 hero photo 목록이,
 * `locale`에는 후속 프로젝트 프리뷰 조회에 사용할 현재 locale이 담깁니다.
 */
export const getHomePageData = async ({ locale }: GetHomePageDataInput): Promise<HomePageProps> => {
  const photoItems = await listPhotoFiles()
    .then(items =>
      items.map((item, index) => ({
        alt: item.fileName || `Hero photo ${index + 1}`,
        src: item.publicUrl,
      })),
    )
    .catch(() => []);

  return {
    locale,
    photoItems,
  };
};

import { listPhotoFiles } from '@/entities/hero-photo/api/list-photo-files';
import type { HomePageProps } from '@/views/home/ui/home-page';

type GetHomePageDataInput = {
  locale: string;
};

/**
 * 홈 화면 첫 진입에 필요한 hero photo 조회를 시작하고, 기다리지 않고 promise로 넘깁니다.
 *
 * `await`하면 라우트 세그먼트가 storage 응답까지 멈춰 서고, 그동안 3D 캔버스는 마운트조차
 * 시작하지 못합니다. 사진은 첫 3D 프레임에 필요하지 않으므로(→ `useHomeHeroPhotoItems`)
 * 여기서는 요청만 띄우고 GLB 다운로드·캔버스 부팅과 병렬로 흐르게 둡니다.
 *
 * 프로젝트 프리뷰는 스크롤 전환 또는 바텀 시트 열기 이후에만 필요하므로 서버 첫 렌더에서
 * 아예 다루지 않습니다(→ `useHomeHeroProjectPreview`).
 *
 * @returns `photoItemsPromise`에는 이미지 뷰어 계약으로 매핑한 hero photo 목록 promise가,
 * `locale`에는 후속 프로젝트 프리뷰 조회에 사용할 현재 locale이 담깁니다.
 * 조회 실패는 빈 배열로 흡수하므로 promise는 reject되지 않습니다.
 */
export const getHomePageData = ({ locale }: GetHomePageDataInput): HomePageProps => ({
  locale,
  photoItemsPromise: listPhotoFiles()
    .then(items =>
      items.map((item, index) => ({
        alt: item.fileName || `Hero photo ${index + 1}`,
        src: item.publicUrl,
      })),
    )
    .catch(() => []),
});

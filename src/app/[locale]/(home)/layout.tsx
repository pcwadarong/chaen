import React, { type ReactNode } from 'react';

import { SceneAssetPreloader } from '@/entities/scene/ui/scene-asset-preloader';

type HomeLayoutProps = Readonly<{
  children: ReactNode;
}>;

/**
 * 홈 라우트 그룹 레이아웃입니다. 3D 자산 프리로드를 홈 진입 시에만 등록합니다.
 *
 * 프리로더를 홈 뷰(`HomePage`) 안에 두면 페이지 세그먼트가 `getHomePageData`를
 * 기다리는 동안 프리로드가 시작되지 않습니다(`loading.tsx`가 Suspense 경계를 만듭니다).
 * 레이아웃은 그 대기와 무관하게 먼저 스트리밍되므로, 여기 두면 GLB를 데이터 조회와
 * 병렬로 받으면서도 3D를 쓰지 않는 라우트에는 프리로드가 새지 않습니다.
 */
const HomeLayout = ({ children }: HomeLayoutProps) => (
  <>
    <SceneAssetPreloader />
    {children}
  </>
);

export default HomeLayout;

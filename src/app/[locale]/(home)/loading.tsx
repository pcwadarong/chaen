import React from 'react';

import { HomeRouteLoadingFrame } from '@/widgets/home-hero-scene/ui/home-route-loading-frame';

/**
 * 홈 라우트 전용 loading입니다.
 * locale 전역 스켈레톤 대신 홈 씬과 같은 로딩 패턴을 사용해 새로고침 시 이중 로딩 전환을 줄입니다.
 */
const HomeLoading = () => <HomeRouteLoadingFrame />;

export default HomeLoading;

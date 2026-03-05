import React from 'react';

import { getHomePageData, HomePage } from '@/views/home';

/** 홈 페이지 엔트리입니다. */
const HomeRoute = async ({
  params,
}: {
  params: Promise<{
    locale: string;
  }>;
}) => {
  const { locale } = await params;
  const pageData = await getHomePageData({ locale });

  return <HomePage {...pageData} />;
};

export default HomeRoute;

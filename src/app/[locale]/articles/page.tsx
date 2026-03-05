import React from 'react';

import { ArticlesPage, getArticlesPageData } from '@/views/articles';

/** 아티클 페이지 엔트리입니다. */
const ArticlesRoute = async ({
  params,
}: {
  params: Promise<{
    locale: string;
  }>;
}) => {
  const { locale } = await params;
  const pageData = await getArticlesPageData({ locale });

  return <ArticlesPage {...pageData} />;
};

export default ArticlesRoute;

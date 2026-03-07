import React from 'react';

import { ArticlesPage, getArticlesPageData } from '@/views/articles';

/** 아티클 페이지 엔트리입니다. */
const ArticlesRoute = async ({
  params,
  searchParams,
}: {
  params: Promise<{
    locale: string;
  }>;
  searchParams: Promise<{
    q?: string | string[];
    tag?: string | string[];
  }>;
}) => {
  const { locale } = await params;
  const { q, tag } = await searchParams;
  const pageData = await getArticlesPageData({ locale, query: q, tag });

  return <ArticlesPage {...pageData} />;
};

export default ArticlesRoute;

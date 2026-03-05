import React from 'react';

import { getArticles } from '@/entities/article/api/get-articles';
import { ArticlesPage } from '@/views/articles';

/** 아티클 페이지 엔트리입니다. */
const ArticlesRoute = async ({
  params,
}: {
  params: Promise<{
    locale: string;
  }>;
}) => {
  const { locale } = await params;
  const items = await getArticles(locale);

  return <ArticlesPage items={items} />;
};

export default ArticlesRoute;

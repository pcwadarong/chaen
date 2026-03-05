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
  const articlesPage = await getArticles({
    locale,
  });

  return (
    <ArticlesPage
      initialCursor={articlesPage.nextCursor}
      initialItems={articlesPage.items}
      locale={locale}
    />
  );
};

export default ArticlesRoute;

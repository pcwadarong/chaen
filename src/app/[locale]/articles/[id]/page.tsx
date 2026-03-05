import { notFound } from 'next/navigation';
import React from 'react';

import { getArticle } from '@/entities/article/api/get-article';
import { ArticleDetailPage } from '@/views/articles';

type ArticleDetailRouteProps = {
  params: Promise<{
    id: string;
    locale: string;
  }>;
};

/**
 * 아티클 상세 라우트 엔트리입니다.
 */
const ArticleDetailRoute = async ({ params }: ArticleDetailRouteProps) => {
  const { id, locale } = await params;
  const item = await getArticle(id, locale);
  if (!item) notFound();

  return <ArticleDetailPage item={item} locale={locale} />;
};

export default ArticleDetailRoute;

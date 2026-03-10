import { notFound } from 'next/navigation';
import React from 'react';

import { ArticleDetailPage, getArticleDetailPageData } from '@/views/articles';

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
  const { archivePage, initialCommentsPage, item } = await getArticleDetailPageData({
    articleId: id,
    locale,
  });
  if (!item) notFound();

  return (
    <ArticleDetailPage
      archivePage={archivePage}
      initialCommentsPage={initialCommentsPage}
      item={item}
      locale={locale}
    />
  );
};

export default ArticleDetailRoute;

import { getArticles } from '@/entities/article/api/get-articles';

import type { ArticlesPageProps } from '../ui/articles-page';

type GetArticlesPageDataInput = {
  locale: string;
};

/**
 * 아티클 목록 페이지의 초기 무한스크롤 데이터를 조회합니다.
 */
export const getArticlesPageData = async ({
  locale,
}: GetArticlesPageDataInput): Promise<ArticlesPageProps> => {
  const articlesPage = await getArticles({ locale });

  return {
    initialCursor: articlesPage.nextCursor,
    initialItems: articlesPage.items,
    locale,
  };
};

import { getArticles } from '@/entities/article/api/get-articles';
import { getPopularArticleTags } from '@/entities/article/api/get-popular-article-tags';
import { getTagLabelMapBySlugs } from '@/entities/tag/api/query-tags';

import type { ArticlesPageProps } from '../ui/articles-page';

type GetArticlesPageDataInput = {
  locale: string;
  query?: string | string[];
  tag?: string | string[];
};

/**
 * App Router searchParams의 q 값을 첫 번째 문자열로 정규화합니다.
 *
 * 동일한 키가 여러 번 들어오면 첫 번째 값만 사용하고 나머지는 무시합니다.
 */
export const normalizeSearchParams = (q: string | string[] | undefined): string => {
  const value = Array.isArray(q) ? q[0] : q;

  return value?.trim() ?? '';
};

/**
 * App Router searchParams의 tag 값을 첫 번째 문자열로 정규화합니다.
 */
export const normalizeTagParams = (tag: string | string[] | undefined): string => {
  const value = Array.isArray(tag) ? tag[0] : tag;

  return value?.trim().toLowerCase() ?? '';
};

/**
 * 아티클 목록 페이지의 초기 무한스크롤 데이터를 조회합니다.
 *
 * 서버에서 정규화한 query를 내려줘야 클라이언트 피드가 동일한 키로 초기화됩니다.
 */
export const getArticlesPageData = async ({
  locale,
  query,
  tag,
}: GetArticlesPageDataInput): Promise<ArticlesPageProps> => {
  const normalizedQuery = normalizeSearchParams(query);
  const normalizedTag = normalizedQuery ? '' : normalizeTagParams(tag);
  const [articlesPage, popularTags] = await Promise.all([
    getArticles({ locale, query: normalizedQuery, tag: normalizedTag }),
    getPopularArticleTags({ locale }),
  ]);
  const localizedTagLabels = await getTagLabelMapBySlugs({
    locale,
    slugs: popularTags.map(item => item.tag),
  });

  if (localizedTagLabels.schemaMissing) {
    throw new Error('[articles] 태그 label schema가 없습니다.');
  }

  return {
    activeTag: normalizedTag,
    initialCursor: articlesPage.nextCursor,
    initialItems: articlesPage.items,
    locale,
    popularTags: popularTags.map(item => ({
      ...item,
      label: localizedTagLabels.data.get(item.tag) ?? item.tag,
    })),
    searchQuery: normalizedQuery,
  };
};

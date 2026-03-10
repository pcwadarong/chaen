import { getArticles, getResolvedArticlesFirstPage } from '@/entities/article/api/get-articles';
import { getPopularArticleTags } from '@/entities/article/api/get-popular-article-tags';
import { getTagLabelMapBySlugs } from '@/entities/tag/api/query-tags';
import type { AppLocale } from '@/i18n/routing';
import { buildLocalizedPathname } from '@/shared/lib/seo/metadata';

import type { ArticlesPageProps } from '../ui/articles-page';

type GetArticlesPageDataInput = {
  locale: string;
  page: number;
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
 * App Router searchParams의 page 값을 양의 정수로 정규화합니다.
 *
 * 값이 없거나 비어 있으면 1페이지로 간주하고, 유효하지 않은 값은 null을 반환합니다.
 */
export const normalizePageParams = (page: string | string[] | undefined): number | null => {
  const value = Array.isArray(page) ? page[0] : page;
  const normalizedValue = value?.trim();

  if (!normalizedValue) return 1;
  if (!/^\d+$/.test(normalizedValue)) return null;

  const parsedPage = Number(normalizedValue);

  return Number.isSafeInteger(parsedPage) && parsedPage > 0 ? parsedPage : null;
};

type BuildArticlesPageHrefInput = {
  locale: string;
  page?: number;
  query?: string;
  tag?: string;
};

/**
 * 아티클 목록 페이지 href를 locale/search/tag/page 조합으로 생성합니다.
 */
export const buildArticlesPageHref = ({
  locale,
  page = 1,
  query = '',
  tag = '',
}: BuildArticlesPageHrefInput): string => {
  const pathname = buildLocalizedPathname({
    locale: locale as AppLocale,
    pathname: '/articles',
  });
  const searchParams = new URLSearchParams();
  const normalizedQuery = normalizeSearchParams(query);
  const normalizedTag = normalizedQuery ? '' : normalizeTagParams(tag);

  if (normalizedQuery) {
    searchParams.set('q', normalizedQuery);
  }

  if (normalizedTag) {
    searchParams.set('tag', normalizedTag);
  }

  if (page > 1) {
    searchParams.set('page', String(page));
  }

  const serializedSearchParams = searchParams.toString();

  return serializedSearchParams ? `${pathname}?${serializedSearchParams}` : pathname;
};

/**
 * 아티클 목록 페이지의 초기 무한스크롤 데이터를 조회합니다.
 *
 * 서버에서 정규화한 query를 내려줘야 클라이언트 피드가 동일한 키로 초기화됩니다.
 */
export const getArticlesPageData = async ({
  locale,
  page,
  query,
  tag,
}: GetArticlesPageDataInput): Promise<ArticlesPageProps> => {
  const normalizedQuery = normalizeSearchParams(query);
  const normalizedTag = normalizedQuery ? '' : normalizeTagParams(tag);
  const [resolvedArticlesPage, popularTags] = await Promise.all([
    getResolvedArticlesFirstPage({ locale, query: normalizedQuery, tag: normalizedTag }),
    getPopularArticleTags({ locale }),
  ]);
  let currentPage = 1;
  let articlesPage = resolvedArticlesPage.page;

  while (currentPage < page && articlesPage.nextCursor) {
    articlesPage = await getArticles({
      cursor: articlesPage.nextCursor,
      locale: resolvedArticlesPage.resolvedLocale,
      query: normalizedQuery,
      tag: normalizedTag,
    });
    currentPage += 1;
  }

  const localizedTagLabels = await getTagLabelMapBySlugs({
    locale,
    slugs: popularTags.map(item => item.tag),
  });

  if (localizedTagLabels.schemaMissing) {
    throw new Error('[articles] 태그 label schema가 없습니다.');
  }

  return {
    activeTag: normalizedTag,
    feedLocale: resolvedArticlesPage.resolvedLocale,
    initialCursor: articlesPage.nextCursor,
    initialItems: articlesPage.items,
    pagination: {
      currentPage,
      nextHref: articlesPage.nextCursor
        ? buildArticlesPageHref({
            locale,
            page: currentPage + 1,
            query: normalizedQuery,
            tag: normalizedTag,
          })
        : null,
      previousHref:
        currentPage > 1
          ? buildArticlesPageHref({
              locale,
              page: currentPage - 1,
              query: normalizedQuery,
              tag: normalizedTag,
            })
          : null,
    },
    popularTags: popularTags.map(item => ({
      ...item,
      label: localizedTagLabels.data.get(item.tag) ?? item.tag,
    })),
    searchQuery: normalizedQuery,
  };
};

import {
  getArticles,
  getResolvedArticlesFirstPage,
} from '@/entities/article/api/list/get-articles';
import type { AppLocale } from '@/i18n/routing';
import { buildLocalizedPathname } from '@/shared/lib/seo/metadata';
import {
  normalizeCursorHistoryParams,
  normalizeCursorParams,
  normalizeSearchParams,
  normalizeTagParams,
} from '@/views/articles/model/get-articles-page-data';
import type { ArticlesPageProps } from '@/views/articles/ui/articles-page';

type GetArticleTagPageDataInput = {
  cursor?: string | string[];
  cursorHistory?: string | string[];
  locale: string;
  page: number;
  query?: string | string[];
  tag: string;
};

type BuildArticleTagPageHrefInput = {
  cursor?: string | null;
  cursorHistory?: string[];
  locale: string;
  page?: number;
  query?: string;
  tag: string;
};

/**
 * 태그 전용 아티클 페이지 href를 locale/search/cursor 조합으로 생성합니다.
 */
export const buildArticleTagPageHref = ({
  cursor,
  cursorHistory = [],
  locale,
  page = 1,
  query = '',
  tag,
}: BuildArticleTagPageHrefInput): string => {
  const normalizedTag = normalizeTagParams(tag);
  const pathname = buildLocalizedPathname({
    locale: locale as AppLocale,
    pathname: `/articles/tag/${normalizedTag}`,
  });
  const searchParams = new URLSearchParams();
  const normalizedQuery = normalizeSearchParams(query);

  if (normalizedQuery) {
    searchParams.set('q', normalizedQuery);
  }

  if (page > 1) {
    searchParams.set('page', String(page));
  }

  if (cursor) {
    searchParams.set('cursor', cursor);
  }

  if (cursorHistory.length > 0) {
    searchParams.set('cursorHistory', cursorHistory.join(','));
  }

  const serializedSearchParams = searchParams.toString();

  return serializedSearchParams ? `${pathname}?${serializedSearchParams}` : pathname;
};

/**
 * 태그 전용 아티클 페이지의 초기 피드 데이터를 조회합니다.
 */
export const getArticleTagPageData = async ({
  cursor,
  cursorHistory,
  locale,
  page,
  query,
  tag,
}: GetArticleTagPageDataInput): Promise<ArticlesPageProps> => {
  const normalizedCursor = normalizeCursorParams(cursor);
  const normalizedCursorHistory = normalizeCursorHistoryParams(cursorHistory);
  const normalizedQuery = normalizeSearchParams(query);
  const normalizedTag = normalizeTagParams(tag);
  const shouldUseDirectCursor = page > 1 && normalizedCursor;
  let currentCursor: string | null = null;
  const currentCursorHistory = normalizedCursorHistory;
  let currentPage = 1;
  let feedLocale = locale.toLowerCase();
  let articlesPage;

  if (shouldUseDirectCursor) {
    articlesPage = await getArticles({
      cursor: normalizedCursor,
      locale: feedLocale,
      query: normalizedQuery,
      tag: normalizedTag,
    });
    currentCursor = normalizedCursor;
    currentPage = articlesPage.items.length === 0 ? page - 1 : page;
  } else {
    const resolvedArticlesPage = await getResolvedArticlesFirstPage({
      locale,
      query: normalizedQuery,
      tag: normalizedTag,
    });
    feedLocale = resolvedArticlesPage.resolvedLocale;
    articlesPage = resolvedArticlesPage.page;
  }

  return {
    activeTag: normalizedTag,
    feedLocale,
    initialCursor: articlesPage.nextCursor,
    initialItems: articlesPage.items,
    locale,
    pagination: {
      currentPage,
      nextHref: articlesPage.nextCursor
        ? buildArticleTagPageHref({
            cursor: articlesPage.nextCursor,
            cursorHistory: currentCursor ? [...currentCursorHistory, currentCursor] : [],
            locale,
            page: currentPage + 1,
            query: normalizedQuery,
            tag: normalizedTag,
          })
        : null,
      previousHref:
        currentPage > 1
          ? buildArticleTagPageHref({
              cursor: currentCursorHistory.at(-1) ?? null,
              cursorHistory: currentCursorHistory.slice(0, -1),
              locale,
              page: currentPage - 1,
              query: normalizedQuery,
              tag: normalizedTag,
            })
          : null,
    },
    searchQuery: normalizedQuery,
  };
};

import {
  getArticles,
  getResolvedArticlesFirstPage,
} from '@/entities/article/api/list/get-articles';
import type { AppLocale } from '@/i18n/routing';
import { buildLocalizedPathname } from '@/shared/lib/seo/metadata';
import type { ArticlesPageProps } from '@/views/articles/ui/articles-page';

type GetArticlesPageDataInput = {
  cursor?: string | string[];
  cursorHistory?: string | string[];
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
  cursor?: string | null;
  cursorHistory?: string[];
  locale: string;
  page?: number;
  query?: string;
  tag?: string;
};

type IsSupportedArticlesPageRequestInput = {
  cursor?: string | string[];
  page: number;
};

/**
 * App Router searchParams의 cursor 값을 첫 번째 문자열로 정규화합니다.
 */
export const normalizeCursorParams = (cursor: string | string[] | undefined): string | null => {
  const value = Array.isArray(cursor) ? cursor[0] : cursor;
  const normalizedValue = value?.trim();

  return normalizedValue ? normalizedValue : null;
};

/**
 * App Router searchParams의 cursorHistory 값을 cursor 배열로 정규화합니다.
 */
export const normalizeCursorHistoryParams = (
  cursorHistory: string | string[] | undefined,
): string[] => {
  const value = Array.isArray(cursorHistory) ? cursorHistory[0] : cursorHistory;
  const normalizedValue = value?.trim();

  if (!normalizedValue) return [];

  return normalizedValue
    .split(',')
    .map(cursor => cursor.trim())
    .filter(Boolean);
};

/**
 * 2페이지 이상 진입은 cursor가 있을 때만 지원합니다.
 *
 * keyset pagination은 page 번호만으로 목표 위치를 복원할 수 없으므로,
 * 수동 deep-link(`?page=N`)는 허용하지 않고 내부 cursor 링크만 정상 경로로 간주합니다.
 */
export const isSupportedArticlesPageRequest = ({
  cursor,
  page,
}: IsSupportedArticlesPageRequestInput): boolean => {
  if (page <= 1) return true;

  return normalizeCursorParams(cursor) !== null;
};

/**
 * 아티클 목록 페이지 href를 locale/search/tag/page 조합으로 생성합니다.
 */
export const buildArticlesPageHref = ({
  cursor,
  cursorHistory = [],
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
 * 아티클 목록 페이지의 초기 무한스크롤 데이터를 조회합니다.
 *
 * 서버에서 정규화한 query를 내려줘야 클라이언트 피드가 동일한 키로 초기화됩니다.
 */
export const getArticlesPageData = async ({
  cursor,
  cursorHistory,
  locale,
  page,
  query,
  tag,
}: GetArticlesPageDataInput): Promise<ArticlesPageProps> => {
  const normalizedCursor = normalizeCursorParams(cursor);
  const normalizedCursorHistory = normalizeCursorHistoryParams(cursorHistory);
  const normalizedQuery = normalizeSearchParams(query);
  const normalizedTag = normalizedQuery ? '' : normalizeTagParams(tag);
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
        ? buildArticlesPageHref({
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
          ? buildArticlesPageHref({
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

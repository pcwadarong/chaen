import { getErrorMessage } from '@/shared/lib/error/get-error-message';

export type OffsetPaginationFeedQueryParams = Record<string, string | null | undefined>;

export type OffsetPaginationFeedPage<T> = {
  items: T[];
  nextCursor: string | null;
  totalCount?: number | null;
};

type ResolveOffsetPaginationLoadMoreOptions<T> = {
  currentCursor: string | null;
  currentItems: T[];
  limit: number;
  loadPage: (params: {
    cursor: string;
    limit: number;
    locale: string;
    queryParams?: OffsetPaginationFeedQueryParams;
  }) => Promise<OffsetPaginationFeedPage<T>>;
  locale: string;
  mergeItems?: (previousItems: T[], incomingItems: T[]) => T[];
  queryParams?: OffsetPaginationFeedQueryParams;
};

type ResolveOffsetPaginationLoadMoreResult<T> = {
  errorMessage: string | null;
  items: T[];
  nextCursor: string | null;
};

/**
 * 다음 offset 페이지를 불러온 뒤 리스트/커서/에러 상태를 순수하게 계산합니다.
 *
 * 훅 바깥에서 검증할 수 있도록 비동기 로딩 결과를 데이터 형태로만 반환합니다.
 *
 * @param options 현재 cursor, 기존 items, loader, 병합 규칙 등 로딩에 필요한 옵션입니다.
 * @returns append/merge가 반영된 items, 다음 cursor, 사용자용 errorMessage를 반환합니다.
 */
export const resolveOffsetPaginationLoadMore = async <T>({
  currentCursor,
  currentItems,
  limit,
  loadPage,
  locale,
  mergeItems,
  queryParams,
}: ResolveOffsetPaginationLoadMoreOptions<T>): Promise<
  ResolveOffsetPaginationLoadMoreResult<T>
> => {
  if (!currentCursor) {
    return {
      errorMessage: null,
      items: currentItems,
      nextCursor: currentCursor,
    };
  }

  try {
    const payload = await loadPage({
      cursor: currentCursor,
      limit,
      locale,
      queryParams,
    });

    return {
      errorMessage: null,
      items: mergeItems
        ? mergeItems(currentItems, payload.items)
        : [...currentItems, ...payload.items],
      nextCursor: payload.nextCursor,
    };
  } catch (error) {
    return {
      errorMessage: getErrorMessage(error),
      items: currentItems,
      nextCursor: currentCursor,
    };
  }
};

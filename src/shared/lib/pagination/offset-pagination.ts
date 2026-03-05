type BuildOffsetPageParams<T> = {
  cursor?: string | null;
  items: T[];
  limit?: number;
};

type OffsetPage<T> = {
  items: T[];
  nextCursor: string | null;
};

const DEFAULT_LIMIT = 12;
const MAX_LIMIT = 30;

/**
 * 문자열 cursor를 안전한 offset 숫자로 정규화합니다.
 */
export const parseOffsetCursor = (cursor?: string | null): number => {
  if (!cursor) return 0;

  const parsed = Number.parseInt(cursor, 10);

  if (Number.isNaN(parsed) || parsed < 0) return 0;

  return parsed;
};

/**
 * 요청 limit을 안전 범위로 정규화합니다.
 */
export const parseOffsetLimit = (limit?: number): number => {
  if (!limit || Number.isNaN(limit) || limit < 1) return DEFAULT_LIMIT;

  return Math.min(limit, MAX_LIMIT);
};

/**
 * offset 기반으로 목록 페이지를 계산합니다.
 */
export const buildOffsetPage = <T>({
  cursor,
  items,
  limit,
}: BuildOffsetPageParams<T>): OffsetPage<T> => {
  const offset = parseOffsetCursor(cursor);
  const pageSize = parseOffsetLimit(limit);
  const end = offset + pageSize;
  const pageItems = items.slice(offset, end);
  const nextCursor = end < items.length ? String(end) : null;

  return {
    items: pageItems,
    nextCursor,
  };
};

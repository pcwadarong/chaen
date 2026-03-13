export type CreatedAtIdCursor = {
  createdAt: string;
  id: string;
};

export type PublishedAtIdCursor = {
  id: string;
  publishedAt: string;
};

export type LocaleAwareCreatedAtIdCursor = CreatedAtIdCursor & {
  locale: string;
};

export type LocaleAwarePublishedAtIdCursor = PublishedAtIdCursor & {
  locale: string;
};

const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 30;

/**
 * created_at + id 조합을 URL에 안전한 keyset cursor 문자열로 직렬화합니다.
 */
export const serializeCreatedAtIdCursor = ({ createdAt, id }: CreatedAtIdCursor): string =>
  Buffer.from(JSON.stringify({ createdAt, id }), 'utf-8').toString('base64url');

/**
 * keyset cursor 문자열을 created_at + id 조합으로 복원합니다.
 */
export const parseCreatedAtIdCursor = (cursor?: string | null): CreatedAtIdCursor | null => {
  if (!cursor) return null;

  try {
    const decoded = Buffer.from(cursor, 'base64url').toString('utf-8');
    const parsed = JSON.parse(decoded) as Partial<CreatedAtIdCursor>;

    if (typeof parsed.createdAt !== 'string' || typeof parsed.id !== 'string') return null;

    return {
      createdAt: parsed.createdAt,
      id: parsed.id,
    };
  } catch {
    return null;
  }
};

/**
 * keyset cursor 문자열을 publish_at + id 조합으로 복원합니다.
 */
export const parsePublishedAtIdCursor = (cursor?: string | null): PublishedAtIdCursor | null => {
  if (!cursor) return null;

  try {
    const decoded = Buffer.from(cursor, 'base64url').toString('utf-8');
    const parsed = JSON.parse(decoded) as Partial<PublishedAtIdCursor>;

    if (typeof parsed.publishedAt !== 'string' || typeof parsed.id !== 'string') return null;

    return {
      id: parsed.id,
      publishedAt: parsed.publishedAt,
    };
  } catch {
    return null;
  }
};

/**
 * keyset cursor 문자열을 created_at + id + locale 조합으로 복원합니다.
 */
export const parseLocaleAwareCreatedAtIdCursor = (
  cursor?: string | null,
): LocaleAwareCreatedAtIdCursor | null => {
  if (!cursor) return null;

  try {
    const decoded = Buffer.from(cursor, 'base64url').toString('utf-8');
    const parsed = JSON.parse(decoded) as Partial<LocaleAwareCreatedAtIdCursor>;

    if (
      typeof parsed.createdAt !== 'string' ||
      typeof parsed.id !== 'string' ||
      typeof parsed.locale !== 'string'
    ) {
      return null;
    }

    return {
      createdAt: parsed.createdAt,
      id: parsed.id,
      locale: parsed.locale,
    };
  } catch {
    return null;
  }
};

/**
 * keyset cursor 문자열을 publish_at + id + locale 조합으로 복원합니다.
 */
export const parseLocaleAwarePublishedAtIdCursor = (
  cursor?: string | null,
): LocaleAwarePublishedAtIdCursor | null => {
  if (!cursor) return null;

  try {
    const decoded = Buffer.from(cursor, 'base64url').toString('utf-8');
    const parsed = JSON.parse(decoded) as Partial<LocaleAwarePublishedAtIdCursor>;

    if (
      typeof parsed.publishedAt !== 'string' ||
      typeof parsed.id !== 'string' ||
      typeof parsed.locale !== 'string'
    ) {
      return null;
    }

    return {
      id: parsed.id,
      locale: parsed.locale,
      publishedAt: parsed.publishedAt,
    };
  } catch {
    return null;
  }
};

/**
 * keyset 페이지 요청 limit을 안전 범위로 정규화합니다.
 */
export const parseKeysetLimit = (limit?: number): number => {
  if (!limit || Number.isNaN(limit) || limit < 1) return DEFAULT_LIMIT;

  return Math.min(limit, MAX_LIMIT);
};

/**
 * 내림차순 created_at + id 정렬 기준 다음 페이지 cursor를 계산합니다.
 *
 * Supabase 쿼리에서 `limit + 1`개를 조회한 뒤 마지막 1개를 hasMore 판별용으로 사용합니다.
 */
export const buildCreatedAtIdPage = <T extends CreatedAtIdCursor>({
  limit,
  rows,
}: {
  limit: number;
  rows: T[];
}): {
  items: T[];
  nextCursor: string | null;
} => {
  const hasMore = rows.length > limit;
  const items = rows.slice(0, limit);
  const lastItem = items.at(-1);

  return {
    items,
    nextCursor: hasMore && lastItem ? serializeCreatedAtIdCursor(lastItem) : null,
  };
};

/**
 * publish_at + id 조합을 URL에 안전한 keyset cursor 문자열로 직렬화합니다.
 */
export const serializePublishedAtIdCursor = ({ id, publishedAt }: PublishedAtIdCursor): string =>
  Buffer.from(JSON.stringify({ id, publishedAt }), 'utf-8').toString('base64url');

/**
 * 내림차순 publish_at + id 정렬 기준 다음 페이지 cursor를 계산합니다.
 *
 * Supabase 쿼리에서 `limit + 1`개를 조회한 뒤 마지막 1개를 hasMore 판별용으로 사용합니다.
 */
export const buildPublishedAtIdPage = <T extends PublishedAtIdCursor>({
  limit,
  rows,
}: {
  limit: number;
  rows: T[];
}): {
  items: T[];
  nextCursor: string | null;
} => {
  const hasMore = rows.length > limit;
  const items = rows.slice(0, limit);
  const lastItem = items.at(-1);

  return {
    items,
    nextCursor: hasMore && lastItem ? serializePublishedAtIdCursor(lastItem) : null,
  };
};

/**
 * created_at + id + locale 조합을 URL에 안전한 keyset cursor 문자열로 직렬화합니다.
 */
export const serializeLocaleAwareCreatedAtIdCursor = ({
  createdAt,
  id,
  locale,
}: LocaleAwareCreatedAtIdCursor): string =>
  Buffer.from(JSON.stringify({ createdAt, id, locale }), 'utf-8').toString('base64url');

/**
 * publish_at + id + locale 조합을 URL에 안전한 keyset cursor 문자열로 직렬화합니다.
 */
export const serializeLocaleAwarePublishedAtIdCursor = ({
  id,
  locale,
  publishedAt,
}: LocaleAwarePublishedAtIdCursor): string =>
  Buffer.from(JSON.stringify({ id, locale, publishedAt }), 'utf-8').toString('base64url');

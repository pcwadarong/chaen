import { unstable_cacheTag as cacheTag } from 'next/cache';

import {
  buildContentLocaleFallbackChain,
  resolveFirstAvailableLocaleValue,
} from '@/shared/lib/i18n/content-locale-fallback';
import {
  buildCreatedAtIdPage,
  parseKeysetLimit,
  parseLocaleAwareCreatedAtIdCursor,
  serializeLocaleAwareCreatedAtIdCursor,
} from '@/shared/lib/pagination/keyset-pagination';
import { buildReferencedPublicContentFilter } from '@/shared/lib/supabase/build-public-content-filter';
import { hasSupabaseEnv } from '@/shared/lib/supabase/config';
import { createOptionalPublicServerSupabaseClient } from '@/shared/lib/supabase/public-server';

import 'server-only';

import { ARTICLES_CACHE_TAG } from '../model/cache-tags';
import type { ArticleArchivePage, ArticleDetailListItem } from '../model/types';

import { type ArticleTranslationRow, mapArticleDetailListItems } from './map-article-translation';

type GetArticleDetailListOptions = {
  cursor?: string | null;
  limit?: number;
  locale: string;
};

const isMissingArticleContentSchemaError = (message: string) => {
  const normalizedMessage = message.toLowerCase();

  return (
    normalizedMessage.includes('articles') || normalizedMessage.includes('article_translations')
  );
};

/**
 * content schema(`articles` + `article_translations`) 기준 상세 아카이브 목록을 조회합니다.
 */
const fetchArticleDetailListFromContentSchema = async (
  locale: string,
  cursor: string | null | undefined,
  pageSize: number,
): Promise<{ data: ArticleArchivePage; schemaMissing: boolean }> => {
  const supabase = createOptionalPublicServerSupabaseClient();
  if (!supabase) return { data: { items: [], nextCursor: null }, schemaMissing: false };

  const parsedCursor = parseLocaleAwareCreatedAtIdCursor(cursor);
  const nowIsoString = new Date().toISOString();
  const translationsQuery = supabase
    .from('article_translations')
    .select('article_id,title,description,articles!inner(created_at,slug,visibility,publish_at)')
    .eq('locale', locale)
    .eq('articles.visibility', 'public')
    .or(buildReferencedPublicContentFilter({ cursor: parsedCursor, nowIsoString }), {
      referencedTable: 'articles',
    })
    .order('created_at', { ascending: false, referencedTable: 'articles' })
    .order('article_id', { ascending: false });

  const { data: translationRows, error: translationError } = await translationsQuery.limit(
    pageSize + 1,
  );

  if (translationError) {
    if (isMissingArticleContentSchemaError(translationError.message)) {
      return { data: { items: [], nextCursor: null }, schemaMissing: true };
    }

    throw new Error(`[articles] 상세 목록 번역 조회 실패: ${translationError.message}`);
  }

  const rows = mapArticleDetailListItems((translationRows ?? []) as ArticleTranslationRow[]);
  const page = buildCreatedAtIdPage({
    limit: pageSize,
    rows: rows.map(row => ({
      ...row,
      createdAt: row.created_at,
    })),
  });

  return {
    data: {
      items: page.items.map(({ createdAt: _createdAt, ...item }) => item as ArticleDetailListItem),
      nextCursor:
        page.nextCursor && page.items.at(-1)
          ? serializeLocaleAwareCreatedAtIdCursor({
              createdAt: page.items.at(-1)?.createdAt ?? '',
              id: page.items.at(-1)?.id ?? '',
              locale,
            })
          : null,
    },
    schemaMissing: false,
  };
};

const fetchArticleDetailListByLocale = async (
  locale: string,
  cursor: string | null | undefined,
  pageSize: number,
): Promise<ArticleArchivePage> => {
  const articleDetailList = await fetchArticleDetailListFromContentSchema(locale, cursor, pageSize);
  if (articleDetailList.schemaMissing) {
    throw new Error('[articles] content schema가 없습니다.');
  }

  return articleDetailList.data;
};

/**
 * 아티클 상세 아카이브 목록을 `use cache`로 캐시합니다.
 */
const readCachedArticleDetailList = async (input: {
  cursor: string | null | undefined;
  normalizedLocale: string;
  pageSize: number;
}): Promise<ArticleArchivePage> => {
  'use cache';

  cacheTag(ARTICLES_CACHE_TAG);

  const parsedCursor = parseLocaleAwareCreatedAtIdCursor(input.cursor);
  const localeFallbackChain = parsedCursor
    ? [parsedCursor.locale]
    : buildContentLocaleFallbackChain(input.normalizedLocale);

  const page = await resolveFirstAvailableLocaleValue({
    fetchByLocale: candidateLocale =>
      fetchArticleDetailListByLocale(candidateLocale, input.cursor, input.pageSize),
    hasValue: value => value.items.length > 0,
    locales: localeFallbackChain,
  });

  return page ?? { items: [], nextCursor: null };
};

/**
 * 아티클 상세 좌측 아카이브 목록의 cursor 기반 페이지를 가져옵니다.
 */
export const getArticleDetailList = async ({
  cursor,
  limit,
  locale,
}: GetArticleDetailListOptions): Promise<ArticleArchivePage> => {
  if (!hasSupabaseEnv()) return { items: [], nextCursor: null };

  const normalizedLocale = locale.toLowerCase();
  const pageSize = parseKeysetLimit(limit);

  return readCachedArticleDetailList({
    cursor,
    normalizedLocale,
    pageSize,
  });
};

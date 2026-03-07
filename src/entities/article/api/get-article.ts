import { unstable_cache } from 'next/cache';

import { getRelatedTagSlugs } from '@/entities/tag/api/query-tags';
import { hasSupabaseEnv } from '@/shared/lib/supabase/config';
import { createOptionalPublicServerSupabaseClient } from '@/shared/lib/supabase/public-server';
import {
  isLocaleColumnMissingError,
  resolveLocaleAwareData,
} from '@/shared/lib/supabase/resolve-locale-aware-data';

import 'server-only';

import { ARTICLES_CACHE_TAG, createArticleCacheTag } from '../model/cache-tags';
import type { Article } from '../model/types';

/**
 * locale 컬럼을 사용하는 단일 아티클을 조회합니다.
 */
const fetchArticleByLocale = async (
  articleId: string,
  locale: string,
): Promise<{ data: Article | null; localeColumnMissing: boolean }> => {
  const supabase = createOptionalPublicServerSupabaseClient();
  if (!supabase) return { data: null, localeColumnMissing: false };

  const { data, error } = await supabase
    .from('articles')
    .select('*')
    .eq('id', articleId)
    .eq('locale', locale)
    .maybeSingle<Article>();

  if (error) {
    if (isLocaleColumnMissingError(error.message)) {
      return {
        data: null,
        localeColumnMissing: true,
      };
    }

    throw new Error(`[articles] locale 단일 조회 실패: ${error.message}`);
  }

  if (!data) {
    return {
      data,
      localeColumnMissing: false,
    };
  }

  const relatedTags = await getRelatedTagSlugs({
    entityColumn: 'article_id',
    entityId: articleId,
    locale,
    relationTable: 'article_tags',
  });

  return {
    data: relatedTags.schemaMissing ? data : { ...data, tags: relatedTags.data },
    localeColumnMissing: false,
  };
};

/**
 * locale 컬럼이 없는 기존 스키마를 위한 단일 아티클 조회입니다.
 */
const fetchArticleLegacy = async (articleId: string): Promise<Article | null> => {
  const supabase = createOptionalPublicServerSupabaseClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('articles')
    .select('*')
    .eq('id', articleId)
    .maybeSingle<Article>();

  if (error) {
    throw new Error(`[articles] 단일 조회 실패: ${error.message}`);
  }

  return data;
};

/**
 * 아티클 상세 데이터를 On-demand ISR 태그 기반으로 캐시해서 가져옵니다.
 * `revalidateTag('articles')` 또는 `revalidateTag('article:{id}')`로 즉시 갱신할 수 있습니다.
 */
export const getArticle = async (
  articleId: string,
  targetLocale: string,
): Promise<Article | null> => {
  const cacheScope = hasSupabaseEnv() ? 'supabase-enabled' : 'supabase-disabled';
  if (cacheScope === 'supabase-disabled') return null;

  const normalizedLocale = targetLocale.toLowerCase();
  const getCachedArticle = unstable_cache(
    async () =>
      resolveLocaleAwareData<Article | null>({
        emptyData: null,
        fallbackLocale: 'ko',
        fetchByLocale: locale => fetchArticleByLocale(articleId, locale),
        fetchLegacy: () => fetchArticleLegacy(articleId),
        isEmptyData: item => item === null,
        targetLocale: normalizedLocale,
      }),
    ['article', cacheScope, articleId, normalizedLocale],
    {
      tags: [ARTICLES_CACHE_TAG, createArticleCacheTag(articleId)],
      revalidate: false,
    },
  );

  return getCachedArticle();
};

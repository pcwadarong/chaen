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

const isMissingArticleShadowSchemaError = (message: string) => {
  const normalizedMessage = message.toLowerCase();

  return (
    normalizedMessage.includes('articles_v2') || normalizedMessage.includes('article_translations')
  );
};

type ArticleBaseRow = Pick<
  Article,
  'created_at' | 'id' | 'thumbnail_url' | 'updated_at' | 'view_count'
>;

type ArticleTranslationRow = Pick<Article, 'content' | 'description' | 'title'> & {
  article_id: string;
};

/**
 * shadow schema(`articles_v2` + `article_translations`)에서 locale별 단일 아티클을 조회합니다.
 */
const fetchArticleFromShadowSchema = async (
  articleId: string,
  locale: string,
): Promise<{ data: Article | null; schemaMissing: boolean }> => {
  const supabase = createOptionalPublicServerSupabaseClient();
  if (!supabase) return { data: null, schemaMissing: false };

  const { data: translation, error: translationError } = await supabase
    .from('article_translations')
    .select('article_id,title,description,content')
    .eq('article_id', articleId)
    .eq('locale', locale)
    .maybeSingle<ArticleTranslationRow>();

  if (translationError) {
    if (isMissingArticleShadowSchemaError(translationError.message)) {
      return { data: null, schemaMissing: true };
    }

    throw new Error(`[articles] shadow 번역 조회 실패: ${translationError.message}`);
  }

  if (!translation) {
    return { data: null, schemaMissing: false };
  }

  const { data: articleBase, error: articleBaseError } = await supabase
    .from('articles_v2')
    .select('id,thumbnail_url,created_at,updated_at,view_count')
    .eq('id', articleId)
    .maybeSingle<ArticleBaseRow>();

  if (articleBaseError) {
    if (isMissingArticleShadowSchemaError(articleBaseError.message)) {
      return { data: null, schemaMissing: true };
    }

    throw new Error(`[articles] shadow base 조회 실패: ${articleBaseError.message}`);
  }

  if (!articleBase) {
    return { data: null, schemaMissing: false };
  }

  const shadowTags = await getRelatedTagSlugs({
    entityColumn: 'article_id',
    entityId: articleId,
    relationTable: 'article_tags_v2',
  });

  const legacyTags = shadowTags.schemaMissing
    ? await getRelatedTagSlugs({
        entityColumn: 'article_id',
        entityId: articleId,
        locale,
        relationTable: 'article_tags',
      })
    : shadowTags;

  return {
    data: {
      ...articleBase,
      ...translation,
      tags: legacyTags.schemaMissing ? null : legacyTags.data,
    },
    schemaMissing: false,
  };
};

/**
 * locale 컬럼을 사용하는 단일 아티클을 조회합니다.
 */
const fetchArticleByLocaleLegacy = async (
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
 * shadow schema를 우선 사용하고, 미배포 환경에서는 기존 locale row 스키마로 fallback합니다.
 */
const fetchArticleByLocale = async (
  articleId: string,
  locale: string,
): Promise<{ data: Article | null; localeColumnMissing: boolean }> => {
  const shadowArticle = await fetchArticleFromShadowSchema(articleId, locale);
  if (!shadowArticle.schemaMissing) {
    return {
      data: shadowArticle.data,
      localeColumnMissing: false,
    };
  }

  return fetchArticleByLocaleLegacy(articleId, locale);
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

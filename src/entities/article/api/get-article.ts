import { unstable_cache } from 'next/cache';

import { getRelatedTagSlugs } from '@/entities/tag/api/query-tags';
import { hasSupabaseEnv } from '@/shared/lib/supabase/config';
import { CONTENT_SHADOW_SCHEMA } from '@/shared/lib/supabase/content-shadow-schema';
import { createOptionalPublicServerSupabaseClient } from '@/shared/lib/supabase/public-server';

import 'server-only';

import { ARTICLES_CACHE_TAG, createArticleCacheTag } from '../model/cache-tags';
import type { Article } from '../model/types';

import { mapShadowArticle, type ShadowArticleTranslationRow } from './map-shadow-article';

const isMissingArticleShadowSchemaError = (message: string) => {
  const normalizedMessage = message.toLowerCase();

  return (
    normalizedMessage.includes(CONTENT_SHADOW_SCHEMA.articles) ||
    normalizedMessage.includes(CONTENT_SHADOW_SCHEMA.articleTranslations)
  );
};

/**
 * content schema(`articles` + `article_translations`)에서 locale별 단일 아티클을 조회합니다.
 */
const fetchArticleFromShadowSchema = async (
  articleId: string,
  locale: string,
): Promise<{ data: Article | null; schemaMissing: boolean }> => {
  const supabase = createOptionalPublicServerSupabaseClient();
  if (!supabase) return { data: null, schemaMissing: false };

  const { data: translation, error: translationError } = await supabase
    .from(CONTENT_SHADOW_SCHEMA.articleTranslations)
    .select(
      'article_id,title,description,content,articles!inner(id,thumbnail_url,created_at,updated_at,view_count)',
    )
    .eq('article_id', articleId)
    .eq('locale', locale)
    .maybeSingle<ShadowArticleTranslationRow>();

  if (translationError) {
    if (isMissingArticleShadowSchemaError(translationError.message)) {
      return { data: null, schemaMissing: true };
    }

    throw new Error(`[articles] shadow 번역 조회 실패: ${translationError.message}`);
  }

  if (!translation) {
    return { data: null, schemaMissing: false };
  }

  const shadowTags = await getRelatedTagSlugs({
    entityColumn: 'article_id',
    entityId: articleId,
    relationTable: CONTENT_SHADOW_SCHEMA.articleTags,
  });
  if (shadowTags.schemaMissing) {
    throw new Error('[articles] 태그 relation schema가 없습니다.');
  }

  return {
    data: mapShadowArticle(translation, shadowTags.data),
    schemaMissing: false,
  };
};

const fetchArticleByLocale = async (articleId: string, locale: string): Promise<Article | null> => {
  const shadowArticle = await fetchArticleFromShadowSchema(articleId, locale);
  if (shadowArticle.schemaMissing) {
    throw new Error('[articles] shadow content schema가 없습니다.');
  }

  return shadowArticle.data;
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
    async () => {
      const localizedArticle = await fetchArticleByLocale(articleId, normalizedLocale);
      if (localizedArticle || normalizedLocale === 'ko') return localizedArticle;

      return fetchArticleByLocale(articleId, 'ko');
    },
    ['article', cacheScope, articleId, normalizedLocale],
    {
      tags: [ARTICLES_CACHE_TAG, createArticleCacheTag(articleId)],
      revalidate: false,
    },
  );

  return getCachedArticle();
};

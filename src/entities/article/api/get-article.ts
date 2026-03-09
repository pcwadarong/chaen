import { unstable_cache } from 'next/cache';

import { getRelatedTagSlugs } from '@/entities/tag/api/query-tags';
import { hasSupabaseEnv } from '@/shared/lib/supabase/config';
import { createOptionalPublicServerSupabaseClient } from '@/shared/lib/supabase/public-server';

import 'server-only';

import { ARTICLES_CACHE_TAG, createArticleCacheTag } from '../model/cache-tags';
import { buildArticleLocaleFallbackChain } from '../model/locale-fallback';
import type { Article } from '../model/types';

import {
  type ArticleTranslationFallbackRpcRow,
  mapArticle,
  mapArticleFallbackRpcRow,
} from './map-article-translation';

const isMissingArticleShadowSchemaError = (message: string) => {
  const normalizedMessage = message.toLowerCase();

  return (
    normalizedMessage.includes('get_article_translation_with_fallback') ||
    normalizedMessage.includes('articles') ||
    normalizedMessage.includes('article_translations')
  );
};

/**
 * content schema RPC에서 fallback 우선순위가 반영된 단일 아티클 번역을 조회합니다.
 */
const fetchArticleFromShadowSchema = async (
  articleId: string,
  localeFallbackChain: string[],
): Promise<{ data: Article | null; schemaMissing: boolean }> => {
  const supabase = createOptionalPublicServerSupabaseClient();
  if (!supabase) return { data: null, schemaMissing: false };

  const { data: translationRows, error: translationError } = await supabase.rpc(
    'get_article_translation_with_fallback',
    {
      fallback_locales: localeFallbackChain,
      target_article_id: articleId,
    },
  );

  if (translationError) {
    if (isMissingArticleShadowSchemaError(translationError.message)) {
      return { data: null, schemaMissing: true };
    }

    throw new Error(`[articles] 번역 조회 실패: ${translationError.message}`);
  }

  const translation = (translationRows ?? [])[0] as ArticleTranslationFallbackRpcRow | undefined;
  if (!translation) {
    return { data: null, schemaMissing: false };
  }

  const relatedTags = await getRelatedTagSlugs({
    entityColumn: 'article_id',
    entityId: articleId,
    relationTable: 'article_tags',
  });
  if (relatedTags.schemaMissing) {
    throw new Error('[articles] 태그 relation schema가 없습니다.');
  }

  return {
    data: mapArticle(mapArticleFallbackRpcRow(translation), relatedTags.data),
    schemaMissing: false,
  };
};

const fetchArticleByLocaleFallbackChain = async (
  articleId: string,
  localeFallbackChain: string[],
): Promise<Article | null> => {
  const articleResult = await fetchArticleFromShadowSchema(articleId, localeFallbackChain);
  if (articleResult.schemaMissing) {
    throw new Error('[articles] content schema가 없습니다.');
  }

  return articleResult.data;
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
      const localeFallbackChain = buildArticleLocaleFallbackChain(normalizedLocale);
      const article = await fetchArticleByLocaleFallbackChain(articleId, localeFallbackChain);
      if (article) return article;

      throw new Error(
        `[articles] 조회 가능한 번역이 없습니다. articleId=${articleId} locales=${localeFallbackChain.join('>')}`,
      );
    },
    ['article', cacheScope, articleId, normalizedLocale],
    {
      tags: [ARTICLES_CACHE_TAG, createArticleCacheTag(articleId)],
      revalidate: false,
    },
  );

  return getCachedArticle();
};

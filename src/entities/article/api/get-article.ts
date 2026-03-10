import { unstable_cacheTag as cacheTag } from 'next/cache';

import { getRelatedTagSlugs } from '@/entities/tag/api/query-tags';
import { buildContentLocaleFallbackChain } from '@/shared/lib/i18n/content-locale-fallback';
import { hasSupabaseEnv } from '@/shared/lib/supabase/config';
import { createOptionalPublicServerSupabaseClient } from '@/shared/lib/supabase/public-server';

import 'server-only';

import { ARTICLES_CACHE_TAG, createArticleCacheTag } from '../model/cache-tags';
import type { Article } from '../model/types';

import {
  type ArticleTranslationFallbackRpcRow,
  mapArticle,
  mapArticleFallbackRpcRow,
} from './map-article-translation';

type ResolvedArticle = {
  item: Article | null;
  resolvedLocale: string | null;
};

type ArticleContentSchemaError = {
  code?: string | null;
  message: string;
};

const isMissingArticleContentSchemaError = ({ code, message }: ArticleContentSchemaError) => {
  if (code) return code === '42883' || code === '42P01' || code === 'PGRST202';

  const normalizedMessage = message.toLowerCase();
  const hasMissingObjectText = normalizedMessage.includes('does not exist');
  const hasTargetName =
    normalizedMessage.includes('get_article_translation_with_fallback') ||
    normalizedMessage.includes('articles') ||
    normalizedMessage.includes('article_translations');

  return hasMissingObjectText && hasTargetName;
};

/**
 * content schema RPC에서 fallback 우선순위가 반영된 단일 아티클 번역을 조회합니다.
 */
const fetchArticleFromContentSchema = async (
  articleId: string,
  localeFallbackChain: string[],
): Promise<{ data: ResolvedArticle; schemaMissing: boolean }> => {
  const supabase = createOptionalPublicServerSupabaseClient();
  if (!supabase) {
    return {
      data: {
        item: null,
        resolvedLocale: null,
      },
      schemaMissing: false,
    };
  }

  const { data: translationRows, error: translationError } = await supabase.rpc(
    'get_article_translation_with_fallback',
    {
      fallback_locales: localeFallbackChain,
      target_article_id: articleId,
    },
  );

  if (translationError) {
    if (isMissingArticleContentSchemaError(translationError)) {
      return {
        data: {
          item: null,
          resolvedLocale: null,
        },
        schemaMissing: true,
      };
    }

    throw new Error(`[articles] 번역 조회 실패: ${translationError.message}`);
  }

  const translation = (translationRows ?? [])[0] as ArticleTranslationFallbackRpcRow | undefined;
  if (!translation) {
    return {
      data: {
        item: null,
        resolvedLocale: null,
      },
      schemaMissing: false,
    };
  }

  const relatedTags = await getRelatedTagSlugs({
    entityColumn: 'article_id',
    entityId: articleId,
    relationTable: 'article_tags',
  });
  if (relatedTags.schemaMissing) throw new Error('[articles] 태그 relation schema가 없습니다.');

  return {
    data: {
      item: mapArticle(mapArticleFallbackRpcRow(translation), relatedTags.data),
      resolvedLocale: translation.locale.toLowerCase(),
    },
    schemaMissing: false,
  };
};

const fetchArticleByLocaleFallbackChain = async (
  articleId: string,
  localeFallbackChain: string[],
): Promise<ResolvedArticle> => {
  const articleResult = await fetchArticleFromContentSchema(articleId, localeFallbackChain);
  if (articleResult.schemaMissing) throw new Error('[articles] content schema가 없습니다.');

  return articleResult.data;
};

/**
 * 단일 아티클 조회 결과를 `use cache`로 캐시합니다.
 */
const readCachedArticle = async (
  articleId: string,
  normalizedLocale: string,
): Promise<ResolvedArticle> => {
  'use cache';

  cacheTag(ARTICLES_CACHE_TAG, createArticleCacheTag(articleId));

  const localeFallbackChain = buildContentLocaleFallbackChain(normalizedLocale);
  const article = await fetchArticleByLocaleFallbackChain(articleId, localeFallbackChain);
  if (article.item) return article;

  throw new Error(
    `[articles] 조회 가능한 번역이 없습니다. articleId=${articleId} locales=${localeFallbackChain.join('>')}`,
  );
};

/**
 * 아티클과 실제 선택된 locale을 함께 반환합니다.
 */
export const getResolvedArticle = async (
  articleId: string,
  targetLocale: string,
): Promise<ResolvedArticle> => {
  if (!hasSupabaseEnv()) {
    return {
      item: null,
      resolvedLocale: null,
    };
  }

  const normalizedLocale = targetLocale.toLowerCase();

  return readCachedArticle(articleId, normalizedLocale);
};

/**
 * 아티클 상세 데이터를 On-demand ISR 태그 기반으로 캐시해서 가져옵니다.
 * `revalidateTag('articles')` 또는 `revalidateTag('article:{id}')`로 즉시 갱신할 수 있습니다.
 */
export const getArticle = async (
  articleId: string,
  targetLocale: string,
): Promise<Article | null> => {
  const result = await getResolvedArticle(articleId, targetLocale);
  return result.item;
};

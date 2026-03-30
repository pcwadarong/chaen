import { unstable_cacheLife as cacheLife, unstable_cacheTag as cacheTag } from 'next/cache';

import {
  type ArticleTranslationFallbackRpcRow,
  mapArticle,
  mapArticleFallbackRpcRow,
} from '@/entities/article/api/shared/map-article-translation';
import { ARTICLES_CACHE_TAG, createArticleCacheTag } from '@/entities/article/model/cache-tags';
import type { Article } from '@/entities/article/model/types';
import { getRelatedTagSlugs } from '@/entities/tag/api/query-tags';
import { buildContentLocaleFallbackChain } from '@/shared/lib/i18n/content-locale-fallback';
import { hasSupabaseEnv } from '@/shared/lib/supabase/config';
import { getOptionalPublicServerSupabaseClient } from '@/shared/lib/supabase/public-server';

import 'server-only';

type ResolvedArticle = {
  item: Article | null;
  resolvedLocale: string | null;
};

type ArticleLookup = {
  id: string;
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
 * 공개 상세 경로로 들어온 slug를 내부 article id로 해석합니다.
 *
 * @param articleSlug - 주소창에 들어온 공개 slug
 * @returns 내부 article id와 slug 정보
 */
const resolveArticleLookup = async (
  articleSlug: string,
): Promise<{ data: ArticleLookup | null; schemaMissing: boolean }> => {
  const supabase = getOptionalPublicServerSupabaseClient();
  if (!supabase) {
    return {
      data: null,
      schemaMissing: false,
    };
  }

  const articleSlugQuery = supabase
    .from('articles')
    .select('id')
    .eq('slug', articleSlug)
    .eq('visibility', 'public')
    .not('publish_at', 'is', null)
    .maybeSingle<ArticleLookup>();
  const { data: articleBySlug, error: articleBySlugError } = await articleSlugQuery;

  if (articleBySlugError) {
    if (isMissingArticleContentSchemaError(articleBySlugError)) {
      return {
        data: null,
        schemaMissing: true,
      };
    }

    throw new Error(`[articles] slug 조회 실패: ${articleBySlugError.message}`);
  }

  return {
    data: articleBySlug ?? null,
    schemaMissing: false,
  };
};

/**
 * content schema RPC에서 fallback 우선순위가 반영된 단일 아티클 번역을 조회합니다.
 */
const fetchArticleFromContentSchema = async (
  articleId: string,
  localeFallbackChain: string[],
): Promise<{ data: ResolvedArticle; schemaMissing: boolean }> => {
  const supabase = getOptionalPublicServerSupabaseClient();
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

  return {
    data: {
      item: mapArticle(
        mapArticleFallbackRpcRow(translation),
        relatedTags.schemaMissing ? [] : relatedTags.data,
      ),
      resolvedLocale: translation.locale.toLowerCase(),
    },
    schemaMissing: false,
  };
};

const fetchArticleByLocaleFallbackChain = async (
  articleSlug: string,
  localeFallbackChain: string[],
): Promise<ResolvedArticle> => {
  const articleLookup = await resolveArticleLookup(articleSlug);
  if (articleLookup.schemaMissing) throw new Error('[articles] content schema가 없습니다.');
  if (!articleLookup.data) {
    return {
      item: null,
      resolvedLocale: null,
    };
  }

  const resolvedArticleResult = await fetchArticleFromContentSchema(
    articleLookup.data.id,
    localeFallbackChain,
  );
  if (resolvedArticleResult.schemaMissing) throw new Error('[articles] content schema가 없습니다.');

  return resolvedArticleResult.data;
};

/**
 * 단일 아티클 조회 결과를 `use cache`로 캐시합니다.
 *
 * 이 함수 본문은 캐시 miss 시에만 실행됩니다.
 * `console.log`가 출력되면 DB 쿼리가 발생한 것이고, 출력이 없으면 캐시 hit입니다.
 */
const readCachedArticle = async (
  articleSlug: string,
  normalizedLocale: string,
): Promise<ResolvedArticle> => {
  'use cache';
  cacheLife('hours');

  console.log(`[cache-miss:article] slug="${articleSlug}" locale="${normalizedLocale}"`);

  const article = await fetchArticleByLocaleFallbackChain(
    articleSlug,
    buildContentLocaleFallbackChain(normalizedLocale),
  );
  if (article.item) {
    cacheTag(ARTICLES_CACHE_TAG, createArticleCacheTag(article.item.id));
  } else {
    cacheTag(ARTICLES_CACHE_TAG);
  }

  return article;
};

/**
 * 아티클과 실제 선택된 locale을 함께 반환합니다.
 *
 * 실행 시간을 서버 로그로 출력합니다.
 * - 캐시 hit: 수 ms 이내 (DB 쿼리 없음)
 * - 캐시 miss: 수십~수백 ms (cold start 포함 시 더 길어질 수 있음)
 */
export const getResolvedArticle = async (
  articleSlug: string,
  targetLocale: string,
): Promise<ResolvedArticle> => {
  if (!hasSupabaseEnv()) {
    return {
      item: null,
      resolvedLocale: null,
    };
  }

  const normalizedLocale = targetLocale.toLowerCase();
  const start = performance.now();
  const result = await readCachedArticle(articleSlug, normalizedLocale);
  const elapsed = (performance.now() - start).toFixed(1);

  console.log(`[perf:article] slug="${articleSlug}" locale="${normalizedLocale}" ms=${elapsed}`);

  return result;
};

/**
 * 아티클 상세 데이터를 On-demand ISR 태그 기반으로 캐시해서 가져옵니다.
 * `revalidateTag('articles')` 또는 `revalidateTag('article:{id}')`로 즉시 갱신할 수 있습니다.
 */
export const getArticle = async (
  articleSlug: string,
  targetLocale: string,
): Promise<Article | null> => {
  const result = await getResolvedArticle(articleSlug, targetLocale);
  return result.item;
};

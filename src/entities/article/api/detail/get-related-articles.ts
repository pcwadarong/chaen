import { unstable_cacheTag as cacheTag } from 'next/cache';

import {
  type ArticleTranslationRow,
  getEmbeddedArticleBaseRow,
} from '@/entities/article/api/shared/map-article-translation';
import { ARTICLES_CACHE_TAG, createArticleCacheTag } from '@/entities/article/model/cache-tags';
import type { ArticleListItem } from '@/entities/article/model/types';
import { getRelatedTagIds } from '@/entities/tag/api/query-tags';
import { buildContentLocaleFallbackChain } from '@/shared/lib/i18n/content-locale-fallback';
import { hasSupabaseEnv } from '@/shared/lib/supabase/config';
import { createOptionalPublicServerSupabaseClient } from '@/shared/lib/supabase/public-server';

import 'server-only';

type GetRelatedArticlesOptions = {
  articleId: string;
  limit?: number;
  locale: string;
};

type RelatedArticleTranslationRow = {
  article_id: string;
  articles: ArticleTranslationRow['articles'];
  created_at: string;
  description: string | null;
  locale: string;
  title: string;
};

/**
 * 관련 글 노출 개수를 안전한 범위로 정규화합니다.
 */
const normalizeRelatedArticlesLimit = (limit?: number) => {
  if (!limit || !Number.isFinite(limit)) return 3;

  return Math.min(Math.max(Math.trunc(limit), 1), 6);
};

/**
 * locale fallback 우선순위에 맞춰 번역 한 건을 고릅니다.
 */
const pickBestTranslation = (
  rows: RelatedArticleTranslationRow[],
  localeFallbackChain: string[],
): RelatedArticleTranslationRow | null =>
  rows.slice().sort((left, right) => {
    const leftLocaleOrder = localeFallbackChain.indexOf(left.locale);
    const rightLocaleOrder = localeFallbackChain.indexOf(right.locale);

    if (leftLocaleOrder !== rightLocaleOrder) return leftLocaleOrder - rightLocaleOrder;

    return right.created_at.localeCompare(left.created_at);
  })[0] ?? null;

/**
 * 번역 행을 화면용 관련 아티클 요약으로 변환합니다.
 */
const toArticleListItem = (row: RelatedArticleTranslationRow): ArticleListItem | null => {
  const articleBase = getEmbeddedArticleBaseRow(row.articles);
  if (!articleBase) return null;
  if (!articleBase.publish_at || !articleBase.slug) return null;

  return {
    description: row.description,
    id: row.article_id,
    publish_at: articleBase.publish_at,
    slug: articleBase.slug,
    thumbnail_url: articleBase.thumbnail_url,
    title: row.title,
  };
};

/**
 * 공통 태그 수를 기준으로 후보 article id를 정렬합니다.
 */
const sortCandidateArticleIdsBySharedTags = (
  sourceArticleId: string,
  rows: Array<{ article_id: string; tag_id: string }>,
): string[] => {
  const tagMatchesByArticleId = new Map<string, number>();

  rows.forEach(row => {
    if (row.article_id === sourceArticleId) return;

    tagMatchesByArticleId.set(row.article_id, (tagMatchesByArticleId.get(row.article_id) ?? 0) + 1);
  });

  return Array.from(tagMatchesByArticleId.entries())
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
    .map(([articleId]) => articleId);
};

/**
 * 공통 태그 기반 후보 article id를 조회합니다.
 */
const fetchCandidateArticleIdsBySharedTags = async ({
  articleId,
}: {
  articleId: string;
}): Promise<string[]> => {
  const relatedTagIds = await getRelatedTagIds({
    entityColumn: 'article_id',
    entityId: articleId,
    relationTable: 'article_tags',
  });
  if (relatedTagIds.schemaMissing) return [];
  if (relatedTagIds.data.length === 0) return [];

  const supabase = createOptionalPublicServerSupabaseClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('article_tags')
    .select('article_id,tag_id')
    .neq('article_id', articleId)
    .in('tag_id', relatedTagIds.data);

  if (error) {
    const normalizedMessage = error.message.toLowerCase();
    if (
      normalizedMessage.includes('article_tags') &&
      normalizedMessage.includes('does not exist')
    ) {
      return [];
    }

    throw new Error(`[articles] 관련 글 후보 조회 실패: ${error.message}`);
  }

  return sortCandidateArticleIdsBySharedTags(
    articleId,
    (data ?? []) as Array<{ article_id: string; tag_id: string }>,
  );
};

/**
 * 후보 article id 목록에서 locale fallback에 맞는 번역을 조회합니다.
 */
const fetchRelatedArticlesByIds = async ({
  articleIds,
  limit,
  locale,
}: {
  articleIds: string[];
  limit: number;
  locale: string;
}): Promise<ArticleListItem[]> => {
  if (articleIds.length === 0) return [];

  const supabase = createOptionalPublicServerSupabaseClient();
  if (!supabase) return [];

  const localeFallbackChain = buildContentLocaleFallbackChain(locale);
  const targetArticleIds = articleIds.slice(0, Math.max(limit * 4, limit));
  const { data, error } = await supabase
    .from('article_translations')
    .select(
      'article_id,locale,title,description,articles!inner(id,created_at,publish_at,slug,thumbnail_url)',
    )
    .in('article_id', targetArticleIds)
    .in('locale', localeFallbackChain)
    .not('articles.publish_at', 'is', null)
    .not('articles.slug', 'is', null);

  if (error) {
    const normalizedMessage = error.message.toLowerCase();
    if (
      (normalizedMessage.includes('article_translations') ||
        normalizedMessage.includes('articles')) &&
      normalizedMessage.includes('does not exist')
    ) {
      return [];
    }

    throw new Error(`[articles] 관련 글 번역 조회 실패: ${error.message}`);
  }

  const translationsByArticleId = new Map<string, RelatedArticleTranslationRow[]>();
  ((data ?? []) as RelatedArticleTranslationRow[]).forEach(row => {
    const rows = translationsByArticleId.get(row.article_id) ?? [];
    rows.push(row);
    translationsByArticleId.set(row.article_id, rows);
  });

  return targetArticleIds
    .map(candidateArticleId => translationsByArticleId.get(candidateArticleId) ?? [])
    .map(rows => pickBestTranslation(rows, localeFallbackChain))
    .flatMap(row => {
      if (!row) return [];

      const item = toArticleListItem(row);

      return item ? [item] : [];
    })
    .slice(0, limit);
};

/**
 * 최근 글을 fallback related articles로 조회합니다.
 */
const fetchRecentArticles = async ({
  articleId,
  limit,
  locale,
}: {
  articleId: string;
  limit: number;
  locale: string;
}): Promise<ArticleListItem[]> => {
  const supabase = createOptionalPublicServerSupabaseClient();
  if (!supabase) return [];

  const localeFallbackChain = buildContentLocaleFallbackChain(locale);
  for (const candidateLocale of localeFallbackChain) {
    const { data, error } = await supabase
      .from('article_translations')
      .select(
        'article_id,locale,title,description,articles!inner(id,created_at,publish_at,slug,thumbnail_url)',
      )
      .eq('locale', candidateLocale)
      .neq('article_id', articleId)
      .not('articles.publish_at', 'is', null)
      .not('articles.slug', 'is', null)
      .order('publish_at', { ascending: false, referencedTable: 'articles' })
      .limit(limit);

    if (error) {
      const normalizedMessage = error.message.toLowerCase();
      if (
        (normalizedMessage.includes('article_translations') ||
          normalizedMessage.includes('articles')) &&
        normalizedMessage.includes('does not exist')
      ) {
        return [];
      }

      throw new Error(`[articles] 최근 글 fallback 조회 실패: ${error.message}`);
    }

    const items = ((data ?? []) as RelatedArticleTranslationRow[])
      .flatMap(row => {
        const item = toArticleListItem(row);
        return item ? [item] : [];
      })
      .slice(0, limit);

    if (items.length > 0) return items;
  }

  return [];
};

/**
 * 공통 태그 수와 최신순 기준으로 관련 아티클을 조회합니다.
 */
export const getRelatedArticles = async ({
  articleId,
  limit,
  locale,
}: GetRelatedArticlesOptions): Promise<ArticleListItem[]> => {
  if (!hasSupabaseEnv()) return [];

  return readCachedRelatedArticles({
    articleId,
    limit: normalizeRelatedArticlesLimit(limit),
    locale: locale.toLowerCase(),
  });
};

/**
 * 관련 아티클 조회 결과를 캐시합니다.
 */
const readCachedRelatedArticles = async ({
  articleId,
  limit,
  locale,
}: {
  articleId: string;
  limit: number;
  locale: string;
}): Promise<ArticleListItem[]> => {
  'use cache';

  cacheTag(ARTICLES_CACHE_TAG, createArticleCacheTag(articleId));

  const candidateArticleIds = await fetchCandidateArticleIdsBySharedTags({
    articleId,
  });
  const sharedTagMatches = await fetchRelatedArticlesByIds({
    articleIds: candidateArticleIds,
    limit,
    locale,
  });

  if (sharedTagMatches.length > 0) return sharedTagMatches;

  return fetchRecentArticles({
    articleId,
    limit,
    locale,
  });
};

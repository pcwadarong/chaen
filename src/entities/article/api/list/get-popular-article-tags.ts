import { unstable_cacheLife as cacheLife, unstable_cacheTag as cacheTag } from 'next/cache';

import { ARTICLES_CACHE_TAG } from '@/entities/article/model/cache-tags';
import type { ArticleTagStat, LocalizedArticleTagStat } from '@/entities/article/model/types';
import {
  getAllRelatedTagIds,
  getTagLabelMapBySlugs,
  getTagSlugMap,
} from '@/entities/tag/api/query-tags';
import { TAGS_CACHE_TAG } from '@/entities/tag/model/cache-tags';
import { hasSupabaseEnv } from '@/shared/lib/supabase/config';

import 'server-only';

type GetPopularArticleTagsOptions = {
  limit?: number;
  locale: string;
};

const DEFAULT_TAG_LIMIT = 12;

/**
 * 인기 태그 RPC limit 값을 안전한 범위로 정규화합니다.
 */
const normalizeTagLimit = (limit?: number) => {
  if (!limit || Number.isNaN(limit)) return DEFAULT_TAG_LIMIT;

  return Math.min(Math.max(Math.trunc(limit), 1), 30);
};

/**
 * relation table 기준 인기 아티클 태그를 빈도순으로 조회합니다.
 */
const readCachedPopularArticleTags = async (
  normalizedLimit: number,
  normalizedLocale: string,
): Promise<ArticleTagStat[]> => {
  'use cache';

  cacheTag(ARTICLES_CACHE_TAG);
  // 예약 발행(publish_at) 글이 태그 무효화 없이도 TTL로 노출되도록 함.
  cacheLife({ expire: 86400, revalidate: 3600, stale: 300 });

  const relationTagIds = await getAllRelatedTagIds('article_tags');
  if (relationTagIds.schemaMissing) {
    throw new Error('[articles] 인기 태그 relation schema가 없습니다.');
  }

  const tagCounts = new Map<string, number>();

  relationTagIds.data.forEach(tagId => {
    tagCounts.set(tagId, (tagCounts.get(tagId) ?? 0) + 1);
  });

  if (tagCounts.size === 0) {
    return [];
  }

  const tagSlugMap = await getTagSlugMap(Array.from(tagCounts.keys()));
  if (tagSlugMap.schemaMissing) {
    throw new Error('[articles] 인기 태그 slug schema가 없습니다.');
  }

  return Array.from(tagCounts.entries())
    .map(([tagId, articleCount]) => ({
      article_count: articleCount,
      tag: tagSlugMap.data.get(tagId) ?? '',
    }))
    .filter(item => item.tag.length > 0)
    .sort((left, right) => {
      if (right.article_count !== left.article_count) {
        return right.article_count - left.article_count;
      }

      return left.tag.localeCompare(right.tag, normalizedLocale);
    })
    .slice(0, normalizedLimit);
};

/**
 * relation table 기준 인기 아티클 태그를 `use cache` 기반으로 조회합니다.
 */
export const getPopularArticleTags = async ({
  limit,
  locale,
}: GetPopularArticleTagsOptions): Promise<ArticleTagStat[]> => {
  if (!hasSupabaseEnv()) return [];

  const normalizedLimit = normalizeTagLimit(limit);
  const normalizedLocale = locale.toLowerCase();

  return readCachedPopularArticleTags(normalizedLimit, normalizedLocale);
};

/**
 * 인기 태그 집계와 locale label 조회를 결합한 결과를 `use cache`로 캐시합니다.
 *
 * 두 조회는 실제 의존 관계라 병렬화할 수 없으므로 조합 전체를 캐시해
 * warm 캐시에서는 DB 조회 없이 라벨이 결합된 결과를 반환합니다.
 */
const readCachedLocalizedPopularArticleTags = async (
  normalizedLocale: string,
): Promise<LocalizedArticleTagStat[]> => {
  'use cache';

  cacheTag(ARTICLES_CACHE_TAG, TAGS_CACHE_TAG);
  cacheLife({ expire: 86400, revalidate: 3600, stale: 300 });

  const popularTags = await getPopularArticleTags({ locale: normalizedLocale });
  if (popularTags.length === 0) {
    return [];
  }

  const localizedTagLabels = await getTagLabelMapBySlugs({
    locale: normalizedLocale,
    slugs: popularTags.map(item => item.tag),
  });
  if (localizedTagLabels.schemaMissing) {
    throw new Error('[articles] 태그 label schema가 없습니다.');
  }

  return popularTags.map(item => ({
    ...item,
    label: localizedTagLabels.data.get(item.tag) ?? item.tag,
  }));
};

/**
 * locale label이 결합된 인기 아티클 태그 목록을 `use cache` 기반으로 조회합니다.
 */
export const getLocalizedPopularArticleTags = async ({
  locale,
}: {
  locale: string;
}): Promise<LocalizedArticleTagStat[]> => {
  if (!hasSupabaseEnv()) return [];

  const normalizedLocale = locale.toLowerCase();

  return readCachedLocalizedPopularArticleTags(normalizedLocale);
};

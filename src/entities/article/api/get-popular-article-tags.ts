import { unstable_cacheTag as cacheTag } from 'next/cache';

import { getAllRelatedTagIds, getTagSlugMap } from '@/entities/tag/api/query-tags';
import { hasSupabaseEnv } from '@/shared/lib/supabase/config';

import 'server-only';

import { ARTICLES_CACHE_TAG } from '../model/cache-tags';
import type { ArticleTagStat } from '../model/types';

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

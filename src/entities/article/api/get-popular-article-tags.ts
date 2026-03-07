import { unstable_cache } from 'next/cache';

import { getRelatedTagIdsByLocale, getTagSlugMap } from '@/entities/tag/api/query-tags';
import { hasSupabaseEnv } from '@/shared/lib/supabase/config';
import { createOptionalPublicServerSupabaseClient } from '@/shared/lib/supabase/public-server';

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
 * locale 기준 인기 아티클 태그를 빈도순으로 조회합니다.
 *
 * RPC가 아직 배포되지 않은 환경에서는 목록 페이지가 깨지지 않도록 빈 배열로 복구합니다.
 */
export const getPopularArticleTags = async ({
  limit,
  locale,
}: GetPopularArticleTagsOptions): Promise<ArticleTagStat[]> => {
  const cacheScope = hasSupabaseEnv() ? 'supabase-enabled' : 'supabase-disabled';
  if (cacheScope === 'supabase-disabled') return [];

  const normalizedLocale = locale.toLowerCase();
  const normalizedLimit = normalizeTagLimit(limit);

  const getCachedPopularTags = unstable_cache(
    async () => {
      const relationTagIds = await getRelatedTagIdsByLocale('article_tags', normalizedLocale);
      if (!relationTagIds.schemaMissing) {
        const tagCounts = new Map<string, number>();

        relationTagIds.data.forEach(tagId => {
          tagCounts.set(tagId, (tagCounts.get(tagId) ?? 0) + 1);
        });

        const tagSlugMap = await getTagSlugMap(Array.from(tagCounts.keys()));
        if (!tagSlugMap.schemaMissing) {
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

              return left.tag.localeCompare(right.tag);
            })
            .slice(0, normalizedLimit);
        }
      }

      const supabase = createOptionalPublicServerSupabaseClient();
      if (!supabase) return [];

      const { data, error } = await supabase.rpc('get_popular_article_tags', {
        tag_limit: normalizedLimit,
        target_locale: normalizedLocale,
      });

      if (error) {
        if (error.message.includes('get_popular_article_tags')) return [];

        throw new Error(`[articles] 인기 태그 조회 실패: ${error.message}`);
      }

      return (data ?? []) as ArticleTagStat[];
    },
    ['articles', 'popular-tags', cacheScope, normalizedLocale, String(normalizedLimit)],
    {
      tags: [ARTICLES_CACHE_TAG],
      revalidate: false,
    },
  );

  return getCachedPopularTags();
};

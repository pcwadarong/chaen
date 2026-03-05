import { unstable_cache } from 'next/cache';

import { hasSupabaseEnv } from '@/lib/supabase/config';
import { createOptionalPublicServerSupabaseClient } from '@/lib/supabase/public-server';

import 'server-only';

import { GUESTBOOK_CACHE_TAG } from '../model/cache-tags';
import type { GuestbookEntry, GuestbookThreadItem, GuestbookThreadPage } from '../model/types';

type GetGuestbookThreadsOptions = {
  cursor?: string | null;
  limit?: number;
};

const DEFAULT_PAGE_SIZE = 12;

/**
 * 커서 문자열을 offset 숫자로 변환합니다.
 */
const parseCursorOffset = (cursor?: string | null) => {
  if (!cursor) return 0;

  const parsed = Number.parseInt(cursor, 10);
  if (Number.isNaN(parsed) || parsed < 0) return 0;

  return parsed;
};

/**
 * 원댓글 목록을 조회합니다.
 */
const fetchGuestbookParents = async (offset: number, limit: number): Promise<GuestbookEntry[]> => {
  const supabase = createOptionalPublicServerSupabaseClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('guestbook_entries')
    .select('*')
    .is('parent_id', null)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) throw new Error(`[guestbook] 원댓글 조회 실패: ${error.message}`);
  return (data ?? []) as GuestbookEntry[];
};

/**
 * 전달된 원댓글 id 목록에 대한 대댓글을 조회합니다.
 */
const fetchRepliesByParentIds = async (
  parentIds: string[],
): Promise<Record<string, GuestbookEntry[]>> => {
  if (parentIds.length === 0) return {};

  const supabase = createOptionalPublicServerSupabaseClient();
  if (!supabase) return {};

  const { data, error } = await supabase
    .from('guestbook_entries')
    .select('*')
    .in('parent_id', parentIds)
    .is('deleted_at', null)
    .order('created_at', { ascending: true });

  if (error) throw new Error(`[guestbook] 대댓글 조회 실패: ${error.message}`);

  return ((data ?? []) as GuestbookEntry[]).reduce<Record<string, GuestbookEntry[]>>(
    (accumulator, entry) => {
      const parentId = entry.parent_id;
      if (!parentId) return accumulator;

      const current = accumulator[parentId] ?? [];
      current.push(entry);
      accumulator[parentId] = current;

      return accumulator;
    },
    {},
  );
};

/**
 * 방명록 원댓글+대댓글 페이지 데이터를 cursor(offset) 기반으로 조회합니다.
 * `nextCursor`를 다음 요청의 `cursor`로 전달하면 무한스크롤을 이어갈 수 있습니다.
 */
export const getGuestbookThreads = async ({
  cursor,
  limit = DEFAULT_PAGE_SIZE,
}: GetGuestbookThreadsOptions): Promise<GuestbookThreadPage> => {
  const cacheScope = hasSupabaseEnv() ? 'supabase-enabled' : 'supabase-disabled';
  if (cacheScope === 'supabase-disabled') {
    return {
      items: [],
      nextCursor: null,
    };
  }

  const normalizedLimit = Math.min(Math.max(limit, 1), 30);
  const offset = parseCursorOffset(cursor);
  const cacheCursor = String(offset);

  const getCachedThreads = unstable_cache(
    async () => {
      const parents = await fetchGuestbookParents(offset, normalizedLimit);
      const parentIds = parents.map(parent => parent.id);
      const repliesByParentId = await fetchRepliesByParentIds(parentIds);

      const items: GuestbookThreadItem[] = parents.map(parent => ({
        ...parent,
        replies: repliesByParentId[parent.id] ?? [],
      }));

      return {
        items,
        nextCursor: parents.length === normalizedLimit ? String(offset + parents.length) : null,
      };
    },
    ['guestbook', 'threads', cacheScope, cacheCursor, String(normalizedLimit)],
    {
      tags: [GUESTBOOK_CACHE_TAG],
      revalidate: false,
    },
  );

  return getCachedThreads();
};

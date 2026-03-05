import { unstable_cache } from 'next/cache';

import { hasSupabaseEnv } from '@/lib/supabase/config';
import { createOptionalPublicServerSupabaseClient } from '@/lib/supabase/public-server';

import 'server-only';

import { GUESTBOOK_CACHE_TAG } from '../model/cache-tags';
import type {
  GuestbookEntry,
  GuestbookEntryRow,
  GuestbookThreadItem,
  GuestbookThreadPage,
} from '../model/types';

type GetGuestbookThreadsOptions = {
  cursor?: string | null;
  includeSecret?: boolean;
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
const fetchGuestbookParents = async (
  offset: number,
  limit: number,
): Promise<GuestbookEntryRow[]> => {
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
  return (data ?? []) as GuestbookEntryRow[];
};

/**
 * 전달된 원댓글 id 목록에 대한 대댓글을 조회합니다.
 */
const fetchRepliesByParentIds = async (
  parentIds: string[],
): Promise<Record<string, GuestbookEntryRow[]>> => {
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

  return ((data ?? []) as GuestbookEntryRow[]).reduce<Record<string, GuestbookEntryRow[]>>(
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
 * 비밀글 노출 정책에 맞춰 공개 가능한 형태로 항목을 변환합니다.
 */
const toPublicGuestbookEntry = (
  entry: GuestbookEntryRow,
  includeSecret: boolean,
): GuestbookEntry => {
  const { password_hash: _passwordHash, ...publicEntry } = entry;
  if (!entry.is_secret || includeSecret) {
    return {
      ...publicEntry,
      is_content_masked: false,
    };
  }

  return {
    ...publicEntry,
    content: '',
    is_content_masked: true,
  };
};

/**
 * 방명록 원댓글+대댓글 페이지 데이터를 cursor(offset) 기반으로 조회합니다.
 * `nextCursor`를 다음 요청의 `cursor`로 전달하면 무한스크롤을 이어갈 수 있습니다.
 */
export const getGuestbookThreads = async ({
  cursor,
  includeSecret = false,
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

  const readThreads = async () => {
    const parents = await fetchGuestbookParents(offset, normalizedLimit);
    const parentIds = parents.map(parent => parent.id);
    const repliesByParentId = await fetchRepliesByParentIds(parentIds);

    const items: GuestbookThreadItem[] = parents.map(parent => ({
      ...toPublicGuestbookEntry(parent, includeSecret),
      replies: (repliesByParentId[parent.id] ?? []).map(reply =>
        toPublicGuestbookEntry(reply, includeSecret),
      ),
    }));

    return {
      items,
      nextCursor: parents.length === normalizedLimit ? String(offset + parents.length) : null,
    };
  };

  if (includeSecret) {
    return readThreads();
  }

  const getCachedThreads = unstable_cache(
    readThreads,
    ['guestbook', 'threads', cacheScope, cacheCursor, String(normalizedLimit)],
    {
      tags: [GUESTBOOK_CACHE_TAG],
      revalidate: false,
    },
  );

  return getCachedThreads();
};

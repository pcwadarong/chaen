import type { AdminArticleListItem } from '@/entities/article/model/types';
import { createOptionalServiceRoleSupabaseClient } from '@/shared/lib/supabase/service-role';

import 'server-only';

type AdminArticleBaseRow = Omit<AdminArticleListItem, 'title'>;

type AdminArticleTranslationRow = {
  article_id: string;
  locale: string;
  title: string;
};

type AdminArticleSupabaseClient = NonNullable<
  ReturnType<typeof createOptionalServiceRoleSupabaseClient>
>;

/**
 * 관리자 아티클 목록/지표용 base row를 정렬 기준에 맞춰 조회합니다.
 */
const fetchAdminArticleBaseRows = async ({
  limit,
  sortBy,
  supabase,
}: {
  limit: number;
  sortBy: 'publish_at' | 'view_count';
  supabase: AdminArticleSupabaseClient;
}): Promise<AdminArticleBaseRow[]> => {
  const query = supabase
    .from('articles')
    .select('id,slug,visibility,publish_at,thumbnail_url,created_at,updated_at,view_count')
    .order(sortBy, {
      ascending: false,
      nullsFirst: false,
    });

  if (sortBy === 'publish_at') {
    query.order('created_at', { ascending: false });
  } else {
    query.order('publish_at', {
      ascending: false,
      nullsFirst: false,
    });
  }

  const { data, error } = await query.limit(limit);

  if (error) {
    throw new Error(`[admin-articles] base row 조회 실패: ${error.message}`);
  }

  return (data ?? []) as AdminArticleBaseRow[];
};

/**
 * 관리자 제목은 한국어를 우선으로 사용하고, 없으면 조회된 첫 번역을 사용합니다.
 */
const pickAdminArticleTranslation = (rows: AdminArticleTranslationRow[]) =>
  rows.find(row => row.locale === 'ko') ?? rows[0] ?? null;

/**
 * 관리자 아티클 id 집합에 대해 locale fallback 후보 번역 제목을 조회합니다.
 */
const fetchAdminArticleTranslations = async (
  articleIds: string[],
  supabase: AdminArticleSupabaseClient,
): Promise<AdminArticleTranslationRow[]> => {
  if (articleIds.length === 0) return [];

  const { data, error } = await supabase
    .from('article_translations')
    .select('article_id,locale,title')
    .in('article_id', articleIds);

  if (error) {
    throw new Error(`[admin-articles] 번역 조회 실패: ${error.message}`);
  }

  return (data ?? []) as AdminArticleTranslationRow[];
};

/**
 * base row 순서를 유지한 채 locale fallback 제목을 결합합니다.
 */
const resolveAdminArticleItems = async (
  baseRows: AdminArticleBaseRow[],
  supabase: AdminArticleSupabaseClient,
): Promise<AdminArticleListItem[]> => {
  if (baseRows.length === 0) return [];

  const translationRows = await fetchAdminArticleTranslations(
    baseRows.map(row => row.id),
    supabase,
  );
  const translationsByArticleId = new Map<string, AdminArticleTranslationRow[]>();

  translationRows.forEach(row => {
    const rows = translationsByArticleId.get(row.article_id) ?? [];
    rows.push(row);
    translationsByArticleId.set(row.article_id, rows);
  });

  return baseRows.map(baseRow => {
    const preferredTranslation = pickAdminArticleTranslation(
      translationsByArticleId.get(baseRow.id) ?? [],
    );

    if (!preferredTranslation) {
      throw new Error(`[admin-articles] 조회 가능한 번역이 없습니다. articleId=${baseRow.id}`);
    }

    return {
      ...baseRow,
      title: preferredTranslation.title,
    };
  });
};

/**
 * 관리자 콘텐츠 화면에 사용할 아티클 목록을 최근 발행 순으로 조회합니다.
 */
export const getAdminArticles = async ({
  limit = 50,
}: {
  limit?: number;
} = {}): Promise<AdminArticleListItem[]> => {
  const supabase = createOptionalServiceRoleSupabaseClient();
  if (!supabase) return [];

  return resolveAdminArticleItems(
    await fetchAdminArticleBaseRows({
      limit,
      sortBy: 'publish_at',
      supabase,
    }),
    supabase,
  );
};

/**
 * 관리자 분석 화면에 사용할 인기 아티클 Top N을 조회합니다.
 */
export const getAdminTopArticles = async ({
  limit = 5,
}: {
  limit?: number;
} = {}): Promise<AdminArticleListItem[]> => {
  const supabase = createOptionalServiceRoleSupabaseClient();
  if (!supabase) return [];

  return resolveAdminArticleItems(
    await fetchAdminArticleBaseRows({
      limit,
      sortBy: 'view_count',
      supabase,
    }),
    supabase,
  );
};

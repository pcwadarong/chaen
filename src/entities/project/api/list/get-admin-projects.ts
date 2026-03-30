import type { AdminProjectListItem } from '@/entities/project/model/types';
import {
  buildContentLocaleFallbackChain,
  pickPreferredLocaleValue,
} from '@/shared/lib/i18n/content-locale-fallback';
import { createOptionalServiceRoleSupabaseClient } from '@/shared/lib/supabase/service-role';

import 'server-only';

type AdminProjectBaseRow = Omit<AdminProjectListItem, 'title'>;

type AdminProjectTranslationRow = {
  locale: string;
  project_id: string;
  title: string;
};

/**
 * 관리자 프로젝트 목록용 base row를 현재 공개 정렬 규칙과 동일한 우선순위로 조회합니다.
 */
const fetchAdminProjectBaseRows = async ({
  limit,
}: {
  limit: number;
}): Promise<AdminProjectBaseRow[]> => {
  const supabase = createOptionalServiceRoleSupabaseClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('projects')
    .select('id,slug,visibility,publish_at,display_order,thumbnail_url,created_at,updated_at')
    .order('display_order', {
      ascending: true,
      nullsFirst: false,
    })
    .order('publish_at', {
      ascending: false,
      nullsFirst: false,
    })
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(`[admin-projects] base row 조회 실패: ${error.message}`);
  }

  return (data ?? []) as AdminProjectBaseRow[];
};

/**
 * 관리자 프로젝트 id 집합에 대해 locale fallback 후보 번역 제목을 조회합니다.
 */
const fetchAdminProjectTranslations = async (
  projectIds: string[],
  localeFallbackChain: string[],
): Promise<AdminProjectTranslationRow[]> => {
  if (projectIds.length === 0) return [];

  const supabase = createOptionalServiceRoleSupabaseClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('project_translations')
    .select('project_id,locale,title')
    .in('project_id', projectIds)
    .in('locale', localeFallbackChain);

  if (error) {
    throw new Error(`[admin-projects] 번역 조회 실패: ${error.message}`);
  }

  return (data ?? []) as AdminProjectTranslationRow[];
};

/**
 * base row 순서를 유지한 채 locale fallback 제목을 결합합니다.
 */
const resolveAdminProjectItems = async (
  baseRows: AdminProjectBaseRow[],
  locale: string,
): Promise<AdminProjectListItem[]> => {
  if (baseRows.length === 0) return [];

  const localeFallbackChain = buildContentLocaleFallbackChain(locale);
  const translationRows = await fetchAdminProjectTranslations(
    baseRows.map(row => row.id),
    localeFallbackChain,
  );
  const translationsByProjectId = new Map<string, AdminProjectTranslationRow[]>();

  translationRows.forEach(row => {
    const rows = translationsByProjectId.get(row.project_id) ?? [];
    rows.push(row);
    translationsByProjectId.set(row.project_id, rows);
  });

  return baseRows.map(baseRow => {
    const preferredTranslation = pickPreferredLocaleValue({
      locales: localeFallbackChain,
      resolveLocale: row => row.locale,
      rows: translationsByProjectId.get(baseRow.id) ?? [],
    });

    if (!preferredTranslation) {
      throw new Error(
        `[admin-projects] 조회 가능한 번역이 없습니다. projectId=${baseRow.id} locales=${localeFallbackChain.join('>')}`,
      );
    }

    return {
      ...baseRow,
      title: preferredTranslation.title,
    };
  });
};

/**
 * 관리자 콘텐츠 화면에 사용할 프로젝트 목록을 조회합니다.
 */
export const getAdminProjects = async ({
  limit = 50,
  locale,
}: {
  limit?: number;
  locale: string;
}): Promise<AdminProjectListItem[]> =>
  resolveAdminProjectItems(
    await fetchAdminProjectBaseRows({
      limit,
    }),
    locale,
  );

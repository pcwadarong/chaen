import { createOptionalPublicServerSupabaseClient } from '@/shared/lib/supabase/public-server';

import 'server-only';

type TagSchemaResult<T> = {
  data: T;
  schemaMissing: boolean;
};

type RelationTableName = 'article_tags' | 'project_tags' | 'article_tags_v2' | 'project_tags_v2';

type GetRelatedEntityIdsOptions = {
  entityColumn: 'article_id' | 'project_id';
  locale?: string;
  relationTable: RelationTableName;
  tagId: string;
};

type GetRelatedTagIdsOptions = {
  entityColumn: 'article_id' | 'project_id';
  entityId: string;
  locale?: string;
  relationTable: RelationTableName;
};

const isMissingTagSchemaError = (message: string) => {
  const normalizedMessage = message.toLowerCase();

  return (
    normalizedMessage.includes('article_tags') ||
    normalizedMessage.includes('project_tags') ||
    normalizedMessage.includes('article_tags_v2') ||
    normalizedMessage.includes('project_tags_v2') ||
    normalizedMessage.includes('tags') ||
    normalizedMessage.includes('tag_translations')
  );
};

/**
 * relation table이 locale 컬럼을 포함하는지 판별합니다.
 */
const hasLocaleColumn = (relationTable: RelationTableName) =>
  relationTable === 'article_tags' || relationTable === 'project_tags';

/**
 * canonical slug로 태그 id를 조회합니다.
 *
 * 관계형 태그 스키마가 아직 배포되지 않은 환경에서는 schemaMissing으로 복구합니다.
 */
export const getTagIdBySlug = async (slug: string): Promise<TagSchemaResult<string | null>> => {
  const supabase = createOptionalPublicServerSupabaseClient();
  if (!supabase) return { data: null, schemaMissing: false };

  const { data, error } = await supabase.from('tags').select('id').eq('slug', slug).maybeSingle<{
    id: string;
  }>();

  if (error) {
    if (isMissingTagSchemaError(error.message)) {
      return { data: null, schemaMissing: true };
    }

    throw new Error(`[tags] slug 조회 실패: ${error.message}`);
  }

  return { data: data?.id ?? null, schemaMissing: false };
};

/**
 * relation table에서 특정 엔터티에 연결된 tag_id 목록을 가져옵니다.
 */
export const getRelatedTagIds = async ({
  entityColumn,
  entityId,
  locale,
  relationTable,
}: GetRelatedTagIdsOptions): Promise<TagSchemaResult<string[]>> => {
  const supabase = createOptionalPublicServerSupabaseClient();
  if (!supabase) return { data: [], schemaMissing: false };

  const query = supabase.from(relationTable).select('tag_id').eq(entityColumn, entityId);

  const { data, error } =
    locale && hasLocaleColumn(relationTable) ? await query.eq('locale', locale) : await query;

  if (error) {
    if (isMissingTagSchemaError(error.message)) {
      return { data: [], schemaMissing: true };
    }

    throw new Error(`[tags] relation tag id 조회 실패: ${error.message}`);
  }

  return {
    data: Array.from(new Set((data ?? []).map(row => (row as { tag_id: string }).tag_id))),
    schemaMissing: false,
  };
};

/**
 * relation table에서 특정 태그에 연결된 엔터티 id 목록을 가져옵니다.
 */
export const getRelatedEntityIdsByTagId = async ({
  entityColumn,
  locale,
  relationTable,
  tagId,
}: GetRelatedEntityIdsOptions): Promise<TagSchemaResult<string[]>> => {
  const supabase = createOptionalPublicServerSupabaseClient();
  if (!supabase) return { data: [], schemaMissing: false };

  const query = supabase.from(relationTable).select(entityColumn).eq('tag_id', tagId);

  const { data, error } =
    locale && hasLocaleColumn(relationTable) ? await query.eq('locale', locale) : await query;

  if (error) {
    if (isMissingTagSchemaError(error.message)) {
      return { data: [], schemaMissing: true };
    }

    throw new Error(`[tags] relation entity id 조회 실패: ${error.message}`);
  }

  return {
    data: Array.from(
      new Set((data ?? []).map(row => (row as Record<string, string>)[entityColumn])),
    ),
    schemaMissing: false,
  };
};

/**
 * tag id 배열을 slug 맵으로 변환합니다.
 */
export const getTagSlugMap = async (
  tagIds: string[],
): Promise<TagSchemaResult<Map<string, string>>> => {
  if (tagIds.length === 0) return { data: new Map(), schemaMissing: false };

  const supabase = createOptionalPublicServerSupabaseClient();
  if (!supabase) return { data: new Map(), schemaMissing: false };

  const { data, error } = await supabase.from('tags').select('id,slug').in('id', tagIds);

  if (error) {
    if (isMissingTagSchemaError(error.message)) {
      return { data: new Map(), schemaMissing: true };
    }

    throw new Error(`[tags] slug 맵 조회 실패: ${error.message}`);
  }

  return {
    data: new Map((data ?? []).map(row => [row.id, row.slug])),
    schemaMissing: false,
  };
};

/**
 * 엔터티에 연결된 태그 slug 목록을 relation table 기준으로 조회합니다.
 */
export const getRelatedTagSlugs = async ({
  entityColumn,
  entityId,
  locale,
  relationTable,
}: GetRelatedTagIdsOptions): Promise<TagSchemaResult<string[]>> => {
  const relatedTagIds = await getRelatedTagIds({
    entityColumn,
    entityId,
    locale,
    relationTable,
  });

  if (relatedTagIds.schemaMissing) {
    return { data: [], schemaMissing: true };
  }

  const tagSlugMap = await getTagSlugMap(relatedTagIds.data);
  if (tagSlugMap.schemaMissing) {
    return { data: [], schemaMissing: true };
  }

  return {
    data: relatedTagIds.data
      .map(tagId => tagSlugMap.data.get(tagId))
      .filter((slug): slug is string => typeof slug === 'string'),
    schemaMissing: false,
  };
};

/**
 * relation table에서 특정 locale에 연결된 tag id 전체를 가져옵니다.
 */
export const getRelatedTagIdsByLocale = async (
  relationTable: 'article_tags' | 'project_tags',
  locale: string,
): Promise<TagSchemaResult<string[]>> => {
  const supabase = createOptionalPublicServerSupabaseClient();
  if (!supabase) return { data: [], schemaMissing: false };

  const { data, error } = await supabase.from(relationTable).select('tag_id').eq('locale', locale);

  if (error) {
    if (isMissingTagSchemaError(error.message)) {
      return { data: [], schemaMissing: true };
    }

    throw new Error(`[tags] locale tag id 조회 실패: ${error.message}`);
  }

  return {
    data: (data ?? []).map(row => (row as { tag_id: string }).tag_id),
    schemaMissing: false,
  };
};

/**
 * relation table 전체에서 연결된 tag id를 가져옵니다.
 *
 * locale 없는 `*_tags_v2` shadow schema 집계를 우선 읽을 때 사용합니다.
 */
export const getAllRelatedTagIds = async (
  relationTable: 'article_tags_v2' | 'project_tags_v2',
): Promise<TagSchemaResult<string[]>> => {
  const supabase = createOptionalPublicServerSupabaseClient();
  if (!supabase) return { data: [], schemaMissing: false };

  const { data, error } = await supabase.from(relationTable).select('tag_id');

  if (error) {
    if (isMissingTagSchemaError(error.message)) {
      return { data: [], schemaMissing: true };
    }

    throw new Error(`[tags] 전체 relation tag id 조회 실패: ${error.message}`);
  }

  return {
    data: (data ?? []).map(row => (row as { tag_id: string }).tag_id),
    schemaMissing: false,
  };
};

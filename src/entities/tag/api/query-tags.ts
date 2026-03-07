import { CONTENT_SHADOW_SCHEMA } from '@/shared/lib/supabase/content-shadow-schema';
import { createOptionalPublicServerSupabaseClient } from '@/shared/lib/supabase/public-server';

import 'server-only';

type TagSchemaResult<T> = {
  data: T;
  schemaMissing: boolean;
};

type TagRow = {
  id: string;
  slug: string;
};

type TagTranslationRow = {
  label: string;
  tag_id: string;
};

type RelationTableName =
  | typeof CONTENT_SHADOW_SCHEMA.articleTags
  | typeof CONTENT_SHADOW_SCHEMA.projectTags;

type GetRelatedEntityIdsOptions = {
  entityColumn: 'article_id' | 'project_id';
  relationTable: RelationTableName;
  tagId: string;
};

type GetRelatedTagIdsOptions = {
  entityColumn: 'article_id' | 'project_id';
  entityId: string;
  relationTable: RelationTableName;
};

const isMissingTagSchemaError = (message: string) => {
  const normalizedMessage = message.toLowerCase();

  return (
    normalizedMessage.includes(CONTENT_SHADOW_SCHEMA.articleTags) ||
    normalizedMessage.includes(CONTENT_SHADOW_SCHEMA.projectTags) ||
    normalizedMessage.includes('tags') ||
    normalizedMessage.includes('tag_translations')
  );
};

/**
 * canonical slug로 태그 id를 조회합니다.
 *
 * 현재 런타임은 관계형 태그 스키마를 전제로 동작하므로,
 * 태그 테이블이 없으면 `schemaMissing`으로 상위 호출부에 전달합니다.
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
  relationTable,
}: GetRelatedTagIdsOptions): Promise<TagSchemaResult<string[]>> => {
  const supabase = createOptionalPublicServerSupabaseClient();
  if (!supabase) return { data: [], schemaMissing: false };

  const { data, error } = await supabase
    .from(relationTable)
    .select('tag_id')
    .eq(entityColumn, entityId);

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
  relationTable,
  tagId,
}: GetRelatedEntityIdsOptions): Promise<TagSchemaResult<string[]>> => {
  const supabase = createOptionalPublicServerSupabaseClient();
  if (!supabase) return { data: [], schemaMissing: false };

  const { data, error } = await supabase
    .from(relationTable)
    .select(entityColumn)
    .eq('tag_id', tagId);

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
 * canonical slug 목록을 locale별 표시 라벨 맵으로 변환합니다.
 */
export const getTagLabelMapBySlugs = async ({
  locale,
  slugs,
}: {
  locale: string;
  slugs: string[];
}): Promise<TagSchemaResult<Map<string, string>>> => {
  const normalizedSlugs = Array.from(
    new Set(
      slugs
        .map(slug => slug.trim().toLowerCase())
        .filter((slug): slug is string => slug.length > 0),
    ),
  );

  if (normalizedSlugs.length === 0) {
    return { data: new Map(), schemaMissing: false };
  }

  const supabase = createOptionalPublicServerSupabaseClient();
  if (!supabase) return { data: new Map(), schemaMissing: false };

  const { data: tagRows, error: tagError } = await supabase
    .from('tags')
    .select('id,slug')
    .in('slug', normalizedSlugs);

  if (tagError) {
    if (isMissingTagSchemaError(tagError.message)) {
      return { data: new Map(), schemaMissing: true };
    }

    throw new Error(`[tags] slug 목록 조회 실패: ${tagError.message}`);
  }

  const typedTagRows = (tagRows ?? []) as TagRow[];
  if (typedTagRows.length === 0) {
    return { data: new Map(), schemaMissing: false };
  }

  const { data: translationRows, error: translationError } = await supabase
    .from('tag_translations')
    .select('tag_id,label')
    .eq('locale', locale.toLowerCase())
    .in(
      'tag_id',
      typedTagRows.map(row => row.id),
    );

  if (translationError) {
    if (isMissingTagSchemaError(translationError.message)) {
      return { data: new Map(), schemaMissing: true };
    }

    throw new Error(`[tags] label 목록 조회 실패: ${translationError.message}`);
  }

  const slugById = new Map(typedTagRows.map(row => [row.id, row.slug]));

  return {
    data: new Map(
      ((translationRows ?? []) as TagTranslationRow[])
        .map(row => {
          const slug = slugById.get(row.tag_id);
          if (!slug) return null;

          return [slug, row.label] as const;
        })
        .filter((entry): entry is readonly [string, string] => entry !== null),
    ),
    schemaMissing: false,
  };
};

/**
 * 엔터티에 연결된 태그 slug 목록을 relation table 기준으로 조회합니다.
 */
export const getRelatedTagSlugs = async ({
  entityColumn,
  entityId,
  relationTable,
}: GetRelatedTagIdsOptions): Promise<TagSchemaResult<string[]>> => {
  const relatedTagIds = await getRelatedTagIds({
    entityColumn,
    entityId,
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
 * relation table 전체에서 연결된 tag id를 가져옵니다.
 *
 * locale 없는 canonical relation 집계를 계산할 때 사용합니다.
 */
export const getAllRelatedTagIds = async (
  relationTable:
    | typeof CONTENT_SHADOW_SCHEMA.articleTags
    | typeof CONTENT_SHADOW_SCHEMA.projectTags,
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

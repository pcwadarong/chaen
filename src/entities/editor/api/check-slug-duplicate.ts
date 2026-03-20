import { createOptionalPublicServerSupabaseClient } from '@/shared/lib/supabase/public-server';
import { createOptionalServiceRoleSupabaseClient } from '@/shared/lib/supabase/service-role';

import 'server-only';

type CheckContentSlugDuplicateResult = {
  data: {
    duplicate: boolean;
    source: 'articles' | 'projects' | null;
  };
  schemaMissing: boolean;
};

type TableSlugCheckResult = {
  duplicate: boolean;
  schemaMissing: boolean;
};

/**
 * slug 중복 확인용 content schema 누락 여부를 판별합니다.
 */
const isMissingContentSlugSchemaError = (message: string) => {
  const normalizedMessage = message.toLowerCase();
  const missingRelationPattern =
    /relation\s+"?[^"]*(articles|projects)[^"]*"?\s+does\s+not\s+exist/iu;

  return missingRelationPattern.test(normalizedMessage);
};

/**
 * 단일 content 테이블에서 slug 중복 여부를 확인합니다.
 */
const checkSlugInTable = async (
  table: 'articles' | 'projects',
  slug: string,
  excludeId?: string | null,
): Promise<TableSlugCheckResult> => {
  const supabase =
    createOptionalServiceRoleSupabaseClient() ?? createOptionalPublicServerSupabaseClient();
  if (!supabase) return { duplicate: false, schemaMissing: false };

  let query = supabase.from(table).select('id').eq('slug', slug).limit(1);

  if (excludeId) {
    query = query.neq('id', excludeId);
  }

  const { data, error } = await query;

  if (error) {
    if (isMissingContentSlugSchemaError(error.message)) {
      return { duplicate: false, schemaMissing: true };
    }

    throw new Error(`[content] ${table} slug 확인 실패: ${error.message}`);
  }

  return {
    duplicate: Array.isArray(data) && data.length > 0,
    schemaMissing: false,
  };
};

/**
 * article/project content slug가 이미 사용 중인지 확인합니다.
 */
export const checkSlugDuplicate = async (
  slug: string,
  options: {
    excludeId?: string | null;
    type?: 'article' | 'project';
  } = {},
): Promise<CheckContentSlugDuplicateResult> => {
  const normalizedSlug = slug.trim().toLowerCase();
  if (!normalizedSlug) {
    return {
      data: {
        duplicate: false,
        source: null,
      },
      schemaMissing: false,
    };
  }

  if (options.type) {
    const table = options.type === 'article' ? 'articles' : 'projects';
    const result = await checkSlugInTable(table, normalizedSlug, options.excludeId);

    return {
      data: {
        duplicate: result.duplicate,
        source: result.duplicate ? table : null,
      },
      schemaMissing: result.schemaMissing,
    };
  }

  const [articleResult, projectResult] = await Promise.all([
    checkSlugInTable('articles', normalizedSlug, options.excludeId),
    checkSlugInTable('projects', normalizedSlug, options.excludeId),
  ]);

  return {
    data: {
      duplicate: articleResult.duplicate || projectResult.duplicate,
      source: articleResult.duplicate ? 'articles' : projectResult.duplicate ? 'projects' : null,
    },
    schemaMissing: articleResult.schemaMissing && projectResult.schemaMissing,
  };
};

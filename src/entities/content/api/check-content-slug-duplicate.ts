import { createOptionalPublicServerSupabaseClient } from '@/shared/lib/supabase/public-server';

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
): Promise<TableSlugCheckResult> => {
  const supabase = createOptionalPublicServerSupabaseClient();
  if (!supabase) return { duplicate: false, schemaMissing: false };

  const { data, error } = await supabase
    .from(table)
    .select('id')
    .eq('slug', slug)
    .maybeSingle<{ id: string }>();

  if (error) {
    if (isMissingContentSlugSchemaError(error.message)) {
      return { duplicate: false, schemaMissing: true };
    }

    throw new Error(`[content] ${table} slug 확인 실패: ${error.message}`);
  }

  return {
    duplicate: Boolean(data?.id),
    schemaMissing: false,
  };
};

/**
 * article/project content slug가 이미 사용 중인지 확인합니다.
 */
export const checkContentSlugDuplicate = async (
  slug: string,
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

  const [articleResult, projectResult] = await Promise.all([
    checkSlugInTable('articles', normalizedSlug),
    checkSlugInTable('projects', normalizedSlug),
  ]);

  return {
    data: {
      duplicate: articleResult.duplicate || projectResult.duplicate,
      source: articleResult.duplicate ? 'articles' : projectResult.duplicate ? 'projects' : null,
    },
    schemaMissing: articleResult.schemaMissing && projectResult.schemaMissing,
  };
};

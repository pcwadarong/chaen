import type { SupabaseClient } from '@supabase/supabase-js';

import type { TechStack } from '@/entities/tech-stack/model/types';
import { TECH_STACK_CATEGORY_ORDER } from '@/entities/tech-stack/model/types';
import { createOptionalPublicServerSupabaseClient } from '@/shared/lib/supabase/public-server';
import { createOptionalServiceRoleSupabaseClient } from '@/shared/lib/supabase/service-role';

import 'server-only';

type ProjectTechStackRelationRow = {
  project_id: string;
  tech_stack_id: string;
};

const sortTechStacks = (items: TechStack[]) =>
  [...items].sort((left, right) => {
    const categoryGap =
      TECH_STACK_CATEGORY_ORDER.indexOf(left.category) -
      TECH_STACK_CATEGORY_ORDER.indexOf(right.category);

    if (categoryGap !== 0) {
      return categoryGap;
    }

    return left.name.localeCompare(right.name);
  });

/**
 * 전체 기술 스택 풀을 카테고리/이름 기준으로 반환합니다.
 */
export const getAllTechStacks = async (): Promise<TechStack[]> => {
  const supabase =
    createOptionalServiceRoleSupabaseClient() ?? createOptionalPublicServerSupabaseClient();
  if (!supabase) return [];

  const { data, error } = await supabase.from('tech_stacks').select('id,slug,name,category');

  if (error) {
    throw new Error(`[tech-stacks] 전체 목록 조회 실패: ${error.message}`);
  }

  return sortTechStacks((data ?? []) as TechStack[]);
};

/**
 * slug 배열을 기술 스택 id 배열로 변환합니다.
 */
export const getTechStackIdsBySlugs = async ({
  slugs,
  supabase,
}: {
  slugs: string[];
  supabase: SupabaseClient;
}): Promise<string[]> => {
  const normalizedSlugs = Array.from(
    new Set(slugs.map(slug => slug.trim().toLowerCase()).filter(slug => slug.length > 0)),
  );

  if (normalizedSlugs.length === 0) return [];

  const { data, error } = await supabase
    .from('tech_stacks')
    .select('id,slug')
    .in('slug', normalizedSlugs);

  if (error) {
    throw new Error(`[tech-stacks] slug 조회 실패: ${error.message}`);
  }

  const techStackIdBySlug = new Map(
    (data ?? []).map(row => [(row as { slug: string }).slug, (row as { id: string }).id]),
  );

  return normalizedSlugs
    .map(slug => techStackIdBySlug.get(slug))
    .filter((id): id is string => typeof id === 'string');
};

/**
 * id 배열을 기술 스택 slug 배열로 복원합니다.
 */
export const getTechStackSlugsByIds = async ({
  ids,
  supabase,
}: {
  ids: string[];
  supabase: SupabaseClient;
}): Promise<string[]> => {
  if (ids.length === 0) return [];

  const { data, error } = await supabase.from('tech_stacks').select('id,slug').in('id', ids);

  if (error) {
    throw new Error(`[tech-stacks] id 조회 실패: ${error.message}`);
  }

  const techStackSlugById = new Map(
    (data ?? []).map(row => [(row as { id: string }).id, (row as { slug: string }).slug]),
  );

  return ids
    .map(id => techStackSlugById.get(id))
    .filter((slug): slug is string => typeof slug === 'string');
};

/**
 * 프로젝트 id 목록별 기술 스택을 한 번에 조회합니다.
 */
export const getProjectTechStackMap = async (
  projectIds: string[],
): Promise<Map<string, TechStack[]>> => {
  if (projectIds.length === 0) return new Map();

  const supabase =
    createOptionalServiceRoleSupabaseClient() ?? createOptionalPublicServerSupabaseClient();
  if (!supabase) return new Map();

  const relationQuery = supabase.from('project_tech_stacks').select('project_id,tech_stack_id');
  const { data: relationRows, error: relationError } =
    projectIds.length === 1
      ? await relationQuery.eq('project_id', projectIds[0])
      : await relationQuery.in('project_id', projectIds);

  if (relationError) {
    throw new Error(`[tech-stacks] 프로젝트 relation 조회 실패: ${relationError.message}`);
  }

  const typedRelationRows = (relationRows ?? []) as ProjectTechStackRelationRow[];
  const techStackIds = Array.from(new Set(typedRelationRows.map(row => row.tech_stack_id)));

  if (techStackIds.length === 0) {
    return new Map(projectIds.map(projectId => [projectId, []] as const));
  }

  const { data: techStackRows, error: techStackError } = await supabase
    .from('tech_stacks')
    .select('id,slug,name,category')
    .in('id', techStackIds);

  if (techStackError) {
    throw new Error(`[tech-stacks] 기술 스택 조회 실패: ${techStackError.message}`);
  }

  const techStackById = new Map(((techStackRows ?? []) as TechStack[]).map(row => [row.id, row]));
  const techStacksByProjectId = new Map(
    projectIds.map(projectId => [projectId, [] as TechStack[]]),
  );

  typedRelationRows.forEach(row => {
    const techStack = techStackById.get(row.tech_stack_id);

    if (!techStack) return;

    const items = techStacksByProjectId.get(row.project_id) ?? [];
    items.push(techStack);
    techStacksByProjectId.set(row.project_id, items);
  });

  techStacksByProjectId.forEach((items, projectId) => {
    techStacksByProjectId.set(projectId, sortTechStacks(items));
  });

  return techStacksByProjectId;
};

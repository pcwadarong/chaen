'use server';

import { z } from 'zod';

import { getProjects } from '@/entities/project/api/list/get-projects';
import type { ProjectListPage } from '@/entities/project/model/types';
import {
  type ActionResult,
  createActionFailure,
  createActionSuccess,
} from '@/shared/lib/action/action-result';
import { validateActionInput } from '@/shared/lib/action/validate-action-input';

const projectFeedPageSchema = z.object({
  cursor: z
    .string()
    .nullish()
    .transform(value => value?.trim() || null),
  limit: z.number().int().min(1).max(50),
  locale: z.string().trim().min(2, '로케일을 확인할 수 없습니다.'),
});

const PROJECT_LIST_FETCH_FAILED = 'project.listFetchFailed';

/**
 * 프로젝트 목록 무한 스크롤용 페이지를 반환합니다.
 */
export const getProjectsPageAction = async (input: {
  cursor?: string | null;
  limit: number;
  locale: string;
}): Promise<ActionResult<ProjectListPage>> => {
  const validation = validateActionInput(projectFeedPageSchema, input);

  if (!validation.ok) {
    return createActionFailure(validation.errorMessage);
  }

  try {
    const page = await getProjects({
      cursor: validation.data.cursor,
      limit: validation.data.limit,
      locale: validation.data.locale,
    });

    return createActionSuccess(page);
  } catch (_error) {
    return createActionFailure(PROJECT_LIST_FETCH_FAILED, PROJECT_LIST_FETCH_FAILED);
  }
};

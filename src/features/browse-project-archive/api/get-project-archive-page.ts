'use server';

import { z } from 'zod';

import { getProjectDetailList } from '@/entities/project/api/detail/get-project-detail-list';
import type { ProjectArchivePage } from '@/entities/project/model/types';
import {
  type ActionResult,
  createActionFailure,
  createActionSuccess,
} from '@/shared/lib/action/action-result';
import { validateActionInput } from '@/shared/lib/action/validate-action-input';

const projectArchivePageSchema = z.object({
  cursor: z
    .string()
    .nullish()
    .transform(value => value?.trim() || null),
  limit: z.number().int().min(1).max(50),
  locale: z.string().trim().min(2, '로케일을 확인할 수 없습니다.'),
});

const PROJECT_ARCHIVE_FETCH_FAILED = 'project.archiveFetchFailed';

/**
 * 프로젝트 상세 좌측 아카이브 추가 로드 페이지를 반환합니다.
 */
export const getProjectDetailArchivePageAction = async (input: {
  cursor?: string | null;
  limit: number;
  locale: string;
}): Promise<ActionResult<ProjectArchivePage>> => {
  const validation = validateActionInput(projectArchivePageSchema, input);

  if (!validation.ok) {
    return createActionFailure(validation.errorMessage);
  }

  try {
    const page = await getProjectDetailList({
      cursor: validation.data.cursor,
      limit: validation.data.limit,
      locale: validation.data.locale,
    });

    return createActionSuccess(page);
  } catch (_error) {
    return createActionFailure(PROJECT_ARCHIVE_FETCH_FAILED, PROJECT_ARCHIVE_FETCH_FAILED);
  }
};

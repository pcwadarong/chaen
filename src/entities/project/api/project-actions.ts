'use server';

import { z } from 'zod';

import type { ProjectArchivePage, ProjectListPage } from '@/entities/project/model/types';
import {
  type ActionResult,
  createActionFailure,
  createActionSuccess,
} from '@/shared/lib/action/action-result';
import { validateActionInput } from '@/shared/lib/action/validate-action-input';

import { getProjectDetailList } from './get-project-detail-list';
import { getProjects } from './get-projects';

const projectFeedPageSchema = z.object({
  cursor: z
    .string()
    .nullish()
    .transform(value => value?.trim() || null),
  limit: z.number().int().min(1).max(50),
  locale: z.string().trim().min(2, '로케일을 확인할 수 없습니다.'),
});

const projectArchivePageSchema = z.object({
  cursor: z
    .string()
    .nullish()
    .transform(value => value?.trim() || null),
  limit: z.number().int().min(1).max(50),
  locale: z.string().trim().min(2, '로케일을 확인할 수 없습니다.'),
});

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
  } catch (error) {
    return createActionFailure(
      error instanceof Error ? error.message : '프로젝트 목록을 불러오지 못했습니다.',
    );
  }
};

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
  } catch (error) {
    return createActionFailure(
      error instanceof Error ? error.message : '아카이브를 불러오지 못했습니다.',
    );
  }
};

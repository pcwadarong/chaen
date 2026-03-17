'use server';

import { z } from 'zod';

import { getArticleDetailList } from '@/entities/article/api/detail/get-article-detail-list';
import type { ArticleArchivePage } from '@/entities/article/model/types';
import {
  type ActionResult,
  createActionFailure,
  createActionSuccess,
} from '@/shared/lib/action/action-result';
import { validateActionInput } from '@/shared/lib/action/validate-action-input';

const articleArchivePageSchema = z.object({
  cursor: z
    .string()
    .nullish()
    .transform(value => value?.trim() || null),
  limit: z.number().int().min(1).max(50),
  locale: z.string().trim().min(2, '로케일을 확인할 수 없습니다.'),
});

const ARTICLE_ARCHIVE_FETCH_FAILED = 'article.archiveFetchFailed';

/**
 * 아티클 상세 좌측 아카이브 추가 로드 페이지를 반환합니다.
 */
export const getArticleDetailArchivePageAction = async (input: {
  cursor?: string | null;
  limit: number;
  locale: string;
}): Promise<ActionResult<ArticleArchivePage>> => {
  const validation = validateActionInput(articleArchivePageSchema, input);

  if (!validation.ok) {
    return createActionFailure(validation.errorMessage);
  }

  try {
    const page = await getArticleDetailList({
      cursor: validation.data.cursor,
      limit: validation.data.limit,
      locale: validation.data.locale,
    });

    return createActionSuccess(page);
  } catch (_error) {
    return createActionFailure(ARTICLE_ARCHIVE_FETCH_FAILED, ARTICLE_ARCHIVE_FETCH_FAILED);
  }
};

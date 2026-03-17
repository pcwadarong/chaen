'use server';

import { z } from 'zod';

import { getArticles } from '@/entities/article/api/list/get-articles';
import type { ArticleListPage } from '@/entities/article/model/types';
import {
  type ActionResult,
  createActionFailure,
  createActionSuccess,
} from '@/shared/lib/action/action-result';
import { validateActionInput } from '@/shared/lib/action/validate-action-input';

const articleFeedPageSchema = z.object({
  cursor: z
    .string()
    .nullish()
    .transform(value => value?.trim() || null),
  limit: z.number().int().min(1).max(50),
  locale: z.string().trim().min(2, '로케일을 확인할 수 없습니다.'),
  query: z
    .string()
    .nullish()
    .transform(value => value?.trim() || null),
  tag: z
    .string()
    .nullish()
    .transform(value => value?.trim() || null),
});

const ARTICLE_LIST_FETCH_FAILED = 'article.listFetchFailed';

/**
 * 아티클 목록 무한 스크롤용 페이지를 반환합니다.
 */
export const getArticlesPageAction = async (input: {
  cursor?: string | null;
  limit: number;
  locale: string;
  query?: string | null;
  tag?: string | null;
}): Promise<ActionResult<ArticleListPage>> => {
  const validation = validateActionInput(articleFeedPageSchema, input);

  if (!validation.ok) {
    return createActionFailure(validation.errorMessage);
  }

  try {
    const page = await getArticles({
      cursor: validation.data.cursor,
      limit: validation.data.limit,
      locale: validation.data.locale,
      query: validation.data.query,
      tag: validation.data.tag,
    });

    return createActionSuccess(page);
  } catch (_error) {
    return createActionFailure(ARTICLE_LIST_FETCH_FAILED, ARTICLE_LIST_FETCH_FAILED);
  }
};

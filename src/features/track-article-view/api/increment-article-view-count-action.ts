'use server';

import { z } from 'zod';

import { incrementArticleViewCount } from '@/entities/article/api/mutations/increment-article-view-count';
import {
  type ActionResult,
  createActionFailure,
  createActionSuccess,
} from '@/shared/lib/action/action-result';
import { validateActionInput } from '@/shared/lib/action/validate-action-input';
import { getServerAuthState } from '@/shared/lib/auth/get-server-auth-state';

const incrementArticleViewCountSchema = z.object({
  articleId: z.string().trim().min(1, '대상 글을 확인할 수 없습니다.'),
});

type ArticleViewCountActionData = {
  viewCount: number;
};

const ARTICLE_VIEW_COUNT_UPDATE_FAILED = 'article.viewCountUpdateFailed';

/**
 * 아티클 조회수를 증가시키고 최신 값을 반환합니다.
 */
export const incrementArticleViewCountAction = async (input: {
  articleId: string;
}): Promise<ActionResult<ArticleViewCountActionData>> => {
  const validation = validateActionInput(incrementArticleViewCountSchema, input);

  if (!validation.ok) {
    return createActionFailure(validation.errorMessage);
  }

  await getServerAuthState();

  try {
    const viewCount = await incrementArticleViewCount(validation.data.articleId);

    return createActionSuccess({ viewCount });
  } catch (_error) {
    return createActionFailure(ARTICLE_VIEW_COUNT_UPDATE_FAILED, ARTICLE_VIEW_COUNT_UPDATE_FAILED);
  }
};

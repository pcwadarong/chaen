import type { ArticleComment } from '@/entities/article/comment/model';
import { createInitialActionResult } from '@/shared/lib/action/action-result';

type SubmitArticleCommentActionData = {
  comment: ArticleComment;
};

/**
 * 댓글 작성 action의 초기 상태입니다.
 */
export const initialSubmitArticleCommentState =
  createInitialActionResult<SubmitArticleCommentActionData>();

export const ARTICLE_COMMENT_ERROR_CODE = {
  articleIdRequired: 'articleComment.articleIdRequired',
  authorNameRequired: 'articleComment.authorNameRequired',
  commentArticleMismatch: 'articleComment.commentArticleMismatch',
  commentIdRequired: 'articleComment.commentIdRequired',
  commentNotFound: 'articleComment.commentNotFound',
  contentRequired: 'articleComment.contentRequired',
  contentTooLong: 'articleComment.contentTooLong',
  createFailed: 'articleComment.createFailed',
  deleteFailed: 'articleComment.deleteFailed',
  invalidAuthorBlogUrl: 'articleComment.invalidAuthorBlogUrl',
  invalidParentReference: 'articleComment.invalidParentReference',
  invalidPassword: 'articleComment.invalidPassword',
  parentCommentArticleMismatch: 'articleComment.parentCommentArticleMismatch',
  passwordRequired: 'articleComment.passwordRequired',
  replyTargetMismatch: 'articleComment.replyTargetMismatch',
  serviceRoleUnavailable: 'articleComment.serviceRoleUnavailable',
  updateFailed: 'articleComment.updateFailed',
} as const;

export type ArticleCommentErrorCode =
  (typeof ARTICLE_COMMENT_ERROR_CODE)[keyof typeof ARTICLE_COMMENT_ERROR_CODE];

const ARTICLE_COMMENT_ERROR_MESSAGE: Record<ArticleCommentErrorCode, string> = {
  [ARTICLE_COMMENT_ERROR_CODE.articleIdRequired]: 'articleId is required',
  [ARTICLE_COMMENT_ERROR_CODE.authorNameRequired]: 'authorName is required',
  [ARTICLE_COMMENT_ERROR_CODE.commentArticleMismatch]: 'comment does not belong to article',
  [ARTICLE_COMMENT_ERROR_CODE.commentIdRequired]: 'commentId is required',
  [ARTICLE_COMMENT_ERROR_CODE.commentNotFound]: 'comment not found',
  [ARTICLE_COMMENT_ERROR_CODE.contentRequired]: 'content is required',
  [ARTICLE_COMMENT_ERROR_CODE.contentTooLong]: 'content length must be 3000 or less',
  [ARTICLE_COMMENT_ERROR_CODE.createFailed]: 'failed to create comment',
  [ARTICLE_COMMENT_ERROR_CODE.deleteFailed]: 'failed to delete comment',
  [ARTICLE_COMMENT_ERROR_CODE.invalidAuthorBlogUrl]: 'authorBlogUrl must be a valid http/https URL',
  [ARTICLE_COMMENT_ERROR_CODE.invalidParentReference]: 'parentId must reference a root comment',
  [ARTICLE_COMMENT_ERROR_CODE.invalidPassword]: 'invalid password',
  [ARTICLE_COMMENT_ERROR_CODE.parentCommentArticleMismatch]:
    'parent comment does not belong to article',
  [ARTICLE_COMMENT_ERROR_CODE.passwordRequired]: 'password is required',
  [ARTICLE_COMMENT_ERROR_CODE.replyTargetMismatch]: 'reply target must belong to parent thread',
  [ARTICLE_COMMENT_ERROR_CODE.serviceRoleUnavailable]: 'service role env is not configured',
  [ARTICLE_COMMENT_ERROR_CODE.updateFailed]: 'failed to update comment',
};

type ArticleCommentError = Error & {
  code?: ArticleCommentErrorCode;
};

/**
 * 댓글 도메인 오류를 코드 기반으로 생성합니다.
 */
export const createArticleCommentError = (
  code: ArticleCommentErrorCode,
  detail?: string,
): ArticleCommentError => {
  const baseMessage = ARTICLE_COMMENT_ERROR_MESSAGE[code];
  const error = new Error(
    detail ? `${baseMessage}: ${detail}` : baseMessage,
  ) as ArticleCommentError;

  error.code = code;

  return error;
};

/**
 * 임의 오류에서 댓글 도메인 오류 코드를 추출합니다.
 */
export const resolveArticleCommentErrorCode = (error: unknown): ArticleCommentErrorCode | null => {
  if (!(error instanceof Error)) {
    return null;
  }

  const code = (error as ArticleCommentError).code;

  return code && Object.values(ARTICLE_COMMENT_ERROR_CODE).includes(code) ? code : null;
};

/**
 * 오류가 특정 댓글 도메인 코드와 일치하는지 검사합니다.
 */
export const hasArticleCommentErrorCode = (
  error: unknown,
  code: ArticleCommentErrorCode,
): boolean => resolveArticleCommentErrorCode(error) === code;

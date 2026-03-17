import type { ArticleComment, ArticleCommentsSort } from '@/entities/article/comment/model';

export type ReplyTarget = {
  authorName: string;
  commentId: string;
  content: string;
  parentId: string;
};

export type CommentQueryState = {
  page: number;
  sort: ArticleCommentsSort;
};

export type SubmitArticleCommentActionData = {
  comment: ArticleComment;
};

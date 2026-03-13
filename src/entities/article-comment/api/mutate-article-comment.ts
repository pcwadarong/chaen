import {
  hashGuestbookPassword,
  verifyGuestbookPassword,
} from '@/entities/guestbook/model/password';
import { createOptionalServiceRoleSupabaseClient } from '@/shared/lib/supabase/service-role';
import { normalizeHttpUrl } from '@/shared/lib/url/normalize-http-url';

import 'server-only';

import type { ArticleComment, ArticleCommentRow } from '../model/types';

type ServiceRoleClient = NonNullable<ReturnType<typeof createOptionalServiceRoleSupabaseClient>>;

type CreateArticleCommentInput = {
  articleId: string;
  authorBlogUrl?: string | null;
  authorName: string;
  content: string;
  parentId?: string | null;
  password: string;
  replyToCommentId?: string | null;
};

type UpdateArticleCommentInput = {
  articleId: string;
  commentId: string;
  content: string;
  password: string;
};

type DeleteArticleCommentInput = {
  articleId: string;
  commentId: string;
  password: string;
};

/**
 * API 응답용 공개 타입으로 변환합니다.
 */
const toPublicArticleComment = (comment: ArticleCommentRow): ArticleComment => {
  const { password_hash: _passwordHash, ...publicComment } = comment;

  return publicComment;
};

/**
 * 비밀번호 일치 여부를 검증합니다.
 */
const assertPasswordMatches = (password: string, row: ArticleCommentRow) => {
  const isValid = verifyGuestbookPassword(password.trim(), row.password_hash);
  if (!isValid) throw new Error('invalid password');
};

/**
 * 삭제되지 않은 댓글 한 건을 읽습니다.
 */
const readActiveComment = async (
  commentId: string,
): Promise<{ row: ArticleCommentRow; supabase: ServiceRoleClient }> => {
  const supabase = createOptionalServiceRoleSupabaseClient();
  if (!supabase) throw new Error('service role env is not configured');

  const { data, error } = await supabase
    .from('article_comments')
    .select('*')
    .eq('id', commentId)
    .is('deleted_at', null)
    .single();

  if (error || !data) throw new Error('comment not found');

  return {
    row: data as ArticleCommentRow,
    supabase,
  };
};

/**
 * 신규 댓글 payload를 정규화합니다.
 */
const normalizeCreateInput = (input: CreateArticleCommentInput) => {
  const articleId = input.articleId.trim();
  const authorName = input.authorName.trim();
  const content = input.content.trim();
  const password = input.password.trim();
  const rawAuthorBlogUrl = input.authorBlogUrl?.trim() || null;
  const parentId = input.parentId?.trim() || null;
  const replyToCommentId = input.replyToCommentId?.trim() || null;

  if (!articleId) throw new Error('articleId is required');
  if (!authorName) throw new Error('authorName is required');
  if (!content) throw new Error('content is required');
  if (content.length > 3000) throw new Error('content length must be 3000 or less');
  if (!password) throw new Error('password is required');
  if (!parentId && replyToCommentId)
    throw new Error('replyToCommentId is only allowed for replies');

  const authorBlogUrl = rawAuthorBlogUrl ? normalizeHttpUrl(rawAuthorBlogUrl) : null;
  if (rawAuthorBlogUrl && !authorBlogUrl) {
    throw new Error('authorBlogUrl must be a valid http/https URL');
  }

  return {
    articleId,
    authorBlogUrl,
    authorName,
    content,
    parentId,
    password,
    replyToCommentId,
  };
};

/**
 * 신규 아티클 댓글을 생성합니다.
 */
export const createArticleComment = async (
  input: CreateArticleCommentInput,
): Promise<ArticleComment> => {
  const normalized = normalizeCreateInput(input);
  const supabase = createOptionalServiceRoleSupabaseClient();
  if (!supabase) throw new Error('service role env is not configured');

  let parentId: string | null = null;
  let replyToCommentId: string | null = null;
  let replyToAuthorName: string | null = null;

  if (normalized.parentId) {
    const { row: parentRow } = await readActiveComment(normalized.parentId);

    if (parentRow.article_id !== normalized.articleId) {
      throw new Error('parent comment does not belong to article');
    }
    if (parentRow.parent_id) throw new Error('parentId must reference a root comment');

    const targetCommentId = normalized.replyToCommentId ?? normalized.parentId;
    const { row: targetRow } = await readActiveComment(targetCommentId);
    const isTargetInThread = targetRow.id === parentRow.id || targetRow.parent_id === parentRow.id;

    if (targetRow.article_id !== normalized.articleId || !isTargetInThread) {
      throw new Error('reply target must belong to parent thread');
    }

    parentId = parentRow.id;
    replyToCommentId = targetRow.id;
    replyToAuthorName = targetRow.author_name;
  }

  const { data, error } = await supabase
    .from('article_comments')
    .insert({
      article_id: normalized.articleId,
      author_blog_url: normalized.authorBlogUrl,
      author_name: normalized.authorName,
      content: normalized.content,
      parent_id: parentId,
      password_hash: hashGuestbookPassword(normalized.password),
      reply_to_author_name: replyToAuthorName,
      reply_to_comment_id: replyToCommentId,
    })
    .select('*')
    .single();

  if (error || !data) {
    throw new Error(`failed to create comment: ${error?.message ?? 'unknown error'}`);
  }

  return toPublicArticleComment(data as ArticleCommentRow);
};

/**
 * 비밀번호 기반으로 댓글을 수정합니다.
 */
export const updateArticleComment = async ({
  articleId,
  commentId,
  content,
  password,
}: UpdateArticleCommentInput): Promise<ArticleComment> => {
  const normalizedArticleId = articleId.trim();
  const normalizedCommentId = commentId.trim();
  const normalizedContent = content.trim();

  if (!normalizedArticleId) throw new Error('articleId is required');
  if (!normalizedCommentId) throw new Error('commentId is required');
  if (!normalizedContent) throw new Error('content is required');
  if (normalizedContent.length > 3000) throw new Error('content length must be 3000 or less');

  const { row: currentRow, supabase } = await readActiveComment(normalizedCommentId);
  if (currentRow.article_id !== normalizedArticleId)
    throw new Error('comment does not belong to article');
  assertPasswordMatches(password, currentRow);

  const { data, error } = await supabase
    .from('article_comments')
    .update({
      content: normalizedContent,
    })
    .eq('id', normalizedCommentId)
    .select('*')
    .single();

  if (error || !data) {
    throw new Error(`failed to update comment: ${error?.message ?? 'unknown error'}`);
  }

  return toPublicArticleComment(data as ArticleCommentRow);
};

/**
 * 비밀번호 기반으로 댓글을 소프트 삭제합니다.
 */
export const deleteArticleComment = async ({
  articleId,
  commentId,
  password,
}: DeleteArticleCommentInput): Promise<{
  articleId: string;
  id: string;
  parentId: string | null;
}> => {
  const normalizedArticleId = articleId.trim();
  const normalizedCommentId = commentId.trim();

  if (!normalizedArticleId) throw new Error('articleId is required');
  if (!normalizedCommentId) throw new Error('commentId is required');

  const { row: currentRow, supabase } = await readActiveComment(normalizedCommentId);
  if (currentRow.article_id !== normalizedArticleId)
    throw new Error('comment does not belong to article');
  assertPasswordMatches(password, currentRow);

  const { error } = await supabase
    .from('article_comments')
    .update({
      deleted_at: new Date().toISOString(),
    })
    .eq('id', normalizedCommentId);

  if (error) throw new Error(`failed to delete comment: ${error.message}`);

  return {
    articleId: normalizedArticleId,
    id: normalizedCommentId,
    parentId: currentRow.parent_id,
  };
};

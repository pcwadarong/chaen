import { revalidatePath, revalidateTag } from 'next/cache';
import { vi } from 'vitest';

import {
  ARTICLE_COMMENT_ERROR_CODE,
  createArticleCommentError,
} from '@/entities/article-comment/model/article-comment-error';
import { getServerAuthState } from '@/shared/lib/auth/get-server-auth-state';

import { initialSubmitArticleCommentState } from './article-comment-action-state';
import {
  deleteArticleCommentAction,
  getArticleCommentsPageAction,
  submitArticleComment,
  updateArticleCommentAction,
} from './article-comment-actions';
import { getArticleComments } from './get-article-comments';
import {
  createArticleComment,
  deleteArticleComment,
  updateArticleComment,
} from './mutate-article-comment';

const { createOptionalPublicServerSupabaseClient } = vi.hoisted(() => ({
  createOptionalPublicServerSupabaseClient: vi.fn(),
}));

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
}));

vi.mock('@/shared/lib/auth/get-server-auth-state', () => ({
  getServerAuthState: vi.fn(),
}));

vi.mock('@/shared/lib/supabase/public-server', () => ({
  createOptionalPublicServerSupabaseClient,
}));

vi.mock('@/shared/lib/i18n/get-action-translations', () => ({
  getActionTranslations: vi.fn(async () => (key: string) => {
    const messages = {
      'serverAction.articleNotFound': '대상 글을 확인할 수 없습니다.',
      'serverAction.commentNotFound': '대상 댓글을 확인할 수 없습니다.',
      'serverAction.contentRequired': '내용을 입력해주세요.',
      'serverAction.contentTooLong': '내용은 3000자 이하로 입력해주세요.',
      'serverAction.deleteFailed': '댓글 삭제에 실패했습니다.',
      'serverAction.fetchFailed': '댓글을 불러오지 못했습니다.',
      'serverAction.invalidPassword': '비밀번호가 올바르지 않습니다.',
      'serverAction.invalidUrl': '홈페이지 주소를 다시 확인해주세요.',
      'serverAction.missingName': '이름을 입력해주세요.',
      'serverAction.missingPassword': '비밀번호를 입력해주세요.',
      'serverAction.submitFailed': '댓글 등록에 실패했습니다.',
      'serverAction.updateFailed': '댓글 수정에 실패했습니다.',
    } as const;

    return messages[key as keyof typeof messages] ?? key;
  }),
  resolveActionLocale: vi.fn((locale?: string | null) => locale ?? 'ko'),
}));

vi.mock('./get-article-comments', () => ({
  getArticleComments: vi.fn(),
}));

vi.mock('./mutate-article-comment', () => ({
  createArticleComment: vi.fn(),
  deleteArticleComment: vi.fn(),
  updateArticleComment: vi.fn(),
}));

describe('article-comment-actions', () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.mocked(getServerAuthState).mockResolvedValue({
      isAdmin: false,
      isAuthenticated: false,
      userEmail: null,
      userId: null,
    });
    createOptionalPublicServerSupabaseClient.mockReturnValue({
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        not: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({
          data: {
            slug: 'article-1-slug',
          },
          error: null,
        }),
      }),
    });
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it('댓글 작성 action은 formData를 검증하고 생성 결과를 반환한다', async () => {
    vi.mocked(createArticleComment).mockResolvedValue({
      article_id: 'article-1',
      author_blog_url: null,
      author_name: 'guest',
      content: 'new comment',
      created_at: '2026-03-08T00:20:00.000Z',
      deleted_at: null,
      id: 'comment-2',
      parent_id: null,
      reply_to_author_name: null,
      reply_to_comment_id: null,
      updated_at: '2026-03-08T00:20:00.000Z',
    });

    const formData = new FormData();
    formData.set('locale', 'ko');
    formData.set('articleId', 'article-1');
    formData.set('authorName', 'guest');
    formData.set('authorBlogUrl', '');
    formData.set('content', 'new comment');
    formData.set('password', '1234');

    const result = await submitArticleComment(initialSubmitArticleCommentState, formData);

    expect(getServerAuthState).toHaveBeenCalledTimes(1);
    expect(createArticleComment).toHaveBeenCalledWith({
      articleId: 'article-1',
      authorBlogUrl: null,
      authorName: 'guest',
      content: 'new comment',
      parentId: null,
      password: '1234',
      replyToCommentId: null,
    });
    expect(revalidateTag).toHaveBeenCalledWith('article-comments');
    expect(revalidateTag).toHaveBeenCalledWith('article-comments:article-1');
    expect(revalidateTag).toHaveBeenCalledWith('article-comment:comment-2');
    expect(revalidatePath).toHaveBeenCalledWith('/ko/articles/article-1-slug');
    expect(result.ok).toBe(true);
  });

  it('댓글 페이지 action은 fresh 옵션을 bypassCache로 전달한다', async () => {
    vi.mocked(getArticleComments).mockResolvedValue({
      items: [],
      page: 2,
      pageSize: 10,
      sort: 'oldest',
      totalCount: 12,
      totalPages: 2,
    });

    const result = await getArticleCommentsPageAction({
      articleId: 'article-1',
      fresh: true,
      locale: 'ko',
      page: 2,
      sort: 'oldest',
    });

    expect(getArticleComments).toHaveBeenCalledWith({
      articleId: 'article-1',
      bypassCache: true,
      page: 2,
      sort: 'oldest',
    });
    expect(result.data?.page).toBe(2);
    expect(result.ok).toBe(true);
  });

  it('인증 상태 조회 실패를 inline 에러로 반환한다', async () => {
    vi.mocked(getServerAuthState).mockRejectedValue(new Error('[auth] 사용자 조회 실패: timeout'));

    const formData = new FormData();
    formData.set('locale', 'ko');
    formData.set('articleId', 'article-1');
    formData.set('authorName', 'guest');
    formData.set('authorBlogUrl', '');
    formData.set('content', 'new comment');
    formData.set('password', '1234');

    await expect(submitArticleComment(initialSubmitArticleCommentState, formData)).resolves.toEqual(
      {
        data: null,
        errorMessage: '댓글 등록에 실패했습니다.',
        ok: false,
      },
    );
  });

  it('댓글 수정 action은 비밀번호 오류를 그대로 반환한다', async () => {
    vi.mocked(updateArticleComment).mockRejectedValue(
      createArticleCommentError(ARTICLE_COMMENT_ERROR_CODE.invalidPassword),
    );

    const result = await updateArticleCommentAction({
      articleId: 'article-1',
      commentId: 'comment-1',
      content: 'updated',
      locale: 'ko',
      password: '1234',
    });

    expect(getServerAuthState).toHaveBeenCalledTimes(1);
    expect(result).toEqual({
      data: null,
      errorCode: ARTICLE_COMMENT_ERROR_CODE.invalidPassword,
      errorMessage: '비밀번호가 올바르지 않습니다.',
      ok: false,
    });
  });

  it('댓글 삭제 action은 삭제 id를 반환한다', async () => {
    vi.mocked(deleteArticleComment).mockResolvedValue({
      articleId: 'article-1',
      id: 'comment-1',
      parentId: null,
    });

    const result = await deleteArticleCommentAction({
      articleId: 'article-1',
      commentId: 'comment-1',
      locale: 'ko',
      password: '1234',
    });

    expect(result).toEqual({
      data: {
        deletedId: 'comment-1',
      },
      errorMessage: null,
      ok: true,
    });
  });

  it('slug 조회가 실패해도 댓글 작성 성공 결과는 유지한다', async () => {
    vi.mocked(createArticleComment).mockResolvedValue({
      article_id: 'article-1',
      author_blog_url: null,
      author_name: 'guest',
      content: 'new comment',
      created_at: '2026-03-08T00:20:00.000Z',
      deleted_at: null,
      id: 'comment-2',
      parent_id: null,
      reply_to_author_name: null,
      reply_to_comment_id: null,
      updated_at: '2026-03-08T00:20:00.000Z',
    });
    createOptionalPublicServerSupabaseClient.mockReturnValue({
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        not: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({
          data: null,
          error: {
            message: 'db timeout',
          },
        }),
      }),
    });

    const formData = new FormData();
    formData.set('locale', 'ko');
    formData.set('articleId', 'article-1');
    formData.set('authorName', 'guest');
    formData.set('authorBlogUrl', '');
    formData.set('content', 'new comment');
    formData.set('password', '1234');

    const result = await submitArticleComment(initialSubmitArticleCommentState, formData);

    expect(result.ok).toBe(true);
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      '[article-comments] revalidate 실패',
      expect.objectContaining({
        articleId: 'article-1',
        commentId: 'comment-2',
        phase: 'slug',
      }),
    );
  });

  it('path revalidate가 실패해도 댓글 삭제 성공 결과는 유지한다', async () => {
    vi.mocked(deleteArticleComment).mockResolvedValue({
      articleId: 'article-1',
      id: 'comment-1',
      parentId: null,
    });
    vi.mocked(revalidatePath).mockImplementation(() => {
      throw new Error('revalidate failed');
    });

    const result = await deleteArticleCommentAction({
      articleId: 'article-1',
      commentId: 'comment-1',
      locale: 'ko',
      password: '1234',
    });

    expect(result).toEqual({
      data: {
        deletedId: 'comment-1',
      },
      errorMessage: null,
      ok: true,
    });
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      '[article-comments] revalidate 실패',
      expect.objectContaining({
        articleId: 'article-1',
        articleSlug: 'article-1-slug',
        commentId: 'comment-1',
        phase: 'path',
      }),
    );
  });
});

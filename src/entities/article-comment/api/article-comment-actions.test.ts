import { revalidatePath, revalidateTag } from 'next/cache';

import { getServerAuthState } from '@/shared/lib/auth/get-server-auth-state';

import {
  deleteArticleCommentAction,
  getArticleCommentsPageAction,
  initialSubmitArticleCommentState,
  submitArticleComment,
  updateArticleCommentAction,
} from './article-comment-actions';
import { getArticleComments } from './get-article-comments';
import {
  createArticleComment,
  deleteArticleComment,
  updateArticleComment,
} from './mutate-article-comment';

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
}));

vi.mock('@/shared/lib/auth/get-server-auth-state', () => ({
  getServerAuthState: vi.fn(),
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
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getServerAuthState).mockResolvedValue({
      isAdmin: false,
      isAuthenticated: false,
      userEmail: null,
      userId: null,
    });
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
    expect(revalidatePath).toHaveBeenCalledWith('/ko/articles/article-1');
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

  it('댓글 수정 action은 비밀번호 오류를 그대로 반환한다', async () => {
    vi.mocked(updateArticleComment).mockRejectedValue(new Error('invalid password'));

    const result = await updateArticleCommentAction({
      articleId: 'article-1',
      commentId: 'comment-1',
      content: 'updated',
      password: '1234',
    });

    expect(getServerAuthState).toHaveBeenCalledTimes(1);
    expect(result).toEqual({
      data: null,
      errorMessage: 'invalid password',
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
});

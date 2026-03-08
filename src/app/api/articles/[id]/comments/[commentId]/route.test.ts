import { revalidateTag } from 'next/cache';
import { vi } from 'vitest';

import { deleteArticleComment, updateArticleComment } from '@/entities/article-comment';

import { DELETE, PATCH } from './route';

vi.mock('next/cache', () => ({
  revalidateTag: vi.fn(),
}));

vi.mock('@/entities/article-comment', () => ({
  deleteArticleComment: vi.fn(),
  updateArticleComment: vi.fn(),
}));

describe('/api/articles/[id]/comments/[commentId]', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('PATCH 성공 시 댓글을 반환하고 캐시 태그를 갱신한다', async () => {
    vi.mocked(updateArticleComment).mockResolvedValue({
      article_id: 'frontend',
      author_blog_url: null,
      author_name: 'guest',
      content: 'updated',
      created_at: '2026-03-07T00:00:00.000Z',
      deleted_at: null,
      id: 'comment-1',
      parent_id: null,
      reply_to_author_name: null,
      reply_to_comment_id: null,
      updated_at: '2026-03-07T00:03:00.000Z',
    });

    const request = new Request('http://localhost:3000/api/articles/frontend/comments/comment-1', {
      body: JSON.stringify({ content: 'updated', password: '1234' }),
      headers: { 'content-type': 'application/json' },
      method: 'PATCH',
    });

    const response = await PATCH(request, {
      params: Promise.resolve({ commentId: 'comment-1', id: 'frontend' }),
    });
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.ok).toBe(true);
    expect(revalidateTag).toHaveBeenCalledWith('article-comments');
    expect(revalidateTag).toHaveBeenCalledWith('article-comments:frontend');
    expect(revalidateTag).toHaveBeenCalledWith('article-comment:comment-1');
  });

  it('DELETE 성공 시 deletedId를 반환한다', async () => {
    vi.mocked(deleteArticleComment).mockResolvedValue({
      articleId: 'frontend',
      id: 'comment-1',
      parentId: null,
    });

    const request = new Request('http://localhost:3000/api/articles/frontend/comments/comment-1', {
      body: JSON.stringify({ password: '1234' }),
      headers: { 'content-type': 'application/json' },
      method: 'DELETE',
    });

    const response = await DELETE(request, {
      params: Promise.resolve({ commentId: 'comment-1', id: 'frontend' }),
    });
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.deletedId).toBe('comment-1');
  });

  it('invalid password는 403을 반환한다', async () => {
    vi.mocked(updateArticleComment).mockRejectedValue(new Error('invalid password'));

    const request = new Request('http://localhost:3000/api/articles/frontend/comments/comment-1', {
      body: JSON.stringify({ content: 'updated', password: 'wrong' }),
      headers: { 'content-type': 'application/json' },
      method: 'PATCH',
    });

    const response = await PATCH(request, {
      params: Promise.resolve({ commentId: 'comment-1', id: 'frontend' }),
    });
    const payload = await response.json();

    expect(response.status).toBe(403);
    expect(payload.reason).toBe('invalid password');
  });
});

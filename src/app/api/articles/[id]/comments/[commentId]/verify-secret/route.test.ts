import { vi } from 'vitest';

import { verifyArticleCommentSecret } from '@/entities/article-comment';

import { POST } from './route';

vi.mock('@/entities/article-comment', () => ({
  verifyArticleCommentSecret: vi.fn(),
}));

describe('POST /api/articles/[id]/comments/[commentId]/verify-secret', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('성공 시 실제 본문 댓글을 반환한다', async () => {
    vi.mocked(verifyArticleCommentSecret).mockResolvedValue({
      article_id: 'frontend',
      author_blog_url: null,
      author_name: 'guest',
      content: 'secret',
      created_at: '2026-03-07T00:00:00.000Z',
      deleted_at: null,
      id: 'comment-1',
      is_content_masked: false,
      is_secret: true,
      parent_id: null,
      reply_to_author_name: null,
      reply_to_comment_id: null,
      updated_at: '2026-03-07T00:00:00.000Z',
    });

    const request = new Request(
      'http://localhost:3000/api/articles/frontend/comments/comment-1/verify-secret',
      {
        body: JSON.stringify({ password: '1234' }),
        headers: { 'content-type': 'application/json' },
        method: 'POST',
      },
    );

    const response = await POST(request, {
      params: Promise.resolve({ commentId: 'comment-1', id: 'frontend' }),
    });
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.ok).toBe(true);
    expect(payload.comment.content).toBe('secret');
  });

  it('invalid password는 403을 반환한다', async () => {
    vi.mocked(verifyArticleCommentSecret).mockRejectedValue(new Error('invalid password'));

    const request = new Request(
      'http://localhost:3000/api/articles/frontend/comments/comment-1/verify-secret',
      {
        body: JSON.stringify({ password: 'wrong' }),
        headers: { 'content-type': 'application/json' },
        method: 'POST',
      },
    );

    const response = await POST(request, {
      params: Promise.resolve({ commentId: 'comment-1', id: 'frontend' }),
    });
    const payload = await response.json();

    expect(response.status).toBe(403);
    expect(payload.reason).toBe('invalid password');
  });
});

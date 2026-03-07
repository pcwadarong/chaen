import { revalidateTag } from 'next/cache';
import { vi } from 'vitest';

import { createArticleComment, getArticleComments } from '@/entities/article-comment';

import { GET, POST } from './route';

vi.mock('next/cache', () => ({
  revalidateTag: vi.fn(),
}));

vi.mock('@/entities/article-comment', () => ({
  createArticleComment: vi.fn(),
  getArticleComments: vi.fn(),
}));

describe('/api/articles/[id]/comments', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('GET 성공 시 페이지 응답을 반환한다', async () => {
    vi.mocked(getArticleComments).mockResolvedValue({
      items: [],
      page: 2,
      pageSize: 10,
      sort: 'oldest',
      totalCount: 12,
      totalPages: 2,
    });

    const response = await GET(
      new Request('http://localhost:3000/api/articles/frontend/comments?page=2&sort=oldest'),
      { params: Promise.resolve({ id: 'frontend' }) },
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.ok).toBe(true);
    expect(getArticleComments).toHaveBeenCalledWith({
      articleId: 'frontend',
      page: 2,
      sort: 'oldest',
    });
  });

  it('POST 성공 시 댓글을 반환하고 캐시 태그를 갱신한다', async () => {
    vi.mocked(createArticleComment).mockResolvedValue({
      article_id: 'frontend',
      author_blog_url: null,
      author_name: 'guest',
      content: 'hello',
      created_at: '2026-03-07T00:00:00.000Z',
      deleted_at: null,
      id: 'comment-1',
      parent_id: null,
      reply_to_author_name: null,
      reply_to_comment_id: null,
      updated_at: '2026-03-07T00:00:00.000Z',
    });

    const request = new Request('http://localhost:3000/api/articles/frontend/comments', {
      body: JSON.stringify({
        authorName: 'guest',
        content: 'hello',
        password: '1234',
      }),
      headers: {
        'content-type': 'application/json',
      },
      method: 'POST',
    });

    const response = await POST(request, { params: Promise.resolve({ id: 'frontend' }) });
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.ok).toBe(true);
    expect(revalidateTag).toHaveBeenCalledWith('article-comments');
    expect(revalidateTag).toHaveBeenCalledWith('article-comments:frontend');
    expect(revalidateTag).toHaveBeenCalledWith('article-comment:comment-1');
  });
});

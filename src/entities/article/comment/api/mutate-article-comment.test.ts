// @vitest-environment node

import { vi } from 'vitest';

import {
  createArticleComment,
  deleteArticleComment,
  updateArticleComment,
} from '@/entities/article/comment/api/mutate-article-comment';
import {
  hashGuestbookPassword,
  verifyGuestbookPassword,
} from '@/entities/guestbook/model/password';
import { createOptionalServiceRoleSupabaseClient } from '@/shared/lib/supabase/service-role';

vi.mock('@/shared/lib/supabase/service-role', () => ({
  createOptionalServiceRoleSupabaseClient: vi.fn(),
}));

vi.mock('@/entities/guestbook/model/password', () => ({
  hashGuestbookPassword: vi.fn(() => 'hashed-password'),
  verifyGuestbookPassword: vi.fn(() => true),
}));

describe('article comment mutations', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('루트 댓글을 생성할 때 비밀번호 해시를 저장한다', async () => {
    const insertSingle = vi.fn().mockResolvedValue({
      data: {
        article_id: 'frontend',
        author_blog_url: null,
        author_name: 'guest',
        content: 'hello',
        created_at: '2026-03-07T00:00:00.000Z',
        deleted_at: null,
        id: 'comment-1',
        parent_id: null,
        password_hash: 'hashed-password',
        reply_to_author_name: null,
        reply_to_comment_id: null,
        updated_at: '2026-03-07T00:00:00.000Z',
      },
      error: null,
    });

    const client = {
      from: vi.fn().mockReturnValue({
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: insertSingle,
      }),
    };

    vi.mocked(createOptionalServiceRoleSupabaseClient).mockReturnValue(client as never);

    await createArticleComment({
      articleId: 'frontend',
      authorName: 'guest',
      content: 'hello',
      password: '1234',
    });

    const call = client.from.mock.results[0]?.value;
    expect(call.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        password_hash: 'hashed-password',
        parent_id: null,
        reply_to_author_name: null,
      }),
    );
    expect(hashGuestbookPassword).toHaveBeenCalledWith('1234');
  });

  it('대댓글의 대댓글은 루트 아래에 저장하고 대상 작성자 멘션을 보존한다', async () => {
    const rootSingle = vi.fn().mockResolvedValue({
      data: {
        article_id: 'frontend',
        author_blog_url: null,
        author_name: 'root-author',
        content: 'root',
        created_at: '2026-03-07T00:00:00.000Z',
        deleted_at: null,
        id: 'root-1',
        parent_id: null,
        password_hash: 'hash',
        reply_to_author_name: null,
        reply_to_comment_id: null,
        updated_at: '2026-03-07T00:00:00.000Z',
      },
      error: null,
    });

    const replySingle = vi.fn().mockResolvedValue({
      data: {
        article_id: 'frontend',
        author_blog_url: null,
        author_name: 'reply-author',
        content: 'reply',
        created_at: '2026-03-07T00:01:00.000Z',
        deleted_at: null,
        id: 'reply-1',
        parent_id: 'root-1',
        password_hash: 'hash',
        reply_to_author_name: 'root-author',
        reply_to_comment_id: 'root-1',
        updated_at: '2026-03-07T00:01:00.000Z',
      },
      error: null,
    });

    const insertSingle = vi.fn().mockResolvedValue({
      data: {
        article_id: 'frontend',
        author_blog_url: null,
        author_name: 'nested-reply',
        content: 'nested',
        created_at: '2026-03-07T00:02:00.000Z',
        deleted_at: null,
        id: 'reply-2',
        parent_id: 'root-1',
        password_hash: 'hashed-password',
        reply_to_author_name: 'reply-author',
        reply_to_comment_id: 'reply-1',
        updated_at: '2026-03-07T00:02:00.000Z',
      },
      error: null,
    });

    const client = {
      from: vi
        .fn()
        .mockReturnValueOnce({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          is: vi.fn().mockReturnThis(),
          single: rootSingle,
        })
        .mockReturnValueOnce({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          is: vi.fn().mockReturnThis(),
          single: replySingle,
        })
        .mockReturnValueOnce({
          insert: vi.fn().mockReturnThis(),
          select: vi.fn().mockReturnThis(),
          single: insertSingle,
        }),
    };

    vi.mocked(createOptionalServiceRoleSupabaseClient).mockReturnValue(client as never);

    await createArticleComment({
      articleId: 'frontend',
      authorName: 'nested-reply',
      content: 'nested',
      parentId: 'root-1',
      password: '1234',
      replyToCommentId: 'reply-1',
    });

    const insertCall = client.from.mock.results[2]?.value;
    expect(insertCall.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        parent_id: 'root-1',
        reply_to_author_name: 'reply-author',
        reply_to_comment_id: 'reply-1',
      }),
    );
  });

  it('답글의 parentId는 반드시 루트 댓글이어야 한다', async () => {
    const replySingle = vi.fn().mockResolvedValue({
      data: {
        article_id: 'frontend',
        author_blog_url: null,
        author_name: 'reply-author',
        content: 'reply',
        created_at: '2026-03-07T00:01:00.000Z',
        deleted_at: null,
        id: 'reply-1',
        parent_id: 'root-1',
        password_hash: 'hash',
        reply_to_author_name: 'root-author',
        reply_to_comment_id: 'root-1',
        updated_at: '2026-03-07T00:01:00.000Z',
      },
      error: null,
    });

    vi.mocked(createOptionalServiceRoleSupabaseClient).mockReturnValue({
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        is: vi.fn().mockReturnThis(),
        single: replySingle,
      }),
    } as never);

    await expect(
      createArticleComment({
        articleId: 'frontend',
        authorName: 'nested-reply',
        content: 'nested',
        parentId: 'reply-1',
        password: '1234',
      }),
    ).rejects.toThrow('parentId must reference a root comment');
  });

  it('비밀번호가 없으면 등록에 실패한다', async () => {
    vi.mocked(createOptionalServiceRoleSupabaseClient).mockReturnValue({
      from: vi.fn(),
    } as never);

    await expect(
      createArticleComment({
        articleId: 'frontend',
        authorName: 'guest',
        content: 'hello',
        password: '',
      }),
    ).rejects.toThrow('password is required');
  });

  it('위험한 블로그 URL은 저장하지 않도록 등록을 거부한다', async () => {
    vi.mocked(createOptionalServiceRoleSupabaseClient).mockReturnValue({
      from: vi.fn(),
    } as never);

    await expect(
      createArticleComment({
        articleId: 'frontend',
        authorBlogUrl: 'javascript:alert(1)',
        authorName: 'guest',
        content: 'hello',
        password: '1234',
      }),
    ).rejects.toThrow('authorBlogUrl must be a valid http/https URL');
  });

  it('수정/삭제는 비밀번호 검증을 거친다', async () => {
    const single = vi.fn().mockResolvedValue({
      data: {
        article_id: 'frontend',
        author_blog_url: null,
        author_name: 'guest',
        content: 'secret',
        created_at: '2026-03-07T00:00:00.000Z',
        deleted_at: null,
        id: 'comment-1',
        parent_id: null,
        password_hash: 'hash',
        reply_to_author_name: null,
        reply_to_comment_id: null,
        updated_at: '2026-03-07T00:00:00.000Z',
      },
      error: null,
    });

    const updateSingle = vi.fn().mockResolvedValue({
      data: {
        article_id: 'frontend',
        author_blog_url: null,
        author_name: 'guest',
        content: 'updated',
        created_at: '2026-03-07T00:00:00.000Z',
        deleted_at: null,
        id: 'comment-1',
        parent_id: null,
        password_hash: 'hash',
        reply_to_author_name: null,
        reply_to_comment_id: null,
        updated_at: '2026-03-07T00:03:00.000Z',
      },
      error: null,
    });

    const updateClient = {
      from: vi
        .fn()
        .mockReturnValueOnce({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          is: vi.fn().mockReturnThis(),
          single,
        })
        .mockReturnValueOnce({
          update: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          select: vi.fn().mockReturnThis(),
          single: updateSingle,
        }),
    };

    vi.mocked(createOptionalServiceRoleSupabaseClient).mockReturnValue(updateClient as never);

    await updateArticleComment({
      articleId: 'frontend',
      commentId: 'comment-1',
      content: 'updated',
      password: '1234',
    });

    expect(verifyGuestbookPassword).toHaveBeenCalledWith('1234', 'hash');
    const updateCall = updateClient.from.mock.results[1]?.value;
    expect(updateCall.update).toHaveBeenCalledWith({
      content: 'updated',
    });

    const deleteClient = {
      from: vi
        .fn()
        .mockReturnValueOnce({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          is: vi.fn().mockReturnThis(),
          single,
        })
        .mockReturnValueOnce({
          update: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
        }),
    };

    vi.mocked(createOptionalServiceRoleSupabaseClient).mockReturnValue(deleteClient as never);

    await deleteArticleComment({
      articleId: 'frontend',
      commentId: 'comment-1',
      password: '1234',
    });

    expect(verifyGuestbookPassword).toHaveBeenCalledTimes(2);
    const deleteCall = deleteClient.from.mock.results[1]?.value;
    expect(deleteCall.update).toHaveBeenCalledWith({
      deleted_at: expect.any(String),
    });
  });
});

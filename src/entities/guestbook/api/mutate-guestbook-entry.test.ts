import { vi } from 'vitest';

import { createOptionalServiceRoleSupabaseClient } from '@/lib/supabase/service-role';

import { hashGuestbookPassword } from '../lib/password';

import { createGuestbookEntry } from './mutate-guestbook-entry';

vi.mock('@/lib/supabase/service-role', () => ({
  createOptionalServiceRoleSupabaseClient: vi.fn(),
}));

vi.mock('../lib/password', () => ({
  hashGuestbookPassword: vi.fn(() => 'hashed-password'),
  verifyGuestbookPassword: vi.fn(() => true),
}));

describe('createGuestbookEntry', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('관리자 비밀 답댓글은 원댓글 password_hash를 상속한다', async () => {
    const parentSingle = vi.fn().mockResolvedValue({
      data: {
        id: 'parent-1',
        parent_id: null,
        author_name: 'guest',
        author_blog_url: null,
        password_hash: 'parent-hash',
        content: 'parent',
        is_secret: true,
        is_admin_reply: false,
        created_at: '2026-03-05T00:00:00.000Z',
        updated_at: '2026-03-05T00:00:00.000Z',
        deleted_at: null,
      },
      error: null,
    });

    const insertSingle = vi.fn().mockResolvedValue({
      data: {
        id: 'reply-1',
        parent_id: 'parent-1',
        author_name: 'admin',
        author_blog_url: null,
        password_hash: 'parent-hash',
        content: 'secret reply',
        is_secret: true,
        is_admin_reply: true,
        created_at: '2026-03-05T00:10:00.000Z',
        updated_at: '2026-03-05T00:10:00.000Z',
        deleted_at: null,
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
          single: parentSingle,
        })
        .mockReturnValueOnce({
          insert: vi.fn().mockReturnThis(),
          select: vi.fn().mockReturnThis(),
          single: insertSingle,
        }),
    };

    vi.mocked(createOptionalServiceRoleSupabaseClient).mockReturnValue(client as never);

    await createGuestbookEntry({
      authorName: 'admin',
      content: 'secret reply',
      isAdminReply: true,
      isSecret: true,
      parentId: 'parent-1',
      password: '',
    });

    const secondCall = client.from.mock.results[1]?.value;
    expect(secondCall.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        password_hash: 'parent-hash',
      }),
    );
    expect(hashGuestbookPassword).not.toHaveBeenCalled();
  });

  it('관리자 공개 답댓글은 password_hash를 null로 저장한다', async () => {
    const insertSingle = vi.fn().mockResolvedValue({
      data: {
        id: 'reply-2',
        parent_id: 'parent-2',
        author_name: 'admin',
        author_blog_url: null,
        password_hash: null,
        content: 'public reply',
        is_secret: false,
        is_admin_reply: true,
        created_at: '2026-03-05T00:10:00.000Z',
        updated_at: '2026-03-05T00:10:00.000Z',
        deleted_at: null,
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

    await createGuestbookEntry({
      authorName: 'admin',
      content: 'public reply',
      isAdminReply: true,
      isSecret: false,
      parentId: 'parent-2',
      password: '',
    });

    const firstCall = client.from.mock.results[0]?.value;
    expect(firstCall.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        password_hash: null,
      }),
    );
    expect(hashGuestbookPassword).not.toHaveBeenCalled();
  });
});

import { vi } from 'vitest';

import {
  createGuestbookEntry,
  deleteGuestbookEntry,
  updateGuestbookEntry,
} from '@/entities/guestbook/api/mutate-guestbook-entry';
import { hashGuestbookPassword } from '@/entities/guestbook/model/password';
import { createOptionalServiceRoleSupabaseClient } from '@/shared/lib/supabase/service-role';

vi.mock('@/shared/lib/supabase/service-role', () => ({
  createOptionalServiceRoleSupabaseClient: vi.fn(),
}));

vi.mock('../model/password', () => ({
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
        is_admin_author: false,
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
        is_admin_author: true,
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
      isAdminAuthor: true,
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
        is_admin_author: true,
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
      isAdminAuthor: true,
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

  it('일반 원댓글은 비밀번호가 없으면 등록에 실패한다', async () => {
    vi.mocked(createOptionalServiceRoleSupabaseClient).mockReturnValue({
      from: vi.fn(),
    } as never);

    await expect(
      createGuestbookEntry({
        authorName: 'guest',
        content: 'hello',
        isSecret: false,
        parentId: null,
        password: '',
      }),
    ).rejects.toThrow('password is required');
  });

  it('일반 사용자의 비밀 원댓글은 생성 직후 본문을 숨겨 반환한다', async () => {
    const insertSingle = vi.fn().mockResolvedValue({
      data: {
        id: 'thread-secret-1',
        parent_id: null,
        author_name: 'guest',
        author_blog_url: null,
        password_hash: 'hashed-password',
        content: 'secret body',
        is_secret: true,
        is_admin_author: false,
        created_at: '2026-03-06T00:00:00.000Z',
        updated_at: '2026-03-06T00:00:00.000Z',
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

    const created = await createGuestbookEntry({
      authorName: 'guest',
      content: 'secret body',
      isSecret: true,
      parentId: null,
      password: '1234',
    });

    expect(created.content).toBe('');
    expect(created.is_content_masked).toBe(true);
  });

  it('관리자 원댓글은 비밀번호 없이 등록할 수 있다', async () => {
    const insertSingle = vi.fn().mockResolvedValue({
      data: {
        id: 'thread-admin-1',
        parent_id: null,
        author_name: 'admin',
        author_blog_url: null,
        password_hash: null,
        content: 'admin thread',
        is_secret: false,
        is_admin_author: true,
        created_at: '2026-03-06T00:00:00.000Z',
        updated_at: '2026-03-06T00:00:00.000Z',
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
      content: 'admin thread',
      isAdminAuthor: true,
      isSecret: false,
      parentId: null,
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

  it('관리자가 아닌 사용자의 답댓글은 비밀번호 없이 등록할 수 없다', async () => {
    vi.mocked(createOptionalServiceRoleSupabaseClient).mockReturnValue({
      from: vi.fn(),
    } as never);

    await expect(
      createGuestbookEntry({
        authorName: 'guest',
        content: 'reply',
        isSecret: false,
        parentId: 'parent-1',
        password: '',
      }),
    ).rejects.toThrow('password is required');
  });
});

describe('guestbook entry mutations', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('수정은 updated_at을 직접 쓰지 않고 트리거에 맡긴다', async () => {
    const currentSingle = vi.fn().mockResolvedValue({
      data: {
        id: 'entry-1',
        parent_id: null,
        author_name: 'guest',
        author_blog_url: null,
        password_hash: 'entry-hash',
        content: 'before',
        is_secret: false,
        is_admin_author: false,
        created_at: '2026-03-05T00:00:00.000Z',
        updated_at: '2026-03-05T00:00:00.000Z',
        deleted_at: null,
      },
      error: null,
    });

    const updateSingle = vi.fn().mockResolvedValue({
      data: {
        id: 'entry-1',
        parent_id: null,
        author_name: 'guest',
        author_blog_url: null,
        password_hash: 'entry-hash',
        content: 'after',
        is_secret: false,
        is_admin_author: false,
        created_at: '2026-03-05T00:00:00.000Z',
        updated_at: '2026-03-05T00:01:00.000Z',
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
          single: currentSingle,
        })
        .mockReturnValueOnce({
          update: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          select: vi.fn().mockReturnThis(),
          single: updateSingle,
        }),
    };

    vi.mocked(createOptionalServiceRoleSupabaseClient).mockReturnValue(client as never);

    await updateGuestbookEntry({
      content: 'after',
      entryId: 'entry-1',
      password: '1234',
    });

    const updateCall = client.from.mock.results[1]?.value;
    expect(updateCall.update).toHaveBeenCalledWith({
      content: 'after',
    });
  });

  it('삭제는 deleted_at만 직접 쓰고 updated_at은 트리거에 맡긴다', async () => {
    const currentSingle = vi.fn().mockResolvedValue({
      data: {
        id: 'entry-1',
        parent_id: null,
        author_name: 'guest',
        author_blog_url: null,
        password_hash: 'entry-hash',
        content: 'before',
        is_secret: false,
        is_admin_author: false,
        created_at: '2026-03-05T00:00:00.000Z',
        updated_at: '2026-03-05T00:00:00.000Z',
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
          single: currentSingle,
        })
        .mockReturnValueOnce({
          update: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
        }),
    };

    vi.mocked(createOptionalServiceRoleSupabaseClient).mockReturnValue(client as never);

    await deleteGuestbookEntry({
      entryId: 'entry-1',
      password: '1234',
    });

    const deleteCall = client.from.mock.results[1]?.value;
    expect(deleteCall.update).toHaveBeenCalledWith({
      deleted_at: expect.any(String),
    });
  });
});

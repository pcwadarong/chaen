import {
  createGuestbookEntry,
  getGuestbookThreads,
  verifyGuestbookSecret,
} from '@/entities/guestbook';
import { revalidateGuestbookCache } from '@/entities/guestbook/lib/revalidate-guestbook-cache';
import { getServerAuthState } from '@/shared/lib/auth/get-server-auth-state';

import {
  getGuestbookThreadsPage,
  initialSubmitGuestbookEntryState,
  initialVerifyGuestbookSecretState,
  submitGuestbookEntry,
  verifyGuestbookSecretAction,
} from './guestbook-actions';

vi.mock('@/entities/guestbook', () => ({
  createGuestbookEntry: vi.fn(),
  deleteGuestbookEntry: vi.fn(),
  getGuestbookThreads: vi.fn(),
  updateGuestbookEntry: vi.fn(),
  verifyGuestbookSecret: vi.fn(),
}));

vi.mock('@/entities/guestbook/lib/revalidate-guestbook-cache', () => ({
  revalidateGuestbookCache: vi.fn(),
}));

vi.mock('@/shared/lib/auth/get-server-auth-state', () => ({
  getServerAuthState: vi.fn(),
}));

describe('guestbook-actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getServerAuthState).mockResolvedValue({
      isAdmin: false,
      isAuthenticated: false,
      userEmail: null,
      userId: null,
    });
  });

  it('방명록 작성 성공 시 entry를 반환하고 캐시를 갱신한다', async () => {
    vi.mocked(createGuestbookEntry).mockResolvedValue({
      author_blog_url: null,
      author_name: 'guest',
      content: 'hello',
      created_at: '2026-03-10T00:00:00.000Z',
      deleted_at: null,
      id: 'entry-1',
      is_admin_author: false,
      is_content_masked: false,
      is_secret: false,
      parent_id: null,
      updated_at: '2026-03-10T00:00:00.000Z',
    });

    const formData = new FormData();
    formData.set('authorName', 'guest');
    formData.set('content', 'hello');
    formData.set('password', '1234');

    const result = await submitGuestbookEntry(initialSubmitGuestbookEntryState, formData);

    expect(result).toEqual({
      data: {
        entry: expect.objectContaining({
          id: 'entry-1',
        }),
      },
      errorMessage: null,
      ok: true,
    });
    expect(revalidateGuestbookCache).toHaveBeenCalledWith({ parentId: null });
  });

  it('비밀글 검증 실패 시 에러 메시지를 반환한다', async () => {
    vi.mocked(verifyGuestbookSecret).mockRejectedValue(new Error('invalid password'));

    const formData = new FormData();
    formData.set('entryId', 'entry-1');
    formData.set('password', '1234');

    await expect(
      verifyGuestbookSecretAction(initialVerifyGuestbookSecretState, formData),
    ).resolves.toEqual({
      data: null,
      errorMessage: 'invalid password',
      ok: false,
    });
  });

  it('방명록 페이지 조회 action은 인증 상태에 따라 includeSecret을 전달한다', async () => {
    vi.mocked(getServerAuthState).mockResolvedValue({
      isAdmin: true,
      isAuthenticated: true,
      userEmail: 'admin@example.com',
      userId: 'admin-id',
    });
    vi.mocked(getGuestbookThreads).mockResolvedValue({
      items: [],
      nextCursor: '12',
    });

    await expect(getGuestbookThreadsPage({ cursor: '0', limit: 12 })).resolves.toEqual({
      data: {
        items: [],
        nextCursor: '12',
      },
      errorMessage: null,
      ok: true,
    });

    expect(getGuestbookThreads).toHaveBeenCalledWith({
      cursor: '0',
      includeSecret: true,
      limit: 12,
    });
  });
});

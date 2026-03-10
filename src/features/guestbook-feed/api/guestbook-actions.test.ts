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

vi.mock('@/shared/lib/i18n/get-action-translations', () => ({
  getActionTranslations: vi.fn(async () => (key: string) => {
    const messages = {
      'serverAction.adminReplyOnly': '관리자만 답신을 작성할 수 있습니다.',
      'serverAction.adminRequired': '관리자 권한이 필요합니다.',
      'serverAction.contentRequired': '내용을 입력해주세요.',
      'serverAction.contentTooLong': '내용은 3000자 이하로 입력해주세요.',
      'serverAction.deleteFailed': '방명록 삭제에 실패했습니다.',
      'serverAction.entryNotFound': '대상 글을 확인할 수 없습니다.',
      'serverAction.fetchFailed': '방명록을 불러오지 못했습니다.',
      'serverAction.invalidPassword': '비밀번호가 올바르지 않습니다.',
      'serverAction.invalidUrl': '홈페이지 주소를 다시 확인해주세요.',
      'serverAction.missingName': '이름을 입력해주세요.',
      'serverAction.missingParentSecret': '비밀글 정보를 확인할 수 없습니다.',
      'serverAction.missingPassword': '비밀번호를 입력해주세요.',
      'serverAction.submitFailed': '방명록 등록에 실패했습니다.',
      'serverAction.updateFailed': '방명록 수정에 실패했습니다.',
      'serverAction.verifyFailed': '비밀글 확인에 실패했습니다.',
    } as const;

    return messages[key as keyof typeof messages] ?? key;
  }),
  resolveActionLocale: vi.fn((locale?: string | null) => locale ?? 'ko'),
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
    formData.set('locale', 'ko');
    formData.set('authorName', 'guest');
    formData.set('authorBlogUrl', 'https://example.com');
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
    expect(createGuestbookEntry).toHaveBeenCalledWith(
      expect.objectContaining({
        authorBlogUrl: 'https://example.com/',
      }),
    );
  });

  it('인증 상태 조회 실패를 inline 에러로 반환한다', async () => {
    vi.mocked(getServerAuthState).mockRejectedValue(new Error('[auth] 사용자 조회 실패: timeout'));

    const formData = new FormData();
    formData.set('locale', 'ko');
    formData.set('authorName', 'guest');
    formData.set('content', 'hello');
    formData.set('password', '1234');

    await expect(submitGuestbookEntry(initialSubmitGuestbookEntryState, formData)).resolves.toEqual(
      {
        data: null,
        errorMessage: '방명록 등록에 실패했습니다.',
        ok: false,
      },
    );
  });

  it('비밀글 검증 실패 시 에러 메시지를 반환한다', async () => {
    vi.mocked(verifyGuestbookSecret).mockRejectedValue(new Error('invalid password'));

    const formData = new FormData();
    formData.set('locale', 'ko');
    formData.set('entryId', 'entry-1');
    formData.set('password', '1234');

    await expect(
      verifyGuestbookSecretAction(initialVerifyGuestbookSecretState, formData),
    ).resolves.toEqual({
      data: null,
      errorMessage: '비밀번호가 올바르지 않습니다.',
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

  it('방명록 페이지 조회 action은 null cursor를 허용한다', async () => {
    vi.mocked(getGuestbookThreads).mockResolvedValue({
      items: [],
      nextCursor: null,
    });

    await expect(getGuestbookThreadsPage({ cursor: null, limit: 12 })).resolves.toEqual({
      data: {
        items: [],
        nextCursor: null,
      },
      errorMessage: null,
      ok: true,
    });

    expect(getGuestbookThreads).toHaveBeenCalledWith({
      cursor: null,
      includeSecret: false,
      limit: 12,
    });
  });

  it('알 수 없는 내부 에러는 고정된 사용자 메시지로 감춘다', async () => {
    vi.mocked(createGuestbookEntry).mockRejectedValue(
      new Error('failed to create entry: duplicate key'),
    );

    const formData = new FormData();
    formData.set('locale', 'ko');
    formData.set('authorName', 'guest');
    formData.set('content', 'hello');
    formData.set('password', '1234');

    await expect(submitGuestbookEntry(initialSubmitGuestbookEntryState, formData)).resolves.toEqual(
      {
        data: null,
        errorMessage: '방명록 등록에 실패했습니다.',
        ok: false,
      },
    );
  });
});

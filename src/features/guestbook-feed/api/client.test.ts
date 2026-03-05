import type { GuestbookEntry } from '@/entities/guestbook/model/types';
import {
  createGuestbookEntryClient,
  verifyGuestbookSecretClient,
} from '@/features/guestbook-feed/api/client';

/**
 * 테스트에서 재사용하는 방명록 항목 fixture를 생성합니다.
 */
const createEntryFixture = (): GuestbookEntry => ({
  author_blog_url: null,
  author_name: 'tester',
  content: 'hello',
  created_at: '2026-03-05T00:00:00.000Z',
  deleted_at: null,
  id: 'entry-1',
  is_admin_reply: false,
  is_secret: false,
  parent_id: null,
  updated_at: '2026-03-05T00:00:00.000Z',
});

/**
 * JSON 응답 객체를 생성합니다.
 */
const createJsonResponse = (payload: unknown, status = 200): Response =>
  new Response(JSON.stringify(payload), {
    status,
    headers: {
      'content-type': 'application/json',
    },
  });

describe('guestbookFeedApiClient', () => {
  afterEach(() => {
    vi.clearAllMocks();
    vi.unstubAllGlobals();
  });

  it('createGuestbookEntryClient는 API 성공 시 entry를 반환한다', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      createJsonResponse({
        ok: true,
        entry: createEntryFixture(),
      }),
    );
    vi.stubGlobal('fetch', fetchMock);

    const result = await createGuestbookEntryClient({
      authorName: 'tester',
      content: 'hello',
      isSecret: false,
      password: '1234',
    });

    expect(result.id).toBe('entry-1');
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/guestbook/entries',
      expect.objectContaining({
        method: 'POST',
      }),
    );
  });

  it('verifyGuestbookSecretClient는 실패 시 status를 포함한 Error를 던진다', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      createJsonResponse(
        {
          ok: false,
          reason: 'invalid password',
        },
        403,
      ),
    );
    vi.stubGlobal('fetch', fetchMock);

    await expect(verifyGuestbookSecretClient('entry-1', 'wrong')).rejects.toMatchObject({
      message: 'invalid password',
      status: 403,
    });
  });
});

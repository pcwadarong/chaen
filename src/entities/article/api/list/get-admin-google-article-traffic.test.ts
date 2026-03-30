/**
 * @vitest-environment node
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockQuery = vi.fn();
const mockSearchConsole = vi.fn();
const mockGoogleAuth = vi.fn();

vi.mock('googleapis', () => ({
  google: {
    auth: {
      GoogleAuth: mockGoogleAuth,
    },
    searchconsole: mockSearchConsole,
  },
}));

describe('getAdminGoogleArticleTraffic', () => {
  const originalClientEmail = process.env.GOOGLE_SEARCH_CONSOLE_CLIENT_EMAIL;
  const originalPrivateKey = process.env.GOOGLE_SEARCH_CONSOLE_PRIVATE_KEY;
  const originalSiteUrl = process.env.GOOGLE_SEARCH_CONSOLE_SITE_URL;

  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();

    if (originalClientEmail === undefined) {
      delete process.env.GOOGLE_SEARCH_CONSOLE_CLIENT_EMAIL;
    } else {
      process.env.GOOGLE_SEARCH_CONSOLE_CLIENT_EMAIL = originalClientEmail;
    }

    if (originalPrivateKey === undefined) {
      delete process.env.GOOGLE_SEARCH_CONSOLE_PRIVATE_KEY;
    } else {
      process.env.GOOGLE_SEARCH_CONSOLE_PRIVATE_KEY = originalPrivateKey;
    }

    if (originalSiteUrl === undefined) {
      delete process.env.GOOGLE_SEARCH_CONSOLE_SITE_URL;
    } else {
      process.env.GOOGLE_SEARCH_CONSOLE_SITE_URL = originalSiteUrl;
    }

    mockGoogleAuth.mockImplementation(() => ({
      getClient: vi.fn().mockResolvedValue({
        kind: 'auth-client',
      }),
    }));
    mockSearchConsole.mockReturnValue({
      searchanalytics: {
        query: mockQuery,
      },
    });
  });

  it('설정이 없으면 Google 아티클 유입 상태를 not_configured로 반환해야 한다', async () => {
    delete process.env.GOOGLE_SEARCH_CONSOLE_CLIENT_EMAIL;
    delete process.env.GOOGLE_SEARCH_CONSOLE_PRIVATE_KEY;
    delete process.env.GOOGLE_SEARCH_CONSOLE_SITE_URL;

    const { getAdminGoogleArticleTraffic } =
      await import('@/entities/article/api/list/get-admin-google-article-traffic');

    await expect(getAdminGoogleArticleTraffic()).resolves.toMatchObject({
      items: [],
      status: 'not_configured',
      totalClicks: 0,
    });
    expect(mockGoogleAuth).not.toHaveBeenCalled();
  });

  it('설정이 있으면 Search Console row를 관리자 아티클 유입 목록으로 변환해야 한다', async () => {
    process.env.GOOGLE_SEARCH_CONSOLE_CLIENT_EMAIL = 'bot@example.iam.gserviceaccount.com';
    process.env.GOOGLE_SEARCH_CONSOLE_PRIVATE_KEY = 'line-1\\nline-2';
    process.env.GOOGLE_SEARCH_CONSOLE_SITE_URL = 'sc-domain:chaen.dev';
    mockQuery.mockResolvedValue({
      data: {
        rows: [
          {
            clicks: 12,
            ctr: 0.4,
            impressions: 30,
            keys: ['https://chaen.dev/ko/articles/google-search-console'],
            position: 3.2,
          },
          {
            clicks: 7,
            ctr: 0.2,
            impressions: 35,
            keys: ['https://chaen.dev/en/articles/admin-redesign'],
            position: 4.8,
          },
        ],
      },
    });

    const { getAdminGoogleArticleTraffic } =
      await import('@/entities/article/api/list/get-admin-google-article-traffic');

    await expect(getAdminGoogleArticleTraffic({ limit: 5 })).resolves.toMatchObject({
      items: [
        {
          clicks: 12,
          ctr: 0.4,
          impressions: 30,
          path: '/ko/articles/google-search-console',
          position: 3.2,
          url: 'https://chaen.dev/ko/articles/google-search-console',
        },
        {
          clicks: 7,
          ctr: 0.2,
          impressions: 35,
          path: '/en/articles/admin-redesign',
          position: 4.8,
          url: 'https://chaen.dev/en/articles/admin-redesign',
        },
      ],
      status: 'configured',
      totalClicks: 19,
    });
    expect(mockGoogleAuth).toHaveBeenCalledWith({
      credentials: {
        client_email: 'bot@example.iam.gserviceaccount.com',
        private_key: 'line-1\nline-2',
      },
      scopes: ['https://www.googleapis.com/auth/webmasters.readonly'],
    });
    expect(mockQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        requestBody: expect.objectContaining({
          dimensions: ['page'],
          rowLimit: 5,
        }),
        siteUrl: 'sc-domain:chaen.dev',
      }),
    );
  });

  it('Search Console 조회가 실패하면 error 상태로 안전하게 반환해야 한다', async () => {
    process.env.GOOGLE_SEARCH_CONSOLE_CLIENT_EMAIL = 'bot@example.iam.gserviceaccount.com';
    process.env.GOOGLE_SEARCH_CONSOLE_PRIVATE_KEY = 'private-key';
    process.env.GOOGLE_SEARCH_CONSOLE_SITE_URL = 'sc-domain:chaen.dev';
    mockQuery.mockRejectedValue(new Error('quota exceeded'));

    const { getAdminGoogleArticleTraffic } =
      await import('@/entities/article/api/list/get-admin-google-article-traffic');

    await expect(getAdminGoogleArticleTraffic()).resolves.toMatchObject({
      items: [],
      message: 'quota exceeded',
      status: 'error',
      totalClicks: 0,
    });
  });

  it('로컬 기준 today가 주어졌을 때, getAdminGoogleArticleTraffic은 로컬 날짜 범위로 요청해야 한다', async () => {
    process.env.GOOGLE_SEARCH_CONSOLE_CLIENT_EMAIL = 'bot@example.iam.gserviceaccount.com';
    process.env.GOOGLE_SEARCH_CONSOLE_PRIVATE_KEY = 'private-key';
    process.env.GOOGLE_SEARCH_CONSOLE_SITE_URL = 'sc-domain:chaen.dev';
    mockQuery.mockResolvedValue({
      data: {
        rows: [],
      },
    });

    const { getAdminGoogleArticleTraffic } =
      await import('@/entities/article/api/list/get-admin-google-article-traffic');

    await getAdminGoogleArticleTraffic({ today: new Date('2026-03-31T00:30:00+09:00') });

    expect(mockQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        requestBody: expect.objectContaining({
          endDate: '2026-03-31',
          startDate: '2026-03-04',
        }),
      }),
    );
  });
});

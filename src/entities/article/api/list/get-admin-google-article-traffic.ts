import { google } from 'googleapis';
import { unstable_cache } from 'next/cache';

import type {
  AdminGoogleArticleTraffic,
  AdminGoogleArticleTrafficItem,
} from '@/entities/article/model/types';
import { formatYearMonthDay } from '@/shared/lib/date/format-year-month-day';
import {
  getGoogleSearchConsoleConfigOptional,
  type GoogleSearchConsoleConfig,
} from '@/shared/lib/google-search-console/config';

import 'server-only';

const GOOGLE_SEARCH_CONSOLE_READONLY_SCOPE = 'https://www.googleapis.com/auth/webmasters.readonly';

type SearchConsoleClient = ReturnType<typeof google.searchconsole>;

let cachedSearchConsoleClient: SearchConsoleClient | null = null;

/**
 * Search Console 클라이언트를 모듈 스코프에 1회만 생성해 재사용합니다.
 *
 * 매 요청마다 GoogleAuth를 새로 만들던 비용을 제거합니다.
 */
const getSearchConsoleClient = (config: GoogleSearchConsoleConfig): SearchConsoleClient => {
  cachedSearchConsoleClient ??= google.searchconsole({
    auth: new google.auth.GoogleAuth({
      credentials: {
        client_email: config.clientEmail,
        private_key: config.privateKey,
      },
      scopes: [GOOGLE_SEARCH_CONSOLE_READONLY_SCOPE],
    }),
    version: 'v1',
  });

  return cachedSearchConsoleClient;
};

/**
 * Search Console 아티클 유입 상위 행을 15분 TTL 캐시로 조회합니다.
 *
 * 날짜(`startDate`/`endDate`)를 인자로 받아 캐시 키가 일 단위로만 바뀌게 합니다.
 * 에러 상태 판별은 호출자에서 처리하므로, 실패 시 예외를 던져 캐시되지 않게 합니다.
 */
const fetchGoogleArticleTrafficRows = unstable_cache(
  async (startDate: string, endDate: string, limit: number) => {
    const config = getGoogleSearchConsoleConfigOptional();
    if (!config) return [];

    const searchConsole = getSearchConsoleClient(config);
    const response = await searchConsole.searchanalytics.query({
      requestBody: {
        dataState: 'final',
        dimensionFilterGroups: [
          {
            filters: [
              {
                dimension: 'page',
                expression: '/articles/',
                operator: 'contains',
              },
            ],
            groupType: 'and',
          },
        ],
        dimensions: ['page'],
        endDate,
        rowLimit: limit,
        searchType: 'web',
        startDate,
      },
      siteUrl: config.siteUrl,
    });

    return response.data.rows ?? [];
  },
  ['admin-google-article-traffic'],
  { revalidate: 900 },
);

/**
 * Search Console row의 절대 URL을 관리자 패널용 path로 정규화합니다.
 */
const resolveGoogleArticleTrafficPath = (url: string): string => {
  try {
    const parsedUrl = new URL(url);
    return `${parsedUrl.pathname}${parsedUrl.search}${parsedUrl.hash}` || url;
  } catch {
    return url;
  }
};

/**
 * Search Console raw row를 관리자 대시보드에서 쓰는 단순 타입으로 변환합니다.
 */
const mapGoogleArticleTrafficItem = (row: {
  clicks?: number | null;
  ctr?: number | null;
  impressions?: number | null;
  keys?: string[] | null;
  position?: number | null;
}): AdminGoogleArticleTrafficItem | null => {
  const pageUrl = row.keys?.[0]?.trim();
  if (!pageUrl) return null;

  return {
    clicks: row.clicks ?? 0,
    ctr: row.ctr ?? 0,
    impressions: row.impressions ?? 0,
    path: resolveGoogleArticleTrafficPath(pageUrl),
    position: row.position ?? 0,
    url: pageUrl,
  };
};

/**
 * 관리자 대시보드에 표시할 최근 28일 기준 아티클 검색 유입 상위 행을 조회합니다.
 */
export const getAdminGoogleArticleTraffic = async ({
  limit = 5,
  today = new Date(),
}: {
  limit?: number;
  today?: Date;
} = {}): Promise<AdminGoogleArticleTraffic> => {
  const config = getGoogleSearchConsoleConfigOptional();
  if (!config) {
    return {
      items: [],
      status: 'not_configured',
      totalClicks: 0,
    };
  }

  const endDate = formatYearMonthDay(today);
  const startDate = new Date(today);
  startDate.setDate(startDate.getDate() - 27);
  const formattedStartDate = formatYearMonthDay(startDate);

  if (!endDate || !formattedStartDate) {
    return {
      items: [],
      message: '유효한 날짜 범위를 만들지 못했습니다.',
      siteUrl: config.siteUrl,
      status: 'error',
      totalClicks: 0,
    };
  }

  try {
    const rows = await fetchGoogleArticleTrafficRows(formattedStartDate, endDate, limit);
    const items = rows
      .map(mapGoogleArticleTrafficItem)
      .filter((item): item is AdminGoogleArticleTrafficItem => item !== null);

    return {
      items,
      siteUrl: config.siteUrl,
      status: 'configured',
      totalClicks: items.reduce((sum, item) => sum + item.clicks, 0),
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'unknown error';

    return {
      items: [],
      message,
      siteUrl: config.siteUrl,
      status: 'error',
      totalClicks: 0,
    };
  }
};

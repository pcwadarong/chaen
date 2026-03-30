import { google } from 'googleapis';

import type {
  AdminGoogleArticleTraffic,
  AdminGoogleArticleTrafficItem,
} from '@/entities/article/model/types';
import { getGoogleSearchConsoleConfigOptional } from '@/shared/lib/google-search-console/config';

import 'server-only';

const GOOGLE_SEARCH_CONSOLE_READONLY_SCOPE = 'https://www.googleapis.com/auth/webmasters.readonly';

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

  const endDate = today.toISOString().slice(0, 10);
  const startDate = new Date(today);
  startDate.setDate(startDate.getDate() - 27);

  try {
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: config.clientEmail,
        private_key: config.privateKey,
      },
      scopes: [GOOGLE_SEARCH_CONSOLE_READONLY_SCOPE],
    });
    const searchConsole = google.searchconsole({
      auth,
      version: 'v1',
    });
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
        startDate: startDate.toISOString().slice(0, 10),
      },
      siteUrl: config.siteUrl,
    });
    const items = (response.data.rows ?? [])
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

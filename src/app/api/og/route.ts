import { NextResponse } from 'next/server';
import ogs from 'open-graph-scraper';

import {
  extractEmbedMetaFromHtml,
  type LinkEmbedData,
  resolveEmbedAssetUrl,
  shouldFallbackToPlainLink,
} from '@/shared/lib/markdown/link-embed';
import { normalizeHttpUrl } from '@/shared/lib/url/normalize-http-url';

const OG_CACHE_CONTROL = 'public, max-age=86400';
const DEFAULT_FETCH_HEADERS = {
  'accept-language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
  'user-agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
} as const;

/**
 * 외부 URL을 LinkEmbed 카드에 필요한 최소 응답 형태로 변환합니다.
 */
const createFallbackResponse = (url: string): LinkEmbedData => ({
  description: '',
  favicon: null,
  image: null,
  siteName: new URL(url).hostname,
  title: url,
  url,
});

/**
 * open-graph-scraper 결과를 LinkEmbed 카드 응답 형태로 정규화합니다.
 */
const mapOgResponse = (url: string, ogObject: Record<string, unknown>): LinkEmbedData => ({
  description:
    (typeof ogObject.ogDescription === 'string' ? ogObject.ogDescription.trim() : '') || '',
  favicon: resolveEmbedAssetUrl(
    url,
    typeof ogObject.favicon === 'string' ? ogObject.favicon : null,
  ),
  image: resolveEmbedAssetUrl(
    url,
    Array.isArray(ogObject.ogImage) &&
      typeof ogObject.ogImage[0] === 'object' &&
      ogObject.ogImage[0] &&
      'url' in ogObject.ogImage[0] &&
      typeof ogObject.ogImage[0].url === 'string'
      ? ogObject.ogImage[0].url
      : null,
  ),
  siteName:
    (typeof ogObject.ogSiteName === 'string' ? ogObject.ogSiteName.trim() : '') ||
    new URL(url).hostname,
  title: (typeof ogObject.ogTitle === 'string' ? ogObject.ogTitle.trim() : '') || url,
  url,
});

/**
 * OG 메타가 비어 있으면 HTML 자체에서 title/description/icon을 fallback으로 추출합니다.
 */
const fetchHtmlFallbackResponse = async (url: string) => {
  const response = await fetch(url, {
    headers: DEFAULT_FETCH_HEADERS,
  });
  const html = await response.text();

  return extractEmbedMetaFromHtml(url, html);
};

/**
 * 외부 페이지의 OG 메타를 파싱해 LinkEmbed 카드 데이터를 반환합니다.
 */
export const GET = async (request: Request) => {
  const normalizedUrl = normalizeHttpUrl(new URL(request.url).searchParams.get('url'));

  if (!normalizedUrl) {
    return NextResponse.json({ message: 'Invalid url' }, { status: 400 });
  }

  try {
    const response = (await ogs({
      fetchOptions: {
        headers: DEFAULT_FETCH_HEADERS,
      },
      timeout: 10,
      url: normalizedUrl,
    })) as { ogObject?: Record<string, unknown> };
    const ogObject = response.ogObject ?? {};
    const ogResponse = mapOgResponse(normalizedUrl, ogObject);
    const resolvedData = shouldFallbackToPlainLink(ogResponse)
      ? await fetchHtmlFallbackResponse(normalizedUrl)
      : ogResponse;

    return NextResponse.json(resolvedData, {
      headers: {
        'Cache-Control': OG_CACHE_CONTROL,
      },
    });
  } catch {
    try {
      return NextResponse.json(await fetchHtmlFallbackResponse(normalizedUrl), {
        headers: {
          'Cache-Control': OG_CACHE_CONTROL,
        },
      });
    } catch {
      return NextResponse.json(createFallbackResponse(normalizedUrl), {
        headers: {
          'Cache-Control': OG_CACHE_CONTROL,
        },
      });
    }
  }
};

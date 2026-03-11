import { Children, type ReactNode } from 'react';

import { normalizeHttpUrl } from '@/shared/lib/url/normalize-http-url';

export type MarkdownLinkRenderMode = 'card' | 'embed' | 'link' | 'noembed' | 'preview';

export type LinkEmbedData = {
  description: string;
  favicon: string | null;
  image: string | null;
  siteName: string;
  title: string;
  url: string;
};

/**
 * HTML 문자열에서 정규식으로 첫 번째 메타 값을 추출합니다.
 */
const matchHtmlValue = (html: string, pattern: RegExp) => pattern.exec(html)?.[1]?.trim() ?? '';

/**
 * markdown 링크 자식 텍스트가 embed 키워드인지 판별합니다.
 */
export const isEmbedKeyword = (children: ReactNode) => {
  const text = Children.toArray(children)
    .map(child => (typeof child === 'string' ? child : ''))
    .join('')
    .trim()
    .toLowerCase();

  return text === 'embed';
};

/**
 * markdown 링크 자식에서 표시 문자열을 추출합니다.
 */
export const getLinkText = (children: ReactNode) =>
  Children.toArray(children)
    .map(child => (typeof child === 'string' ? child : ''))
    .join('')
    .trim();

/**
 * markdown 링크의 title 속성으로부터 렌더링 방식을 해석합니다.
 */
export const getMarkdownLinkRenderMode = (
  title: string | null | undefined,
): MarkdownLinkRenderMode => {
  if (title === 'preview') return 'preview';
  if (title === 'card') return 'card';
  if (title === 'embed') return 'embed';
  if (title === 'noembed') return 'noembed';

  return 'link';
};

/**
 * OG 메타가 충분하지 않으면 일반 외부 링크 fallback이 필요한지 판별합니다.
 */
export const shouldFallbackToPlainLink = (data: LinkEmbedData) =>
  data.title === data.url &&
  data.description.length === 0 &&
  data.image === null &&
  data.favicon === null;

/**
 * 상대/절대 URL 문자열을 http/https 절대 URL로 정규화합니다.
 */
export const resolveEmbedAssetUrl = (baseUrl: string, rawUrl?: string | null) => {
  const trimmed = rawUrl?.trim();
  if (!trimmed) return null;

  try {
    const resolved = new URL(trimmed, baseUrl).toString();
    return normalizeHttpUrl(resolved);
  } catch {
    return null;
  }
};

/**
 * HTML 본문에서 embed 카드 fallback에 사용할 메타 정보를 추출합니다.
 */
export const extractEmbedMetaFromHtml = (url: string, html: string): LinkEmbedData => {
  const title =
    matchHtmlValue(html, /<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/iu) ||
    matchHtmlValue(html, /<meta[^>]+name=["']twitter:title["'][^>]+content=["']([^"']+)["']/iu) ||
    matchHtmlValue(html, /<title[^>]*>([^<]+)<\/title>/iu) ||
    url;
  const description =
    matchHtmlValue(
      html,
      /<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/iu,
    ) ||
    matchHtmlValue(html, /<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/iu) ||
    '';
  const siteName =
    matchHtmlValue(
      html,
      /<meta[^>]+property=["']og:site_name["'][^>]+content=["']([^"']+)["']/iu,
    ) || new URL(url).hostname;
  const image = resolveEmbedAssetUrl(
    url,
    matchHtmlValue(html, /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/iu) ||
      matchHtmlValue(html, /<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/iu),
  );
  const favicon = resolveEmbedAssetUrl(
    url,
    matchHtmlValue(
      html,
      /<link[^>]+rel=["'][^"']*(?:icon|shortcut icon)[^"']*["'][^>]+href=["']([^"']+)["']/iu,
    ),
  );

  return {
    description,
    favicon,
    image,
    siteName,
    title,
    url,
  };
};

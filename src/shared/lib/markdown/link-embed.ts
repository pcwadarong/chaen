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

type HtmlAttributeMap = Record<string, string>;

/**
 * HTML 태그 문자열에서 attribute를 key-value 맵으로 추출합니다.
 */
const extractHtmlAttributes = (tag: string): HtmlAttributeMap => {
  const attributes: HtmlAttributeMap = {};

  for (const match of tag.matchAll(/([^\s=/>]+)\s*=\s*["']([^"']*)["']/giu)) {
    const [, key, value] = match;
    if (!key) continue;

    attributes[key.toLowerCase()] = value.trim();
  }

  return attributes;
};

/**
 * HTML에서 meta 태그를 순회하며 조건에 맞는 content 값을 찾습니다.
 */
const findMetaContent = (html: string, matcher: (attributes: HtmlAttributeMap) => boolean) => {
  for (const match of html.matchAll(/<meta\b[^>]*>/giu)) {
    const tag = match[0];
    if (!tag) continue;

    const attributes = extractHtmlAttributes(tag);
    if (matcher(attributes) && attributes.content) {
      return attributes.content;
    }
  }

  return '';
};

/**
 * HTML에서 link 태그를 순회하며 조건에 맞는 href 값을 찾습니다.
 */
const findLinkHref = (html: string, matcher: (attributes: HtmlAttributeMap) => boolean) => {
  for (const match of html.matchAll(/<link\b[^>]*>/giu)) {
    const tag = match[0];
    if (!tag) continue;

    const attributes = extractHtmlAttributes(tag);
    if (matcher(attributes) && attributes.href) {
      return attributes.href;
    }
  }

  return '';
};

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
    findMetaContent(html, attributes => attributes.property === 'og:title') ||
    findMetaContent(html, attributes => attributes.name === 'twitter:title') ||
    html.match(/<title[^>]*>([^<]+)<\/title>/iu)?.[1]?.trim() ||
    url;
  const description =
    findMetaContent(html, attributes => attributes.property === 'og:description') ||
    findMetaContent(html, attributes => attributes.name === 'description') ||
    '';
  const siteName =
    findMetaContent(html, attributes => attributes.property === 'og:site_name') ||
    new URL(url).hostname;
  const image = resolveEmbedAssetUrl(
    url,
    findMetaContent(html, attributes => attributes.property === 'og:image') ||
      findMetaContent(html, attributes => attributes.name === 'twitter:image'),
  );
  const favicon = resolveEmbedAssetUrl(
    url,
    findLinkHref(
      html,
      attributes =>
        typeof attributes.rel === 'string' &&
        /(icon|shortcut icon)/iu.test(attributes.rel.toLowerCase()),
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

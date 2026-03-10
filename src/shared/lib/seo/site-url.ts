/**
 * 사이트 절대 URL에서 마지막 `/`를 제거해 일관된 기준 문자열로 정규화합니다.
 */
export const normalizeSiteUrl = (value: string): string => value.trim().replace(/\/+$/, '');

/**
 * 배포 도메인 기준 사이트 URL을 읽어옵니다.
 */
export const getSiteUrl = (): string => {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (!siteUrl) throw new Error('Missing environment variable: NEXT_PUBLIC_SITE_URL');

  return normalizeSiteUrl(siteUrl);
};

/**
 * 상대 경로를 사이트 절대 URL로 변환합니다.
 */
export const buildAbsoluteSiteUrl = (pathname: string): string => {
  const normalizedPathname = pathname.startsWith('/') ? pathname : `/${pathname}`;

  return new URL(normalizedPathname, `${getSiteUrl()}/`).toString();
};

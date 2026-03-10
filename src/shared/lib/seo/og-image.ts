import { buildAbsoluteSiteUrl } from '@/shared/lib/seo/site-url';

/**
 * 현재 OG 이미지 placeholder로 사용하는 기본 이미지 URL입니다.
 * 임시 파일로 추후 교체 예정
 */
export const OG_IMAGE_PLACEHOLDER_URL =
  'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=1200';

export type OgImageType = 'article' | 'project';

/**
 * OG 이미지 API 경로를 생성합니다.
 */
export const buildOgImagePath = ({ id, type }: { id: string; type: OgImageType }): string =>
  `/api/og/${type}/${encodeURIComponent(id)}`;

/**
 * OG 이미지 API 절대 URL을 생성합니다.
 */
export const buildOgImageUrl = ({ id, type }: { id: string; type: OgImageType }): string =>
  buildAbsoluteSiteUrl(
    buildOgImagePath({
      id,
      type,
    }),
  );

/**
 * 페이지 공통 placeholder OG 이미지 URL을 반환합니다.
 */
export const buildDefaultOgImageUrl = (): string => OG_IMAGE_PLACEHOLDER_URL;

/**
 * 주어진 문자열이 지원하는 OG 이미지 타입인지 확인합니다.
 */
export const isOgImageType = (value: string): value is OgImageType =>
  value === 'article' || value === 'project';

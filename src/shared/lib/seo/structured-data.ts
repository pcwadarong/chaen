import { buildAbsoluteSiteUrl } from '@/shared/lib/seo/site-url';
import { normalizeImageUrl } from '@/shared/lib/url/normalize-image-url';

type BreadcrumbItem = {
  name: string;
  path: string;
};

type ArticleStructuredDataInput = {
  createdAt: string;
  description: string;
  locale: string;
  path: string;
  tags: string[];
  thumbnailUrl: string | null;
  title: string;
  updatedAt?: string | null;
};

type ProjectStructuredDataInput = {
  createdAt: string;
  description: string;
  locale: string;
  path: string;
  tags: string[];
  thumbnailUrl: string | null;
  title: string;
};

/**
 * 구조화 데이터에서 사용할 이미지 URL을 절대 URL 기준으로 정규화합니다.
 */
const resolveStructuredDataImageUrl = (rawUrl: string | null): string | undefined => {
  if (!rawUrl) return undefined;

  if (rawUrl.startsWith('/')) {
    return buildAbsoluteSiteUrl(rawUrl);
  }

  return normalizeImageUrl(rawUrl) ?? undefined;
};

/**
 * breadcrumb schema.org JSON-LD를 생성합니다.
 */
export const buildBreadcrumbJsonLd = (items: BreadcrumbItem[]) => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: items.map((item, index) => ({
    '@type': 'ListItem',
    item: buildAbsoluteSiteUrl(item.path),
    name: item.name,
    position: index + 1,
  })),
});

/**
 * 아티클 상세용 BlogPosting JSON-LD를 생성합니다.
 */
export const buildArticleJsonLd = ({
  createdAt,
  description,
  locale,
  path,
  tags,
  thumbnailUrl,
  title,
  updatedAt,
}: ArticleStructuredDataInput) => ({
  '@context': 'https://schema.org',
  '@type': 'BlogPosting',
  dateModified: updatedAt ?? createdAt,
  datePublished: createdAt,
  description,
  headline: title,
  image: resolveStructuredDataImageUrl(thumbnailUrl),
  inLanguage: locale,
  keywords: tags.length > 0 ? tags.join(', ') : undefined,
  mainEntityOfPage: buildAbsoluteSiteUrl(path),
  url: buildAbsoluteSiteUrl(path),
});

/**
 * 프로젝트 상세용 CreativeWork JSON-LD를 생성합니다.
 */
export const buildProjectJsonLd = ({
  createdAt,
  description,
  locale,
  path,
  tags,
  thumbnailUrl,
  title,
}: ProjectStructuredDataInput) => ({
  '@context': 'https://schema.org',
  '@type': 'CreativeWork',
  dateCreated: createdAt,
  description,
  image: resolveStructuredDataImageUrl(thumbnailUrl),
  inLanguage: locale,
  keywords: tags.length > 0 ? tags.join(', ') : undefined,
  name: title,
  url: buildAbsoluteSiteUrl(path),
});

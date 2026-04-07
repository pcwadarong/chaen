import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import React from 'react';

import { getPublicArticleTagSlugs, getTagIdBySlug, getTagLabelMapBySlugs } from '@/entities/tag';
import { type AppLocale, locales } from '@/i18n/routing';
import { buildLocaleAlternates } from '@/shared/lib/seo/metadata';
import { buildDefaultOgImageUrl } from '@/shared/lib/seo/og-image';
import { buildAbsoluteSiteUrl } from '@/shared/lib/seo/site-url';
import {
  ArticleTagPage,
  buildArticleTagPageHref,
  getArticleTagPageData,
  isSupportedArticlesPageRequest,
  normalizeCursorHistoryParams,
  normalizeCursorParams,
  normalizePageParams,
  normalizeSearchParams,
  normalizeTagParams,
} from '@/views/articles';

type ArticleTagRouteSearchParams = {
  cursor?: string | string[];
  cursorHistory?: string | string[];
  page?: string | string[];
  q?: string | string[];
};

type ArticleTagRouteProps = {
  params: Promise<{
    locale: string;
    tag: string;
  }>;
  searchParams: Promise<ArticleTagRouteSearchParams>;
};

/**
 * 태그 slug가 실제로 존재하는지 확인하고, locale 표시 라벨을 함께 반환합니다.
 */
const resolveArticleTagContext = async ({
  locale,
  tag,
}: {
  locale: string;
  tag: string;
}): Promise<{ label: string; slug: string } | null> => {
  const normalizedTag = normalizeTagParams(tag);
  if (!normalizedTag) return null;

  const [tagIdResult, tagLabelMapResult] = await Promise.all([
    getTagIdBySlug(normalizedTag),
    getTagLabelMapBySlugs({
      locale,
      slugs: [normalizedTag],
    }),
  ]);

  if (tagIdResult.schemaMissing || tagIdResult.data === null) {
    return null;
  }

  return {
    label: tagLabelMapResult.data.get(normalizedTag) ?? normalizedTag,
    slug: normalizedTag,
  };
};

/**
 * 태그 상세는 실제 공개 아티클에 연결된 slug만 seed합니다.
 */
export const generateStaticParams = async () => {
  const publicArticleTags = await getPublicArticleTagSlugs();

  return publicArticleTags.data.map(tag => ({ tag }));
};

/**
 * 태그 전용 아티클 페이지 메타데이터를 생성합니다.
 */
export const generateMetadata = async ({
  params,
  searchParams,
}: ArticleTagRouteProps): Promise<Metadata> => {
  const { locale, tag } = await params;
  const { cursor, cursorHistory, page, q } = await searchParams;
  const normalizedPage = normalizePageParams(page);
  const normalizedCursor = normalizeCursorParams(cursor);
  const normalizedCursorHistory = normalizeCursorHistoryParams(cursorHistory);
  const normalizedQuery = normalizeSearchParams(q);
  const normalizedTag = normalizeTagParams(tag);

  if (!normalizedPage || !normalizedTag) notFound();
  if (!isSupportedArticlesPageRequest({ cursor, page: normalizedPage })) notFound();

  const [pageData, resolvedTag, t] = await Promise.all([
    getArticleTagPageData({
      cursor,
      cursorHistory,
      locale,
      page: normalizedPage,
      query: q,
      tag: normalizedTag,
    }),
    resolveArticleTagContext({
      locale,
      tag: normalizedTag,
    }),
    getTranslations({ locale, namespace: 'Articles' }),
  ]);
  const ogImageUrl = buildDefaultOgImageUrl();

  if (!resolvedTag) notFound();
  if (pageData.pagination.currentPage !== normalizedPage) {
    notFound();
  }

  const displayTag = resolvedTag.label;
  const title =
    normalizedPage > 1
      ? t('paginationTitle', {
          page: normalizedPage,
          title: `#${displayTag}`,
        })
      : `#${displayTag}`;
  const baseCanonicalPathname = buildArticleTagPageHref({
    locale,
    tag: normalizedTag,
  });
  const canonicalPathname = buildArticleTagPageHref({
    cursor: normalizedCursor,
    cursorHistory: normalizedCursorHistory,
    locale,
    page: normalizedPage,
    query: normalizedQuery,
    tag: normalizedTag,
  });
  const isSearchState = normalizedQuery.length > 0;
  const hasIndexableItems = pageData.initialItems.length > 0;
  const shouldIndex = normalizedPage === 1 && !isSearchState && hasIndexableItems;
  const metadataPathname = isSearchState ? baseCanonicalPathname : canonicalPathname;
  const alternates = shouldIndex
    ? buildLocaleAlternates({
        canonicalLocale: locale as AppLocale,
        pathnameByLocale: Object.fromEntries(
          locales.map(candidateLocale => [
            candidateLocale,
            buildArticleTagPageHref({
              locale: candidateLocale,
              tag: normalizedTag,
            }),
          ]),
        ) as Partial<Record<AppLocale, string>>,
      })
    : {
        canonical: buildAbsoluteSiteUrl(metadataPathname),
      };

  return {
    alternates,
    description: t('tagPageDescription', {
      tag: displayTag,
    }),
    openGraph: {
      description: t('tagPageDescription', {
        tag: displayTag,
      }),
      images: [ogImageUrl],
      title,
      type: 'website',
      url: buildAbsoluteSiteUrl(metadataPathname),
    },
    pagination: {
      next: pageData.pagination.nextHref
        ? buildAbsoluteSiteUrl(pageData.pagination.nextHref)
        : null,
      previous: pageData.pagination.previousHref
        ? buildAbsoluteSiteUrl(pageData.pagination.previousHref)
        : null,
    },
    robots: shouldIndex
      ? undefined
      : {
          follow: true,
          index: false,
        },
    title,
    twitter: {
      card: 'summary_large_image',
      description: t('tagPageDescription', {
        tag: displayTag,
      }),
      images: [ogImageUrl],
      title,
    },
  };
};

/**
 * 태그 전용 아티클 페이지 엔트리입니다.
 */
const ArticleTagRoute = async ({ params, searchParams }: ArticleTagRouteProps) => {
  const { locale, tag } = await params;
  const { cursor, cursorHistory, page, q } = await searchParams;
  const normalizedPage = normalizePageParams(page);
  const normalizedTag = normalizeTagParams(tag);

  if (!normalizedPage || !normalizedTag) notFound();
  if (!isSupportedArticlesPageRequest({ cursor, page: normalizedPage })) notFound();

  const [pageData, resolvedTag] = await Promise.all([
    getArticleTagPageData({
      cursor,
      cursorHistory,
      locale,
      page: normalizedPage,
      query: q,
      tag: normalizedTag,
    }),
    resolveArticleTagContext({
      locale,
      tag: normalizedTag,
    }),
  ]);

  if (!resolvedTag) notFound();
  if (pageData.pagination.currentPage !== normalizedPage) {
    notFound();
  }

  return <ArticleTagPage {...pageData} activeTagLabel={resolvedTag.label} locale={locale} />;
};

export default ArticleTagRoute;

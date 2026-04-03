import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import React from 'react';

import { type AppLocale, locales } from '@/i18n/routing';
import { buildLocaleAlternates } from '@/shared/lib/seo/metadata';
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

  const [pageData, t] = await Promise.all([
    getArticleTagPageData({
      cursor,
      cursorHistory,
      locale,
      page: normalizedPage,
      query: q,
      tag: normalizedTag,
    }),
    getTranslations({ locale, namespace: 'Articles' }),
  ]);

  if (pageData.pagination.currentPage !== normalizedPage) {
    notFound();
  }

  const title =
    normalizedPage > 1
      ? t('paginationTitle', {
          page: normalizedPage,
          title: `#${normalizedTag}`,
        })
      : `#${normalizedTag}`;
  const canonicalPathname = buildArticleTagPageHref({
    cursor: normalizedCursor,
    cursorHistory: normalizedCursorHistory,
    locale,
    page: normalizedPage,
    query: normalizedQuery,
    tag: normalizedTag,
  });
  const alternates =
    normalizedPage > 1
      ? {
          canonical: buildAbsoluteSiteUrl(canonicalPathname),
        }
      : buildLocaleAlternates({
          canonicalLocale: locale as AppLocale,
          pathnameByLocale: Object.fromEntries(
            locales.map(candidateLocale => [
              candidateLocale,
              buildArticleTagPageHref({
                locale: candidateLocale,
                page: normalizedPage,
                query: normalizedQuery,
                tag: normalizedTag,
              }),
            ]),
          ) as Partial<Record<AppLocale, string>>,
        });

  return {
    alternates,
    description: t('tagPageDescription', {
      tag: normalizedTag,
    }),
    pagination: {
      next: pageData.pagination.nextHref
        ? buildAbsoluteSiteUrl(pageData.pagination.nextHref)
        : null,
      previous: pageData.pagination.previousHref
        ? buildAbsoluteSiteUrl(pageData.pagination.previousHref)
        : null,
    },
    robots:
      normalizedPage > 1
        ? {
            follow: true,
            index: false,
          }
        : undefined,
    title,
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

  const pageData = await getArticleTagPageData({
    cursor,
    cursorHistory,
    locale,
    page: normalizedPage,
    query: q,
    tag: normalizedTag,
  });

  if (pageData.pagination.currentPage !== normalizedPage) {
    notFound();
  }

  return <ArticleTagPage {...pageData} locale={locale} />;
};

export default ArticleTagRoute;

import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import React from 'react';

import { type AppLocale, locales } from '@/i18n/routing';
import { buildLocaleAlternates } from '@/shared/lib/seo/metadata';
import { buildAbsoluteSiteUrl } from '@/shared/lib/seo/site-url';
import {
  ArticlesPage,
  buildArticlesPageHref,
  getArticlesPageData,
  isSupportedArticlesPageRequest,
  normalizeCursorHistoryParams,
  normalizeCursorParams,
  normalizePageParams,
  normalizeSearchParams,
  normalizeTagParams,
} from '@/views/articles';

type ArticlesRouteSearchParams = {
  cursor?: string | string[];
  cursorHistory?: string | string[];
  page?: string | string[];
  q?: string | string[];
  tag?: string | string[];
};

type ArticlesRouteProps = {
  params: Promise<{
    locale: string;
  }>;
  searchParams: Promise<ArticlesRouteSearchParams>;
};

/**
 * 아티클 목록 메타데이터를 생성합니다.
 */
export const generateMetadata = async ({
  params,
  searchParams,
}: ArticlesRouteProps): Promise<Metadata> => {
  const { locale } = await params;
  const { cursor, cursorHistory, page, q, tag } = await searchParams;
  const normalizedPage = normalizePageParams(page);
  const normalizedCursor = normalizeCursorParams(cursor);
  const normalizedCursorHistory = normalizeCursorHistoryParams(cursorHistory);
  const normalizedQuery = normalizeSearchParams(q);
  const normalizedTag = normalizedQuery ? '' : normalizeTagParams(tag);

  if (!normalizedPage) notFound();
  if (!isSupportedArticlesPageRequest({ cursor, page: normalizedPage })) notFound();

  const [pageData, t] = await Promise.all([
    getArticlesPageData({
      cursor,
      cursorHistory,
      locale,
      page: normalizedPage,
      query: q,
      tag,
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
          title: t('title'),
        })
      : t('title');
  const canonicalPathname = buildArticlesPageHref({
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
              buildArticlesPageHref({
                locale: candidateLocale,
                page: normalizedPage,
                query: normalizedQuery,
                tag: normalizedTag,
              }),
            ]),
          ) as Partial<Record<AppLocale, string>>,
        });

  return {
    title,
    description: t('description'),
    alternates,
    robots:
      normalizedPage > 1
        ? {
            follow: true,
            index: false,
          }
        : undefined,
    pagination: {
      next: pageData.pagination.nextHref
        ? buildAbsoluteSiteUrl(pageData.pagination.nextHref)
        : null,
      previous: pageData.pagination.previousHref
        ? buildAbsoluteSiteUrl(pageData.pagination.previousHref)
        : null,
    },
  };
};

/** 아티클 페이지 엔트리입니다. */
const ArticlesRoute = async ({ params, searchParams }: ArticlesRouteProps) => {
  const { locale } = await params;
  const { cursor, cursorHistory, page, q, tag } = await searchParams;
  const normalizedPage = normalizePageParams(page);

  if (!normalizedPage) notFound();
  if (!isSupportedArticlesPageRequest({ cursor, page: normalizedPage })) notFound();

  const pageData = await getArticlesPageData({
    cursor,
    cursorHistory,
    locale,
    page: normalizedPage,
    query: q,
    tag,
  });

  if (pageData.pagination.currentPage !== normalizedPage) {
    notFound();
  }

  return <ArticlesPage {...pageData} locale={locale} />;
};

export default ArticlesRoute;

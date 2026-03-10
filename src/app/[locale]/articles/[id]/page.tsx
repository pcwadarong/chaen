import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import React from 'react';

import { getResolvedArticle } from '@/entities/article/api/get-article';
import type { AppLocale } from '@/i18n/routing';
import { buildPathnameByLocale, resolveCanonicalLocale } from '@/shared/lib/seo/canonical';
import { buildLocaleAlternates, buildLocalizedPathname } from '@/shared/lib/seo/metadata';
import { buildOgImageUrl } from '@/shared/lib/seo/og-image';
import { buildAbsoluteSiteUrl } from '@/shared/lib/seo/site-url';
import { ArticleDetailPage, getArticleDetailPageData } from '@/views/articles';

export const revalidate = 3600;

type ArticleDetailRouteProps = {
  params: Promise<{
    id: string;
    locale: string;
  }>;
};

/**
 * 아티클 상세 메타데이터를 생성합니다.
 */
export const generateMetadata = async ({ params }: ArticleDetailRouteProps): Promise<Metadata> => {
  const { id, locale } = await params;
  const [resolvedArticle, t] = await Promise.all([
    getResolvedArticle(id, locale),
    getTranslations({ locale, namespace: 'ArticleDetail' }),
  ]);
  const { item, resolvedLocale } = resolvedArticle;

  if (!item) return {};

  const canonicalLocale = resolveCanonicalLocale({
    requestedLocale: locale as AppLocale,
    resolvedLocale,
  });
  const articlePath = buildLocalizedPathname({
    locale: canonicalLocale,
    pathname: `/articles/${id}`,
  });
  const ogImageUrl = buildOgImageUrl({
    id,
    type: 'article',
  });

  return {
    title: item.title,
    description: item.description ?? t('emptySummary'),
    alternates: buildLocaleAlternates({
      canonicalLocale,
      pathnameByLocale: buildPathnameByLocale(candidateLocale =>
        buildLocalizedPathname({
          locale: candidateLocale,
          pathname: `/articles/${id}`,
        }),
      ),
    }),
    openGraph: {
      description: item.description ?? t('emptySummary'),
      images: [ogImageUrl],
      title: item.title,
      type: 'article',
      url: buildAbsoluteSiteUrl(articlePath),
    },
    twitter: {
      card: 'summary_large_image',
      description: item.description ?? t('emptySummary'),
      images: [ogImageUrl],
      title: item.title,
    },
  };
};

/**
 * 아티클 상세 라우트 엔트리입니다.
 */
const ArticleDetailRoute = async ({ params }: ArticleDetailRouteProps) => {
  const { id, locale } = await params;
  const { archivePage, initialCommentsPage, item, relatedArticles } =
    await getArticleDetailPageData({
      articleId: id,
      locale,
    });
  if (!item) notFound();

  return (
    <ArticleDetailPage
      archivePage={archivePage}
      initialCommentsPage={initialCommentsPage}
      item={item}
      locale={locale as AppLocale}
      relatedArticles={relatedArticles}
    />
  );
};

export default ArticleDetailRoute;

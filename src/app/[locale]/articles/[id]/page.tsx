import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import React from 'react';

import { getResolvedArticle } from '@/entities/article/api/detail/get-article';
import { getArticleStaticParams } from '@/entities/article/api/detail/get-article-static-params';
import type { AppLocale } from '@/i18n/routing';
import { resolvePublicContentPathSegment } from '@/shared/lib/content/public-content';
import { buildPathnameByLocale, resolveCanonicalLocale } from '@/shared/lib/seo/canonical';
import { buildLocaleAlternates, buildLocalizedPathname } from '@/shared/lib/seo/metadata';
import { buildOgImageUrl } from '@/shared/lib/seo/og-image';
import { buildAbsoluteSiteUrl } from '@/shared/lib/seo/site-url';
import { ArticleDetailPage, getArticleDetailPageData } from '@/views/articles';

export const revalidate = 3600;

/**
 * 공개 아티클 상세 slug를 정적으로 생성합니다.
 */
export const generateStaticParams = async () => getArticleStaticParams();

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

  const articlePathSegment = resolvePublicContentPathSegment(item);
  const canonicalLocale = resolveCanonicalLocale({
    requestedLocale: locale as AppLocale,
    resolvedLocale,
  });
  const articlePath = buildLocalizedPathname({
    locale: canonicalLocale,
    pathname: `/articles/${articlePathSegment}`,
  });
  const ogImageUrl = buildOgImageUrl({
    id: articlePathSegment,
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
          pathname: `/articles/${articlePathSegment}`,
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
      articleSlug: id,
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

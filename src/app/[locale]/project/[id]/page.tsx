import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import React from 'react';

import type { AppLocale } from '@/i18n/routing';
import { resolvePublicContentPathSegment } from '@/shared/lib/content/public-content';
import { buildPathnameByLocale, resolveCanonicalLocale } from '@/shared/lib/seo/canonical';
import { buildLocaleAlternates, buildLocalizedPathname } from '@/shared/lib/seo/metadata';
import { buildOgImageUrl } from '@/shared/lib/seo/og-image';
import { buildAbsoluteSiteUrl } from '@/shared/lib/seo/site-url';
import {
  getProjectDetailArchivePageData,
  getProjectDetailShellData,
  getProjectTagLabels,
  ProjectDetailPage,
} from '@/views/project';

export const revalidate = 3600;

/**
 * 상세 slug는 첫 요청 시 정적으로 생성하고 이후 ISR로 재사용합니다.
 */
export const generateStaticParams = async () => [];

type ProjectDetailRouteProps = {
  params: Promise<{
    id: string;
    locale: string;
  }>;
};

/**
 * 프로젝트 상세 메타데이터를 생성합니다.
 */
export const generateMetadata = async ({ params }: ProjectDetailRouteProps): Promise<Metadata> => {
  const { id, locale } = await params;
  const [resolvedProject, t] = await Promise.all([
    getProjectDetailShellData({
      locale,
      projectSlug: id,
    }),
    getTranslations({ locale, namespace: 'ProjectDetail' }),
  ]);
  const { item, resolvedLocale } = resolvedProject;

  if (!item) return {};

  const projectPathSegment = resolvePublicContentPathSegment(item);
  const canonicalLocale = resolveCanonicalLocale({
    requestedLocale: locale as AppLocale,
    resolvedLocale,
  });
  const projectPath = buildLocalizedPathname({
    locale: canonicalLocale,
    pathname: `/project/${projectPathSegment}`,
  });
  const ogImageUrl = buildOgImageUrl({
    id: projectPathSegment,
    type: 'project',
  });

  return {
    title: item.title,
    description: item.description ?? t('emptySummary'),
    alternates: buildLocaleAlternates({
      canonicalLocale,
      pathnameByLocale: buildPathnameByLocale(candidateLocale =>
        buildLocalizedPathname({
          locale: candidateLocale,
          pathname: `/project/${projectPathSegment}`,
        }),
      ),
    }),
    openGraph: {
      description: item.description ?? t('emptySummary'),
      images: [ogImageUrl],
      title: item.title,
      type: 'website',
      url: buildAbsoluteSiteUrl(projectPath),
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
 * 프로젝트 상세 라우트 엔트리입니다.
 */
const ProjectDetailRoute = async ({ params }: ProjectDetailRouteProps) => {
  const { id, locale } = await params;
  const { item } = await getProjectDetailShellData({
    locale,
    projectSlug: id,
  });
  if (!item) notFound();

  const archivePagePromise = getProjectDetailArchivePageData({
    item,
    locale,
  });
  const tagLabelsPromise = getProjectTagLabels({
    item,
    locale,
  });

  return (
    <ProjectDetailPage
      archivePagePromise={archivePagePromise}
      item={item}
      locale={locale as AppLocale}
      tagLabelsPromise={tagLabelsPromise}
    />
  );
};

export default ProjectDetailRoute;

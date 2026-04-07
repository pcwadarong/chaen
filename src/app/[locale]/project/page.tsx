import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import React from 'react';

import type { AppLocale } from '@/i18n/routing';
import { buildLocalizedPathname, seoDefaultLocale } from '@/shared/lib/seo/metadata';
import { buildDefaultOgImageUrl } from '@/shared/lib/seo/og-image';
import { buildAbsoluteSiteUrl } from '@/shared/lib/seo/site-url';
import { getProjectListPageData, ProjectListPage } from '@/views/project';

type ProjectRouteProps = {
  params: Promise<{
    locale: string;
  }>;
};

/**
 * 프로젝트 목록 메타데이터를 생성합니다.
 */
export const generateMetadata = async ({ params }: ProjectRouteProps): Promise<Metadata> => {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'Project' });
  const isCanonicalLocale = locale === seoDefaultLocale;
  const projectPath = buildLocalizedPathname({
    locale: (isCanonicalLocale ? locale : seoDefaultLocale) as AppLocale,
    pathname: '/project',
  });
  const ogImageUrl = buildDefaultOgImageUrl();

  return {
    title: t('showcaseTitle'),
    description: t('showcaseDescription'),
    alternates: {
      canonical: buildAbsoluteSiteUrl(projectPath),
    },
    openGraph: {
      description: t('showcaseDescription'),
      images: [ogImageUrl],
      title: t('showcaseTitle'),
      type: 'website',
      url: buildAbsoluteSiteUrl(projectPath),
    },
    robots: isCanonicalLocale
      ? undefined
      : {
          follow: true,
          index: false,
        },
    twitter: {
      card: 'summary_large_image',
      description: t('showcaseDescription'),
      images: [ogImageUrl],
      title: t('showcaseTitle'),
    },
  };
};

/** 프로젝트 목록 페이지 엔트리입니다. */
const ProjectRoute = async ({ params }: ProjectRouteProps) => {
  const { locale } = await params;
  const pageData = await getProjectListPageData({ locale });

  return <ProjectListPage {...pageData} />;
};

export default ProjectRoute;

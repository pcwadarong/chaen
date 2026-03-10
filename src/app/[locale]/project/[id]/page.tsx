import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import React from 'react';

import { getResolvedProject } from '@/entities/project/api/get-project';
import type { AppLocale } from '@/i18n/routing';
import { buildPathnameByLocale, resolveCanonicalLocale } from '@/shared/lib/seo/canonical';
import { buildLocaleAlternates, buildLocalizedPathname } from '@/shared/lib/seo/metadata';
import { getProjectDetailPageData, ProjectDetailPage } from '@/views/project';

export const revalidate = 3600;

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
    getResolvedProject(id, locale),
    getTranslations({ locale, namespace: 'ProjectDetail' }),
  ]);
  const { item, resolvedLocale } = resolvedProject;

  if (!item) return {};

  const canonicalLocale = resolveCanonicalLocale({
    requestedLocale: locale as AppLocale,
    resolvedLocale,
  });

  return {
    title: item.title,
    description: item.description ?? t('emptySummary'),
    alternates: buildLocaleAlternates({
      canonicalLocale,
      pathnameByLocale: buildPathnameByLocale(candidateLocale =>
        buildLocalizedPathname({
          locale: candidateLocale,
          pathname: `/project/${id}`,
        }),
      ),
    }),
  };
};

/**
 * 프로젝트 상세 라우트 엔트리입니다.
 */
const ProjectDetailRoute = async ({ params }: ProjectDetailRouteProps) => {
  const { id, locale } = await params;
  const { archivePage, item } = await getProjectDetailPageData({
    locale,
    projectId: id,
  });
  if (!item) notFound();

  return <ProjectDetailPage archivePage={archivePage} item={item} locale={locale as AppLocale} />;
};

export default ProjectDetailRoute;

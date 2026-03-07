import { notFound } from 'next/navigation';
import React from 'react';

import { getProjectDetailPageData, ProjectDetailPage } from '@/views/project';

type ProjectDetailRouteProps = {
  params: Promise<{
    id: string;
    locale: string;
  }>;
};

/**
 * 프로젝트 상세 라우트 엔트리입니다.
 */
const ProjectDetailRoute = async ({ params }: ProjectDetailRouteProps) => {
  const { id, locale } = await params;
  const { archiveItems, item } = await getProjectDetailPageData({
    locale,
    projectId: id,
  });
  if (!item) notFound();

  return <ProjectDetailPage archiveItems={archiveItems} item={item} locale={locale} />;
};

export default ProjectDetailRoute;

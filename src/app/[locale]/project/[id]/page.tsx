import { notFound } from 'next/navigation';
import React from 'react';

import { getProject } from '@/entities/project/api/get-project';
import { ProjectDetailPage } from '@/views/project';

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
  const item = await getProject(id, locale);
  if (!item) notFound();

  return <ProjectDetailPage item={item} locale={locale} />;
};

export default ProjectDetailRoute;

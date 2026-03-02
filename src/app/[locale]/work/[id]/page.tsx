import { notFound } from 'next/navigation';
import React from 'react';

import { getProject } from '@/entities/project/api/get-project';
import { WorkDetailPage } from '@/views/work-detail';

type WorkDetailRouteProps = {
  params: Promise<{
    id: string;
    locale: string;
  }>;
};

/**
 * 프로젝트 상세 라우트 엔트리입니다.
 */
const WorkDetailRoute = async ({ params }: WorkDetailRouteProps) => {
  const { id, locale } = await params;
  const item = await getProject(id, locale);
  if (!item) notFound();

  return <WorkDetailPage item={item} locale={locale} />;
};

export default WorkDetailRoute;

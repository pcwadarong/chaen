import React from 'react';

import { getProjectListPageData, ProjectListPage } from '@/views/project';

export const dynamic = 'force-dynamic';

/** 프로젝트 목록 페이지 엔트리입니다. */
const ProjectRoute = async ({
  params,
}: {
  params: Promise<{
    locale: string;
  }>;
}) => {
  const { locale } = await params;
  const pageData = await getProjectListPageData({ locale });

  return <ProjectListPage {...pageData} />;
};

export default ProjectRoute;

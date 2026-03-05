import React from 'react';

import { getWorkListPageData, WorkListPage } from '@/views/work';

export const dynamic = 'force-dynamic';

/** 프로젝트 목록 페이지 엔트리입니다. */
const WorkRoute = async ({
  params,
}: {
  params: Promise<{
    locale: string;
  }>;
}) => {
  const { locale } = await params;
  const pageData = await getWorkListPageData({ locale });

  return <WorkListPage {...pageData} />;
};

export default WorkRoute;

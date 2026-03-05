import React from 'react';

import { getResumePageData, ResumePage } from '@/views/resume';

export const dynamic = 'force-dynamic';

/** 이력서 페이지 엔트리입니다. */
const ResumeRoute = async ({
  params,
}: {
  params: Promise<{
    locale: string;
  }>;
}) => {
  const { locale } = await params;
  const pageData = await getResumePageData({ locale });

  return <ResumePage {...pageData} />;
};

export default ResumeRoute;

import React from 'react';

import { getResumeContent } from '@/entities/resume/api/get-resume-content';
import { getResumeUrl } from '@/entities/resume/api/get-resume-url';
import { ResumePage } from '@/views/resume';

/** 이력서 페이지 엔트리입니다. */
const ResumeRoute = async ({
  params,
}: {
  params: Promise<{
    locale: string;
  }>;
}) => {
  const { locale } = await params;
  const resumeFilePath = process.env.NEXT_PUBLIC_RESUME_FILE_PATH ?? 'ParkChaewon-Resume.pdf';
  const resumeDownloadFileName =
    process.env.NEXT_PUBLIC_RESUME_DOWNLOAD_FILE_NAME ?? 'ParkChaewon-Resume.pdf';
  const resumeUrl = await getResumeUrl({
    accessType: 'signed',
    downloadFileName: resumeDownloadFileName,
    filePath: resumeFilePath,
  }).catch(() => null);
  const resumeContent = await getResumeContent(locale);

  return (
    <ResumePage
      content={resumeContent}
      downloadFileName={resumeDownloadFileName}
      resumeUrl={resumeUrl}
    />
  );
};

export default ResumeRoute;

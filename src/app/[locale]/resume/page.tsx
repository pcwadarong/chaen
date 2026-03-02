import React from 'react';

import { getPdfFileContent } from '@/entities/pdf-file/api/get-pdf-file-content';
import { getPdfFileUrl } from '@/entities/pdf-file/api/get-pdf-file-url';
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
  const resumeFilePath =
    process.env.NEXT_PUBLIC_RESUME_FILE_PATH ??
    process.env.NEXT_PUBLIC_PDF_FILE_PATH ??
    'ParkChaewon-Resume.pdf';
  const resumeDownloadFileName =
    process.env.NEXT_PUBLIC_RESUME_DOWNLOAD_FILE_NAME ?? 'ParkChaewon-Resume.pdf';
  const resumeUrl = await getPdfFileUrl({
    accessType: 'signed',
    downloadFileName: resumeDownloadFileName,
    filePath: resumeFilePath,
  }).catch(() => null);
  const resumeContent = await getPdfFileContent(locale);

  return (
    <ResumePage
      content={resumeContent}
      downloadFileName={resumeDownloadFileName}
      resumeUrl={resumeUrl}
    />
  );
};

export default ResumeRoute;

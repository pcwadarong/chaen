import React from 'react';

import { getPdfFileContent } from '@/entities/pdf-file/api/get-pdf-file-content';
import { getPdfFileUrl } from '@/entities/pdf-file/api/get-pdf-file-url';
import {
  createDefaultPdfFileContent,
  getPdfFileStorageConfig,
} from '@/entities/pdf-file/model/config';
import { ResumePage } from '@/views/resume';

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
  const resumeConfig = getPdfFileStorageConfig('resume');
  const resumeUrl = await getPdfFileUrl({
    accessType: 'signed',
    kind: 'resume',
    bucket: resumeConfig.bucket,
    filePath: resumeConfig.filePath,
    downloadFileName: resumeConfig.downloadFileName,
  }).catch(() => null);
  const resumeContent =
    (await getPdfFileContent({
      locale,
      kind: 'resume',
    })) ?? createDefaultPdfFileContent(locale);

  return (
    <ResumePage
      content={resumeContent}
      downloadFileName={resumeConfig.downloadFileName}
      resumeUrl={resumeUrl}
    />
  );
};

export default ResumeRoute;

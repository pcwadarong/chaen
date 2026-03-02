import React from 'react';

import { getPdfFileContent } from '@/entities/pdf-file/api/get-pdf-file-content';
import { getPdfFileUrl } from '@/entities/pdf-file/api/get-pdf-file-url';
import { getProjects } from '@/entities/project/api/get-projects';
import { WorkListPage } from '@/views/work-list';

/** 프로젝트 목록 페이지 엔트리입니다. */
const WorkRoute = async ({
  params,
}: {
  params: Promise<{
    locale: string;
  }>;
}) => {
  const { locale } = await params;
  const items = await getProjects();
  const portfolioFilePath =
    process.env.NEXT_PUBLIC_PORTFOLIO_FILE_PATH ?? 'ParkChaewon-Portfolio.pdf';
  const portfolioDownloadFileName =
    process.env.NEXT_PUBLIC_PORTFOLIO_DOWNLOAD_FILE_NAME ?? 'ParkChaewon-Portfolio.pdf';
  const portfolioUrl = await getPdfFileUrl({
    accessType: 'signed',
    downloadFileName: portfolioDownloadFileName,
    filePath: portfolioFilePath,
  }).catch(() => null);
  const pdfFileContent = await getPdfFileContent(locale);

  return (
    <WorkListPage
      items={items}
      portfolioButtonLabel={pdfFileContent.download_button_label}
      portfolioButtonUnavailableLabel={pdfFileContent.download_unavailable_label}
      portfolioDownloadFileName={portfolioDownloadFileName}
      portfolioUrl={portfolioUrl}
    />
  );
};

export default WorkRoute;

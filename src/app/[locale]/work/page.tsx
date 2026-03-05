import { getTranslations } from 'next-intl/server';
import React from 'react';

import { getPdfFileContent } from '@/entities/pdf-file/api/get-pdf-file-content';
import { getPdfFileUrl } from '@/entities/pdf-file/api/get-pdf-file-url';
import { getPdfFileStorageConfig } from '@/entities/pdf-file/model/config';
import { getProjects } from '@/entities/project/api/get-projects';
import { WorkListPage } from '@/views/work-list';

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
  const t = await getTranslations({ locale, namespace: 'Work' });
  const projectsPage = await getProjects({
    locale,
  });
  const portfolioConfig = getPdfFileStorageConfig('portfolio');
  const portfolioUrl = await getPdfFileUrl({
    accessType: 'signed',
    kind: 'portfolio',
    bucket: portfolioConfig.bucket,
    filePath: portfolioConfig.filePath,
    downloadFileName: portfolioConfig.downloadFileName,
  }).catch(() => null);
  const sharedPdfContent = await getPdfFileContent({ locale });

  return (
    <WorkListPage
      initialCursor={projectsPage.nextCursor}
      initialItems={projectsPage.items}
      locale={locale}
      portfolioButtonLabel={t('portfolioDownload')}
      portfolioButtonUnavailableLabel={
        sharedPdfContent?.download_unavailable_label ?? t('portfolioDownloadUnavailable')
      }
      portfolioDownloadFileName={portfolioConfig.downloadFileName}
      portfolioUrl={portfolioUrl}
    />
  );
};

export default WorkRoute;

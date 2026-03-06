import { getTranslations } from 'next-intl/server';

import { getPdfFileContent } from '@/entities/pdf-file/api/get-pdf-file-content';
import { getPdfFileUrl } from '@/entities/pdf-file/api/get-pdf-file-url';
import { getPdfFileStorageConfig } from '@/entities/pdf-file/model/config';
import { getProjects } from '@/entities/project/api/get-projects';

import type { ProjectListPageProps } from '../ui/project-list-page';

type GetProjectListPageDataInput = {
  locale: string;
};

/**
 * 프로젝트 목록 화면에 필요한 서버 데이터를 한 번에 조합합니다.
 * 목록/포트폴리오 URL/번역 문구를 route 밖에서 준비해 app 레이어를 얇게 유지합니다.
 */
export const getProjectListPageData = async ({
  locale,
}: GetProjectListPageDataInput): Promise<ProjectListPageProps> => {
  const t = await getTranslations({ locale, namespace: 'Project' });
  const projectsPage = await getProjects({ locale }).catch(() => ({
    items: [],
    nextCursor: null,
  }));
  const portfolioConfig = getPdfFileStorageConfig('portfolio');
  const portfolioUrl = await getPdfFileUrl({
    accessType: 'signed',
    kind: 'portfolio',
    bucket: portfolioConfig.bucket,
    filePath: portfolioConfig.filePath,
    downloadFileName: portfolioConfig.downloadFileName,
  }).catch(() => null);
  const sharedPdfContent = await getPdfFileContent({ locale });

  return {
    initialCursor: projectsPage.nextCursor,
    initialItems: projectsPage.items,
    locale,
    portfolioButtonLabel: t('portfolioDownload'),
    portfolioButtonUnavailableLabel:
      sharedPdfContent?.download_unavailable_label ?? t('portfolioDownloadUnavailable'),
    portfolioDownloadFileName: portfolioConfig.downloadFileName,
    portfolioUrl,
  };
};

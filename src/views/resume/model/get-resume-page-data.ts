import { getPdfFileAvailability } from '@/entities/pdf-file/api/get-pdf-file-availability';
import { getPdfFileContent } from '@/entities/pdf-file/api/get-pdf-file-content';
import {
  createDefaultPdfFileContent,
  getPdfFileStorageConfig,
} from '@/entities/pdf-file/model/config';
import { buildPdfFileDownloadPath } from '@/entities/pdf-file/model/download-path';
import type { ResumePageProps } from '@/views/resume/ui/resume-page';

type GetResumePageDataInput = {
  locale: string;
};

/**
 * 이력서 화면에서 사용하는 다운로드 URL/본문 데이터를 조회합니다.
 * 본문 데이터가 없으면 locale 기준 기본 문구를 fallback으로 사용합니다.
 */
export const getResumePageData = async ({
  locale,
}: GetResumePageDataInput): Promise<ResumePageProps> => {
  const resumeConfig = getPdfFileStorageConfig('resume');
  const isResumeReady = await getPdfFileAvailability({
    kind: 'resume',
  }).catch(() => false);
  const content =
    (await getPdfFileContent({
      locale,
      kind: 'resume',
    })) ?? createDefaultPdfFileContent(locale);

  return {
    content,
    downloadFileName: resumeConfig.downloadFileName,
    resumeDownloadHref: isResumeReady ? buildPdfFileDownloadPath('resume') : null,
  };
};

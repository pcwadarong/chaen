import { getPdfFileContent } from '@/entities/pdf-file/api/get-pdf-file-content';
import { getPdfFileDownloadOptions } from '@/entities/pdf-file/api/get-pdf-file-download-options';
import { createDefaultPdfFileContent } from '@/entities/pdf-file/model/config';
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
  const safeDownloadOptions = getPdfFileDownloadOptions('resume').catch(() => []);
  const safeContent = getPdfFileContent({
    locale,
    kind: 'resume',
  }).catch(() => null);

  const [downloadOptions, content] = await Promise.all([safeDownloadOptions, safeContent]);

  return {
    content: content ?? createDefaultPdfFileContent(locale),
    downloadOptions,
  };
};

import { getTranslations } from 'next-intl/server';

import { getPdfFileContent } from '@/entities/pdf-file/api/get-pdf-file-content';
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
  const safeContent = getPdfFileContent({
    locale,
    kind: 'resume',
  }).catch(() => null);
  const [content, t] = await Promise.all([
    safeContent,
    getTranslations({ locale, namespace: 'Resume' }),
  ]);

  return {
    content: content ?? createDefaultPdfFileContent(locale),
    downloadLabel: t('downloadButtonLabel'),
    unavailableLabel: t('resumeDownloadUnavailable'),
  };
};

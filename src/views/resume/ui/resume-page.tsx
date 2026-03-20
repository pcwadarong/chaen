import { css } from 'styled-system/css';

import type { PdfFileContent } from '@/entities/pdf-file/model/types';
import { DeferredPdfDownloadPopover } from '@/shared/ui/pdf-download-popover/deferred-pdf-download-popover';
import { PageHeader, PageSection, PageShell } from '@/widgets/page-shell/ui/page-shell';

export type ResumePageProps = {
  content: PdfFileContent;
};

/**
 * 이력서 소개 페이지 컨테이너입니다.
 */
export const ResumePage = ({ content }: ResumePageProps) => (
  <PageShell width="compact">
    <PageHeader
      action={
        <DeferredPdfDownloadPopover
          kind="resume"
          label={content.download_button_label}
          source="resume-page"
          unavailableLabel={content.download_unavailable_label}
        />
      }
      description={content.description}
      title={content.title}
    />
    <PageSection>
      <p className={bodyClass}>{content.body}</p>
    </PageSection>
  </PageShell>
);

const bodyClass = css({
  whiteSpace: 'pre-wrap',
  lineHeight: 'relaxed',
});

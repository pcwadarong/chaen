import React from 'react';

import type { PdfFileContent, PdfFileDownloadOption } from '@/entities/pdf-file/model/types';
import { MarkdownRenderer } from '@/shared/ui/markdown/markdown-renderer';
import { PdfDownloadPopover } from '@/shared/ui/pdf-download-popover/pdf-download-popover';
import { PageHeader, PageSection, PageShell } from '@/widgets/page-shell/ui/page-shell';

export type ResumePageProps = {
  content: PdfFileContent;
  downloadOptions: PdfFileDownloadOption[];
};

/**
 * 이력서 소개 페이지 컨테이너입니다.
 */
export const ResumePage = ({ content, downloadOptions }: ResumePageProps) => (
  <PageShell width="compact">
    <PageHeader
      action={
        <PdfDownloadPopover
          label={content.download_button_label}
          options={downloadOptions}
          unavailableLabel={content.download_unavailable_label}
        />
      }
      description={content.description}
      title={content.title}
    />
    <PageSection>
      <MarkdownRenderer locale={content.locale} markdown={content.body} />
    </PageSection>
  </PageShell>
);

import React from 'react';
import { css } from 'styled-system/css';

import type { ResolveAttachmentHref } from '@/entities/editor-core';
import { DownloadFileButton } from '@/shared/ui/download-file-button/download-file-button';
import { FileIcon } from '@/shared/ui/icons/app-icons';

type MarkdownAttachmentProps = {
  contentType?: string;
  fileName: string;
  fileSize?: number;
  href: string;
  resolveAttachmentHref?: ResolveAttachmentHref;
};

/**
 * 바이트 크기를 사람이 읽기 쉬운 첨부 파일 크기 문자열로 변환합니다.
 */
const formatAttachmentSize = (fileSize?: number) => {
  if (!fileSize || Number.isNaN(fileSize) || fileSize <= 0) return null;
  if (fileSize < 1024) return `${fileSize} B`;

  const kiloBytes = Math.round((fileSize / 1024) * 10) / 10;

  if (kiloBytes < 1024) {
    return Number.isInteger(kiloBytes) ? `${kiloBytes} KB` : `${kiloBytes.toFixed(1)} KB`;
  }

  const megaBytes = Math.round((kiloBytes / 1024) * 10) / 10;

  return Number.isInteger(megaBytes) ? `${megaBytes} MB` : `${megaBytes.toFixed(1)} MB`;
};

/**
 * markdown 커스텀 attachment 구문을 파일 다운로드 카드 UI로 렌더링합니다.
 */
export const MarkdownAttachment = ({
  contentType,
  fileName,
  fileSize,
  href,
  resolveAttachmentHref,
}: MarkdownAttachmentProps) => {
  const attachmentSize = formatAttachmentSize(fileSize);
  const downloadHref = resolveAttachmentHref?.({ fileName, href }) ?? href;

  return (
    <section className={attachmentCardClass} data-markdown-attachment="true">
      <span className={iconWrapClass}>
        <FileIcon aria-hidden color="text" size="md" />
      </span>
      <span className={contentWrapClass}>
        <strong className={fileNameClass}>{fileName}</strong>
        <span className={metaTextClass}>
          {[contentType, attachmentSize].filter(Boolean).join(' · ')}
        </span>
      </span>
      <div className={actionWrapClass}>
        <DownloadFileButton
          fileName={fileName}
          href={downloadHref}
          label="다운로드"
          mode="download"
        />
      </div>
    </section>
  );
};

const attachmentCardClass = css({
  display: 'flex',
  alignItems: 'center',
  gap: '3',
  width: 'full',
  px: '4',
  py: '3',
  borderRadius: 'xl',
  borderWidth: '1px',
  borderStyle: 'solid',
  borderColor: 'border',
  background: 'surfaceMuted',
  color: 'text',
  _tabletDown: {
    alignItems: 'stretch',
    flexWrap: 'wrap',
  },
});

const iconWrapClass = css({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  flex: 'none',
  width: '10',
  height: '10',
  borderRadius: 'full',
  background: 'surface',
  borderWidth: '1px',
  borderStyle: 'solid',
  borderColor: 'border',
});

const contentWrapClass = css({
  display: 'grid',
  minWidth: '0',
  flexGrow: '1',
});

const fileNameClass = css({
  fontSize: 'sm',
  lineHeight: 'snug',
  wordBreak: 'break-all',
});

const metaTextClass = css({
  fontSize: 'xs',
  color: 'muted',
});

const actionWrapClass = css({
  flex: 'none',
  marginLeft: 'auto',
  _tabletDown: {
    width: 'full',
  },
});

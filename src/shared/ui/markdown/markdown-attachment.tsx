import React from 'react';
import { css } from 'styled-system/css';

import { FileIcon } from '@/shared/ui/icons/app-icons';

type MarkdownAttachmentProps = {
  contentType?: string;
  fileName: string;
  fileSize?: number;
  href: string;
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
}: MarkdownAttachmentProps) => {
  const attachmentSize = formatAttachmentSize(fileSize);

  return (
    <a
      className={attachmentLinkClass}
      data-markdown-attachment="true"
      download={fileName}
      href={href}
      rel="noreferrer noopener"
      target="_blank"
    >
      <span className={iconWrapClass}>
        <FileIcon aria-hidden color="text" size="md" />
      </span>
      <span className={contentWrapClass}>
        <strong className={fileNameClass}>{fileName}</strong>
        <span className={metaTextClass}>
          {[contentType, attachmentSize].filter(Boolean).join(' · ')}
        </span>
      </span>
    </a>
  );
};

const attachmentLinkClass = css({
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
  textDecoration: 'none',
  color: 'text',
  transition: 'common',
  _hover: {
    borderColor: 'borderStrong',
    transform: 'translateY(-1px)',
  },
  _focusVisible: {
    outline: '[2px solid var(--colors-focus-ring)]',
    outlineOffset: '[2px]',
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

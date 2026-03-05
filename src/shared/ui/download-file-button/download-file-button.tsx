'use client';

import { css } from '@emotion/react';

type DownloadFileButtonMode = 'download' | 'open';

type DownloadFileButtonProps = {
  href: string | null;
  label: string;
  mode?: DownloadFileButtonMode;
  fileName?: string;
};

/**
 * URL을 새 탭으로 엽니다.
 */
const openInNewTab = (url: string) => {
  window.open(url, '_blank', 'noopener,noreferrer');
};

/**
 * 브라우저 다운로드를 트리거합니다.
 */
const triggerDownload = (url: string, fileName?: string) => {
  const anchor = document.createElement('a');

  anchor.href = url;
  anchor.target = '_blank';
  anchor.rel = 'noopener noreferrer';

  if (fileName) anchor.download = fileName;

  document.body.append(anchor);
  anchor.click();
  anchor.remove();
};

/**
 * 파일 다운로드/열기 공용 버튼입니다.
 */
export const DownloadFileButton = ({
  href,
  label,
  mode = 'open',
  fileName,
}: DownloadFileButtonProps) => {
  const isDisabled = !href;

  return (
    <button
      aria-disabled={isDisabled}
      disabled={isDisabled}
      onClick={() => {
        if (!href) return;

        if (mode === 'download') {
          triggerDownload(href, fileName);
          return;
        }

        openInNewTab(href);
      }}
      css={buttonStyle}
      type="button"
    >
      {label}
    </button>
  );
};

const buttonStyle = css`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 2.875rem;
  padding: var(--space-0) var(--space-5);
  border-radius: var(--radius-pill);
  border: 1px solid rgb(var(--color-border) / 0.3);
  background:
    linear-gradient(180deg, rgb(var(--color-surface)), rgb(var(--color-surface-muted))),
    rgb(var(--color-surface));
  color: rgb(var(--color-text));
  font-weight: var(--font-weight-semibold);
  letter-spacing: -0.01em;
`;

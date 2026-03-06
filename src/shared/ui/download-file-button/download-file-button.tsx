'use client';

import { css } from '@emotion/react';
import React from 'react';

type DownloadFileButtonMode = 'download' | 'open';

type DownloadFileButtonProps = {
  href: string | null;
  label: string;
  mode?: DownloadFileButtonMode;
  fileName?: string;
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

  if (href) {
    return (
      <a
        download={mode === 'download' ? fileName : undefined}
        href={href}
        rel="noopener noreferrer"
        target="_blank"
        css={buttonStyle}
      >
        {label}
      </a>
    );
  }

  return (
    <button aria-disabled={isDisabled} disabled={isDisabled} css={buttonStyle} type="button">
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

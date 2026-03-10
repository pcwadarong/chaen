import React from 'react';
import { css, cx } from 'styled-system/css';

import { Button, buttonRecipe } from '@/shared/ui/button/button';

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
        className={cx(
          buttonRecipe({
            tone: 'white',
            variant: 'solid',
          }).root,
          downloadButtonClass,
        )}
        download={mode === 'download' ? fileName : undefined}
        href={href}
        rel="noopener noreferrer"
        target="_blank"
      >
        {label}
      </a>
    );
  }

  return (
    <Button
      aria-disabled={isDisabled}
      className={downloadButtonClass}
      disabled={isDisabled}
      tone="white"
      type="button"
      variant="solid"
    >
      {label}
    </Button>
  );
};

const downloadButtonClass = css({
  transition: '[transform 180ms ease]',
  _hover: {
    transform: 'translateY(-2px)',
    background: 'surface',
    borderColor: 'borderStrong',
  },
  _active: {
    transform: 'translateY(1px)',
  },
});

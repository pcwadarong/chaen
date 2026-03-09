'use client';

import React from 'react';

import { Button } from '@/shared/ui/button/button';
import { buttonRecipe } from '@/shared/ui/button/button.recipe';

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
        className={buttonRecipe({
          tone: 'white',
          variant: 'solid',
        })}
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
      disabled={isDisabled}
      tone="white"
      type="button"
      variant="solid"
    >
      {label}
    </Button>
  );
};

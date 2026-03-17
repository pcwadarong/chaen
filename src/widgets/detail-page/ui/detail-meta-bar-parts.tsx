'use client';

import React from 'react';
import { css } from 'styled-system/css';

import { Button } from '@/shared/ui/button/button';
import { CalendarIcon, EyeIcon, ShareIcon } from '@/shared/ui/icons/app-icons';
import { srOnlyClass } from '@/shared/ui/styles/sr-only-style';

type DetailMetaPrimaryProps = {
  primaryMetaScreenReaderText?: string;
  primaryMetaText: string;
};

type DetailMetaShareActionProps = {
  copiedText: string;
  isCopied: boolean;
  onShare: () => void;
  shareText: string;
};

type DetailMetaViewCountProps = {
  formattedViewCount: string;
  viewCountLabel: string;
};

const ShareButtonIcon = <ShareIcon aria-hidden color="current" size="md" />;

/**
 * 디테일 메타의 주 기간/날짜 정보를 렌더링합니다.
 */
const DetailMetaPrimaryBase = ({
  primaryMetaScreenReaderText,
  primaryMetaText,
}: DetailMetaPrimaryProps) => (
  <span className={metaItemClass}>
    <CalendarIcon aria-hidden color="muted" size="md" />
    <span>
      {primaryMetaScreenReaderText ? (
        <span className={srOnlyClass}>{primaryMetaScreenReaderText}</span>
      ) : null}
      <span aria-hidden={Boolean(primaryMetaScreenReaderText)}>{primaryMetaText}</span>
    </span>
  </span>
);

DetailMetaPrimaryBase.displayName = 'DetailMetaPrimary';

export const DetailMetaPrimary = React.memo(DetailMetaPrimaryBase);

/**
 * 조회수 텍스트를 별도 경계로 렌더링합니다.
 */
const DetailMetaViewCountBase = ({
  formattedViewCount,
  viewCountLabel,
}: DetailMetaViewCountProps) => (
  <span aria-label={viewCountLabel} className={metaItemClass}>
    <EyeIcon aria-hidden color="muted" size="md" />
    <span>{formattedViewCount}</span>
  </span>
);

DetailMetaViewCountBase.displayName = 'DetailMetaViewCount';

export const DetailMetaViewCount = React.memo(DetailMetaViewCountBase);

/**
 * 링크 복사 버튼만 별도 경계로 분리합니다.
 */
const DetailMetaShareActionBase = ({
  copiedText,
  isCopied,
  onShare,
  shareText,
}: DetailMetaShareActionProps) => (
  <Button
    className={shareButtonClass}
    leadingVisual={ShareButtonIcon}
    onClick={onShare}
    size="sm"
    tone="white"
    type="button"
    variant="ghost"
  >
    {isCopied ? copiedText : shareText}
  </Button>
);

DetailMetaShareActionBase.displayName = 'DetailMetaShareAction';

export const DetailMetaShareAction = React.memo(DetailMetaShareActionBase);

const metaItemClass = css({
  display: 'inline-flex',
  alignItems: 'center',
  gap: '1',
  px: '3',
  color: 'text',
  fontSize: 'sm',
  '@media (min-width: 961px)': {
    fontSize: 'md',
  },
});

const shareButtonClass = css({
  minHeight: '[unset]',
  px: '3',
  py: '0',
  fontSize: 'sm',
  '@media (min-width: 961px)': {
    fontSize: 'md',
  },
  _hover: {
    color: 'primary',
  },
  _focusVisible: {
    color: 'primary',
  },
});

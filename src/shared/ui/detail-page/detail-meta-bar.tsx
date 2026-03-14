'use client';

import React, { type ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { css } from 'styled-system/css';

import type { ActionResult } from '@/shared/lib/action/action-result';
import { Button } from '@/shared/ui/button/button';
import { CalendarIcon, EyeIcon, ShareIcon } from '@/shared/ui/icons/app-icons';
import { srOnlyClass } from '@/shared/ui/styles/sr-only-style';

type DetailMetaBarProps = {
  actionSlot?: ReactNode;
  copyFailedText: string;
  copiedText: string;
  locale: string;
  primaryMetaScreenReaderText?: string;
  primaryMetaText: string;
  shareText: string;
  trackViewAction?: () => Promise<ActionResult<{ viewCount: number }>>;
  trackViewStorageKey?: string;
  viewCountLabel?: string;
  viewCount?: number;
};

const DETAIL_VIEW_COUNT_TRACK_ERROR_CODE = 'detailMetaBar.viewCountTrackFailed';
const DETAIL_VIEW_TRACK_STORAGE_PREFIX = 'detail-view-tracked:';

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

const DetailMetaPrimary = React.memo(DetailMetaPrimaryBase);

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

const DetailMetaViewCount = React.memo(DetailMetaViewCountBase);

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

const DetailMetaShareAction = React.memo(DetailMetaShareActionBase);

/**
 * 디테일 페이지 메타 바에서 조회수 증가와 링크 복사를 함께 처리합니다.
 */
const DetailMetaBarBase = ({
  actionSlot,
  copyFailedText,
  copiedText,
  locale,
  primaryMetaScreenReaderText,
  primaryMetaText,
  shareText,
  trackViewAction,
  trackViewStorageKey,
  viewCount,
  viewCountLabel,
}: DetailMetaBarProps) => {
  const [currentViewCount, setCurrentViewCount] = useState(viewCount ?? 0);
  const [shareState, setShareState] = useState<'idle' | 'copied'>('idle');
  const [announcement, setAnnouncement] = useState('');
  const hasTrackedViewRef = useRef(false);
  const resetShareTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    if (!trackViewAction || typeof viewCount !== 'number') return;
    if (hasTrackedViewRef.current) return;

    const normalizedTrackKey = trackViewStorageKey?.trim() || null;
    const storageKey = normalizedTrackKey
      ? `${DETAIL_VIEW_TRACK_STORAGE_PREFIX}${normalizedTrackKey}`
      : null;

    if (storageKey) {
      try {
        if (window.sessionStorage.getItem(storageKey)) {
          hasTrackedViewRef.current = true;
          return;
        }

        window.sessionStorage.setItem(storageKey, 'pending');
      } catch {
        // sessionStorage를 사용할 수 없는 환경에서는 메모리 기준으로만 중복을 막음
      }
    }

    hasTrackedViewRef.current = true;

    let isMounted = true;

    const trackViewCount = async () => {
      try {
        const result = await trackViewAction();
        if (!result.ok || !result.data) {
          throw new Error(
            result.errorCode ?? result.errorMessage ?? DETAIL_VIEW_COUNT_TRACK_ERROR_CODE,
          );
        }

        if (!isMounted) return;
        setCurrentViewCount(Number(result.data.viewCount ?? viewCount));

        if (storageKey) {
          try {
            window.sessionStorage.setItem(storageKey, '1');
          } catch {
            // no-op
          }
        }
      } catch {
        if (!isMounted) return;
        setCurrentViewCount(viewCount);
        hasTrackedViewRef.current = false;

        if (storageKey) {
          try {
            window.sessionStorage.removeItem(storageKey);
          } catch {
            // no-op
          }
        }
      }
    };

    void trackViewCount();

    return () => {
      isMounted = false;
    };
  }, [trackViewAction, trackViewStorageKey, viewCount]);

  useEffect(
    () => () => {
      if (resetShareTimeoutRef.current) {
        window.clearTimeout(resetShareTimeoutRef.current);
      }
    },
    [],
  );

  /**
   * 현재 페이지 주소를 클립보드에 복사합니다.
   */
  const handleShare = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setAnnouncement('');
      setShareState('copied');

      if (resetShareTimeoutRef.current) {
        window.clearTimeout(resetShareTimeoutRef.current);
      }

      resetShareTimeoutRef.current = window.setTimeout(() => {
        setShareState('idle');
      }, 1800);
    } catch {
      setAnnouncement(copyFailedText);
      setShareState('idle');
    }
  }, [copyFailedText]);
  const handleShareClick = useCallback(() => {
    void handleShare();
  }, [handleShare]);

  const formattedViewCount = useMemo(
    () => new Intl.NumberFormat(locale).format(Number(currentViewCount ?? 0)),
    [currentViewCount, locale],
  );

  return (
    <div className={metaBarWrapClass}>
      <div className={metaBarClass}>
        <DetailMetaPrimary
          primaryMetaScreenReaderText={primaryMetaScreenReaderText}
          primaryMetaText={primaryMetaText}
        />
        {typeof viewCount === 'number' && viewCountLabel ? (
          <>
            <span className={dividerClass} />
            <DetailMetaViewCount
              formattedViewCount={formattedViewCount}
              viewCountLabel={viewCountLabel}
            />
            <span className={dividerClass} />
          </>
        ) : (
          <span className={dividerClass} />
        )}
        <DetailMetaShareAction
          copiedText={copiedText}
          isCopied={shareState === 'copied'}
          onShare={handleShareClick}
          shareText={shareText}
        />
        {actionSlot ? (
          <>
            <span className={dividerClass} />
            {actionSlot}
          </>
        ) : null}
      </div>
      <span aria-live="polite" className={srOnlyClass}>
        {announcement}
      </span>
    </div>
  );
};

DetailMetaBarBase.displayName = 'DetailMetaBar';

export const DetailMetaBar = React.memo(DetailMetaBarBase);

const metaBarWrapClass = css({
  display: 'flex',
  width: 'full',
  justifyContent: 'center',
  overflowX: 'auto',
  scrollbarWidth: '[none]',
  '&::-webkit-scrollbar': {
    display: 'none',
  },
});

const metaBarClass = css({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: '0',
  gap: '0',
  minHeight: '[3rem]',
  minWidth: '[max-content]',
  maxWidth: 'full',
  px: '6',
  py: '0',
  borderRadius: 'full',
  border: '[1px solid var(--colors-border)]',
  background: 'surfaceMuted',
});

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

const dividerClass = css({
  width: '[1px]',
  height: '[1.5rem]',
  background: 'surfaceStrong',
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

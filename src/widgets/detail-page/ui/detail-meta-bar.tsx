'use client';

import React, { type ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { css } from 'styled-system/css';

import type { ActionResult } from '@/shared/lib/action/action-result';
import { srOnlyClass } from '@/shared/ui/styles/sr-only-style';
import {
  DetailMetaPrimary,
  DetailMetaShareAction,
  DetailMetaViewCount,
} from '@/widgets/detail-page/ui/detail-meta-bar-parts';

export type DetailMetaBarProps = {
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

const dividerClass = css({
  width: '[1px]',
  height: '[1.5rem]',
  background: 'surfaceStrong',
});

'use client';

import React, { useEffect, useRef, useState } from 'react';
import { css } from 'styled-system/css';

import { requestJsonApiClient } from '@/shared/lib/http/request-json-api-client';
import { Button } from '@/shared/ui/button/button';
import { CalendarIcon, EyeIcon, ShareIcon } from '@/shared/ui/icons/app-icons';
import { srOnlyClass } from '@/shared/ui/styles/sr-only-style';

type DetailMetaBarProps = {
  copyFailedText: string;
  copiedText: string;
  locale: string;
  primaryMetaScreenReaderText?: string;
  primaryMetaText: string;
  shareText: string;
  viewCountLabel?: string;
  viewEndpoint?: string;
  viewCount?: number;
};

type ViewCountResponse = {
  ok: boolean;
  viewCount: number;
};

/**
 * 디테일 페이지 메타 바에서 조회수 증가와 링크 복사를 함께 처리합니다.
 */
export const DetailMetaBar = ({
  copyFailedText,
  copiedText,
  locale,
  primaryMetaScreenReaderText,
  primaryMetaText,
  shareText,
  viewCount,
  viewCountLabel,
  viewEndpoint,
}: DetailMetaBarProps) => {
  const [currentViewCount, setCurrentViewCount] = useState(viewCount ?? 0);
  const [shareState, setShareState] = useState<'idle' | 'copied'>('idle');
  const [announcement, setAnnouncement] = useState('');
  const hasTrackedViewRef = useRef(false);
  const resetShareTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    if (!viewEndpoint || typeof viewCount !== 'number') return;
    if (hasTrackedViewRef.current) return;
    hasTrackedViewRef.current = true;

    let isMounted = true;

    const trackViewCount = async () => {
      try {
        const payload = await requestJsonApiClient<ViewCountResponse>({
          fallbackReason: 'failed to increase view count',
          init: {
            cache: 'no-store',
          },
          method: 'POST',
          url: viewEndpoint,
        });

        if (!isMounted) return;
        setCurrentViewCount(Number(payload.viewCount ?? viewCount));
      } catch {
        if (!isMounted) return;
        setCurrentViewCount(viewCount);
      }
    };

    void trackViewCount();

    return () => {
      isMounted = false;
    };
  }, [viewCount, viewEndpoint]);

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
  const handleShare = async () => {
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
  };

  const formattedViewCount = new Intl.NumberFormat(locale).format(Number(currentViewCount ?? 0));

  return (
    <div className={metaBarWrapClass}>
      <div className={metaBarClass}>
        <span className={metaItemClass}>
          <CalendarIcon aria-hidden color="muted" size="md" />
          <span>
            {primaryMetaScreenReaderText ? (
              <span className={srOnlyClass}>{primaryMetaScreenReaderText}</span>
            ) : null}
            <span aria-hidden={Boolean(primaryMetaScreenReaderText)}>{primaryMetaText}</span>
          </span>
        </span>
        {typeof viewCount === 'number' && viewCountLabel ? (
          <>
            <span className={dividerClass} />
            <span aria-label={viewCountLabel} className={metaItemClass}>
              <EyeIcon aria-hidden color="muted" size="md" />
              <span>{formattedViewCount}</span>
            </span>
            <span className={dividerClass} />
          </>
        ) : (
          <span className={dividerClass} />
        )}
        <Button
          className={shareButtonClass}
          onClick={handleShare}
          size="sm"
          tone="white"
          type="button"
          variant="ghost"
        >
          <ShareIcon aria-hidden color="text" size="md" />
          <span>{shareState === 'copied' ? copiedText : shareText}</span>
        </Button>
      </div>
      <span aria-live="polite" className={srOnlyClass}>
        {announcement}
      </span>
    </div>
  );
};

const metaBarWrapClass = css({
  display: 'flex',
  justifyContent: 'center',
});

const metaBarClass = css({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '4',
  minHeight: '[3.25rem]',
  px: '6',
  py: '0',
  borderRadius: 'full',
  border: '[1px solid var(--colors-border)]',
  background: 'surfaceMuted',
});

const metaItemClass = css({
  display: 'inline-flex',
  alignItems: 'center',
  gap: '2',
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
  gap: '2',
  p: '0',
  color: 'text',
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

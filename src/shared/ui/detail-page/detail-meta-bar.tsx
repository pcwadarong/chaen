'use client';

import { css } from '@emotion/react';
import React, { useEffect, useRef, useState } from 'react';

import { requestJsonApiClient } from '@/shared/lib/http/request-json-api-client';
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
    <div css={metaBarWrapStyle}>
      <div css={metaBarStyle}>
        <span css={metaItemStyle}>
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
            <span css={dividerStyle} />
            <span aria-label={viewCountLabel} css={metaItemStyle}>
              <EyeIcon aria-hidden color="muted" size="md" />
              <span>{formattedViewCount}</span>
            </span>
            <span css={dividerStyle} />
          </>
        ) : (
          <span css={dividerStyle} />
        )}
        <button onClick={handleShare} css={shareButtonStyle} type="button">
          <ShareIcon aria-hidden color="text" size="md" />
          <span>{shareState === 'copied' ? copiedText : shareText}</span>
        </button>
      </div>
      <span aria-live="polite" className={srOnlyClass}>
        {announcement}
      </span>
    </div>
  );
};

const metaBarWrapStyle = css`
  display: flex;
  justify-content: center;
`;

const metaBarStyle = css`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-4);
  min-height: 3.25rem;
  padding: 0 var(--space-6);
  border-radius: var(--radius-pill);
  border: 1px solid rgb(var(--color-border) / 0.15);
  background: rgb(var(--color-surface-muted));
`;

const metaItemStyle = css`
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  color: rgb(var(--color-text));
  font-size: var(--font-size-14);

  @media (min-width: 961px) {
    font-size: var(--font-size-16);
  }
`;

const dividerStyle = css`
  width: 1px;
  height: 1.5rem;
  background: rgb(var(--color-border) / 0.44);
`;

const shareButtonStyle = css`
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  padding: 0;
  color: rgb(var(--color-text));
  font-size: var(--font-size-14);

  @media (min-width: 961px) {
    font-size: var(--font-size-16);
  }

  &:hover,
  &:focus-visible {
    color: rgb(var(--color-primary));
  }
`;

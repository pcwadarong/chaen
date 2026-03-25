'use client';

import React, { useEffect, useState } from 'react';
import { css, cx } from 'styled-system/css';

import { type LinkEmbedData, shouldFallbackToPlainLink } from '@/shared/lib/markdown/link-embed';

type LinkEmbedCardProps = {
  className?: string;
  fallbackLabel?: string;
  url: string;
  variant: 'card' | 'preview';
};

type LinkEmbedState =
  | {
      status: 'loading';
    }
  | {
      data: LinkEmbedData;
      status: 'success';
    }
  | {
      data: LinkEmbedData;
      status: 'fallback';
    };

/**
 * URL 문자열에서 실패 없이 hostname을 추출합니다.
 */
const getSafeSiteName = (url: string) => {
  try {
    return new URL(url).hostname;
  } catch {
    return '';
  }
};

/**
 * 외부 URL의 OG 메타를 조회해 제목 링크 또는 카드형 링크로 렌더링합니다.
 * 메타가 부족하면 일반 외부 링크로 자연스럽게 fallback합니다.
 */
export const LinkEmbedCard = ({ className, fallbackLabel, url, variant }: LinkEmbedCardProps) => {
  const [state, setState] = useState<LinkEmbedState>({
    status: 'loading',
  });

  useEffect(() => {
    const controller = new AbortController();

    const fetchEmbedData = async () => {
      try {
        const response = await fetch(`/api/og?url=${encodeURIComponent(url)}`, {
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(`OG fetch failed: ${response.status}`);
        }

        const data = (await response.json()) as LinkEmbedData;

        setState({
          data,
          status: shouldFallbackToPlainLink(data) ? 'fallback' : 'success',
        });
      } catch {
        if (controller.signal.aborted) return;

        setState({
          data: {
            description: '',
            favicon: null,
            image: null,
            siteName: getSafeSiteName(url),
            title: fallbackLabel || url,
            url,
          },
          status: 'fallback',
        });
      }
    };

    void fetchEmbedData();

    return () => controller.abort();
  }, [fallbackLabel, url]);

  if (state.status === 'loading') {
    return (
      <span
        aria-live="polite"
        className={cx(variant === 'preview' ? previewSkeletonClass : cardSkeletonClass, className)}
        data-link-embed-card="true"
      >
        <span className={skeletonTextClass}>링크 정보를 불러오는 중...</span>
      </span>
    );
  }

  if (state.status === 'fallback') {
    return (
      <a
        className={fallbackLinkClass}
        href={state.data.url}
        rel="noreferrer noopener"
        target="_blank"
      >
        {fallbackLabel || state.data.title}
      </a>
    );
  }

  const { data } = state;

  if (variant === 'preview') {
    return (
      <a
        aria-label={data.title}
        className={cx(previewLinkClass, className)}
        data-link-embed-card="true"
        href={data.url}
        rel="noreferrer noopener"
        target="_blank"
      >
        {data.favicon ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img alt="" aria-hidden className={faviconClass} src={data.favicon} />
        ) : (
          <span aria-hidden className={faviconFallbackClass} />
        )}
        <span className={previewTitleClass}>{data.title}</span>
      </a>
    );
  }

  return (
    <a
      aria-label={data.title}
      className={cx(cardClass, className)}
      data-link-embed-card="true"
      href={data.url}
      rel="noreferrer noopener"
      target="_blank"
    >
      <span className={cardTextBlockClass}>
        <strong className={titleClass}>{data.title}</strong>
        {data.description ? <span className={descriptionClass}>{data.description}</span> : null}
        <span className={urlRowClass}>
          {data.favicon ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img alt="" aria-hidden className={faviconClass} src={data.favicon} />
          ) : (
            <span aria-hidden className={faviconFallbackClass} />
          )}
          <span className={urlClass}>{data.url}</span>
        </span>
      </span>
      {data.image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img alt="" aria-hidden className={previewImageClass} src={data.image} />
      ) : null}
    </a>
  );
};

const sharedCardSurfaceClass = css({
  width: 'full',
  borderRadius: 'xl',
  borderWidth: '1px',
  borderStyle: 'solid',
  borderColor: 'border',
  background: 'surface',
  textDecoration: 'none',
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

const previewLinkClass = css({
  display: 'inline-flex',
  alignItems: 'center',
  gap: '2',
  width: 'auto',
  maxWidth: '[min(100%,24rem)]',
  color: 'text',
  textDecoration: 'underline',
  textDecorationThickness: '[0.08em]',
  textUnderlineOffset: '[0.16em]',
  verticalAlign: 'baseline',
  transition: 'common',
  _hover: {
    color: 'primary',
  },
  _focusVisible: {
    outline: '[2px solid var(--colors-focus-ring)]',
    outlineOffset: '[2px]',
    borderRadius: 'sm',
  },
});

const previewTitleClass = css({
  overflow: 'hidden',
  minWidth: '0',
  fontSize: 'md',
  fontWeight: 'semibold',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
});

const cardClass = cx(
  sharedCardSurfaceClass,
  css({
    display: 'grid',
    gridTemplateColumns: 'minmax(0, 1fr) auto',
    gap: '4',
    alignItems: 'start',
    padding: '4',
    _mobileLargeDown: {
      gridTemplateColumns: '1fr',
    },
  }),
);

const cardTextBlockClass = css({
  display: 'grid',
  gap: '2',
  minWidth: '0',
});

const titleClass = css({
  overflow: 'hidden',
  color: 'text',
  fontSize: 'md',
  fontWeight: 'semibold',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
});

const descriptionClass = css({
  overflow: 'hidden',
  color: 'muted',
  fontSize: 'sm',
  lineHeight: 'relaxed',
  lineClamp: '2',
});

const urlRowClass = css({
  display: 'inline-flex',
  alignItems: 'center',
  gap: '2',
  minWidth: '0',
});

const urlClass = css({
  overflow: 'hidden',
  minWidth: '0',
  color: 'muted',
  fontSize: 'sm',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
});

const previewImageClass = css({
  width: '[10rem]',
  height: '[7rem]',
  objectFit: 'cover',
  borderRadius: 'lg',
  background: 'surfaceMuted',
  flexShrink: '0',
  _mobileLargeDown: {
    width: 'full',
    height: '[10rem]',
  },
});

const faviconClass = css({
  width: '[1rem]',
  height: '[1rem]',
  borderRadius: 'xs',
  flexShrink: '0',
});

const faviconFallbackClass = css({
  width: '[1rem]',
  height: '[1rem]',
  borderRadius: 'xs',
  flexShrink: '0',
  background: 'surfaceMuted',
});

const cardSkeletonClass = cx(
  sharedCardSurfaceClass,
  css({
    display: 'inline-flex',
    minHeight: '[8.5rem]',
    alignItems: 'center',
    padding: '4',
    background:
      '[linear-gradient(120deg, rgba(148,163,184,0.14), rgba(148,163,184,0.24), rgba(148,163,184,0.14))]',
  }),
);

const previewSkeletonClass = cx(
  css({
    display: 'inline-flex',
    minHeight: '[1.5rem]',
    width: 'auto',
    maxWidth: '[min(100%,42rem)]',
    alignItems: 'center',
    gap: '2',
    verticalAlign: 'baseline',
    borderRadius: 'sm',
    background:
      '[linear-gradient(120deg, rgba(148,163,184,0.14), rgba(148,163,184,0.24), rgba(148,163,184,0.14))]',
  }),
);

const skeletonTextClass = css({
  color: 'muted',
  fontSize: 'sm',
});

const fallbackLinkClass = css({
  color: 'primary',
  textDecoration: 'underline',
  textDecorationThickness: '[0.08em]',
  textUnderlineOffset: '[0.18em]',
  _focusVisible: {
    outline: '[2px solid var(--colors-focus-ring)]',
    outlineOffset: '[2px]',
  },
});

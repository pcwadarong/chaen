'use client';

import React from 'react';
import { css } from 'styled-system/css';

type CommentsLoadingSkeletonProps = {
  loadingText: string;
};

/**
 * 댓글 정렬/페이지 전환 중 목록 자리에 표시하는 스켈레톤입니다.
 */
const CommentsLoadingSkeletonBase = ({ loadingText }: CommentsLoadingSkeletonProps) => (
  <div aria-busy="true" aria-label={loadingText} className={commentsLoadingWrapClass} role="status">
    {Array.from({ length: 3 }).map((_, index) => (
      <div className={commentsLoadingCardClass} key={index}>
        <div className={commentsLoadingHeaderClass}>
          <div className={commentsLoadingAuthorClass} />
          <div className={commentsLoadingDateClass} />
        </div>
        <div className={commentsLoadingBodyClass}>
          <div className={commentsLoadingLineLongClass} />
          <div className={commentsLoadingLineShortClass} />
        </div>
        <div className={commentsLoadingReplyClass} />
      </div>
    ))}
  </div>
);

CommentsLoadingSkeletonBase.displayName = 'CommentsLoadingSkeleton';

export const CommentsLoadingSkeleton = React.memo(CommentsLoadingSkeletonBase);

const commentsLoadingWrapClass = css({
  display: 'grid',
  marginTop: '2',
});

const commentsLoadingCardClass = css({
  display: 'grid',
  gap: '3',
  paddingY: '4',
  borderTop: '[1px solid var(--colors-border)]',
  _first: {
    borderTop: 'none',
  },
});

const commentsLoadingHeaderClass = css({
  display: 'flex',
  alignItems: 'center',
  gap: '3',
});

const commentsLoadingBodyClass = css({
  display: 'grid',
  gap: '2',
});

const commentsLoadingAuthorClass = css({
  width: '24',
  height: '7',
  borderRadius: 'md',
  background:
    '[linear-gradient(90deg, rgba(148,163,184,0.10) 0%, rgba(148,163,184,0.22) 48%, rgba(148,163,184,0.10) 100%)]',
  backgroundSize: '[200% 100%]',
  animation: '[route-skeleton-shimmer 1.4s ease-in-out infinite]',
});

const commentsLoadingDateClass = css({
  width: '36',
  height: '5',
  borderRadius: 'md',
  background:
    '[linear-gradient(90deg, rgba(148,163,184,0.10) 0%, rgba(148,163,184,0.22) 48%, rgba(148,163,184,0.10) 100%)]',
  backgroundSize: '[200% 100%]',
  animation: '[route-skeleton-shimmer 1.4s ease-in-out infinite]',
});

const commentsLoadingLineLongClass = css({
  width: '[72%]',
  height: '6',
  borderRadius: 'md',
  background:
    '[linear-gradient(90deg, rgba(148,163,184,0.10) 0%, rgba(148,163,184,0.22) 48%, rgba(148,163,184,0.10) 100%)]',
  backgroundSize: '[200% 100%]',
  animation: '[route-skeleton-shimmer 1.4s ease-in-out infinite]',
});

const commentsLoadingLineShortClass = css({
  width: '[52%]',
  height: '6',
  borderRadius: 'md',
  background:
    '[linear-gradient(90deg, rgba(148,163,184,0.10) 0%, rgba(148,163,184,0.22) 48%, rgba(148,163,184,0.10) 100%)]',
  backgroundSize: '[200% 100%]',
  animation: '[route-skeleton-shimmer 1.4s ease-in-out infinite]',
});

const commentsLoadingReplyClass = css({
  width: '20',
  height: '5',
  borderRadius: 'md',
  background:
    '[linear-gradient(90deg, rgba(148,163,184,0.10) 0%, rgba(148,163,184,0.22) 48%, rgba(148,163,184,0.10) 100%)]',
  backgroundSize: '[200% 100%]',
  animation: '[route-skeleton-shimmer 1.4s ease-in-out infinite]',
});

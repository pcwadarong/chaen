'use client';

import { css } from '@emotion/react';
import React, { useEffect, useRef } from 'react';

import type { ProjectListItem } from '@/entities/project/model/types';
import { useProjectFeed } from '@/features/project-feed/model/use-project-feed';
import { Button } from '@/shared/ui/button/button';
import { srOnlyClass } from '@/shared/ui/styles/sr-only-style';
import { ProjectShowcase } from '@/widgets/project-showcase/ui/project-showcase';

type ProjectFeedProps = {
  emptyText: string;
  initialCursor: string | null;
  initialItems: ProjectListItem[];
  loadErrorText: string;
  loadMoreEndText: string;
  loadingText: string;
  locale: string;
  retryText: string;
};

/**
 * 프로젝트 목록의 무한 스크롤 피드를 렌더링합니다.
 */
export const ProjectFeed = ({
  emptyText,
  initialCursor,
  initialItems,
  loadErrorText,
  loadMoreEndText,
  loadingText,
  locale,
  retryText,
}: ProjectFeedProps) => {
  const { errorMessage, hasMore, isLoadingMore, items, loadMore } = useProjectFeed({
    initialCursor,
    initialItems,
    locale,
  });
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!sentinelRef.current) return;

    const observer = new IntersectionObserver(
      entries => {
        const target = entries[0];
        if (!target?.isIntersecting) return;
        void loadMore();
      },
      {
        root: null,
        threshold: 0.25,
      },
    );

    observer.observe(sentinelRef.current);

    return () => observer.disconnect();
  }, [loadMore]);

  return (
    <section css={sectionStyle}>
      {errorMessage && items.length === 0 ? (
        <div css={errorPanelStyle}>
          <p css={errorTextStyle}>{loadErrorText}</p>
          <Button onClick={() => void loadMore()} tone="white" variant="ghost">
            {retryText}
          </Button>
        </div>
      ) : (
        <ProjectShowcase emptyText={emptyText} hideHeader items={items} />
      )}

      <div aria-hidden ref={sentinelRef} css={sentinelStyle} />
      {isLoadingMore ? (
        <p aria-live="polite" css={stateTextStyle}>
          {loadingText}
        </p>
      ) : null}
      {!hasMore && items.length > 0 ? (
        <p aria-live="polite" className={srOnlyClass}>
          {loadMoreEndText}
        </p>
      ) : null}
      {errorMessage && items.length > 0 ? (
        <p aria-live="polite" css={errorTextStyle}>
          {loadErrorText}
        </p>
      ) : null}
    </section>
  );
};

const sectionStyle = css`
  display: grid;
  gap: var(--space-3);
`;

const sentinelStyle = css`
  width: 100%;
  height: 1px;
`;

const stateTextStyle = css`
  color: rgb(var(--color-muted));
  text-align: center;
`;

const errorPanelStyle = css`
  display: grid;
  gap: var(--space-3);
  justify-items: center;
  border-radius: var(--radius-md);
  border: 1px solid rgb(var(--color-border) / 0.24);
  padding: var(--space-4) var(--space-5);
`;

const errorTextStyle = css`
  color: rgb(var(--color-danger));
  text-align: center;
`;

'use client';

import { css } from '@emotion/react';
import { useEffect, useRef } from 'react';

import type { Project } from '@/entities/project/model/types';
import { useProjectFeed } from '@/features/project-feed/model/use-project-feed';
import { ProjectShowcase } from '@/widgets/project-showcase/ui/project-showcase';

type ProjectFeedProps = {
  description: string;
  emptyText: string;
  initialCursor: string | null;
  initialItems: Project[];
  loadErrorText: string;
  loadMoreEndText: string;
  loadingText: string;
  locale: string;
  retryText: string;
  title: string;
};

/**
 * 프로젝트 목록의 무한 스크롤 피드를 렌더링합니다.
 */
export const ProjectFeed = ({
  description,
  emptyText,
  initialCursor,
  initialItems,
  loadErrorText,
  loadMoreEndText,
  loadingText,
  locale,
  retryText,
  title,
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
          <button onClick={() => void loadMore()} css={retryButtonStyle} type="button">
            {retryText}
          </button>
        </div>
      ) : (
        <ProjectShowcase
          description={description}
          emptyText={emptyText}
          items={items}
          title={title}
        />
      )}

      <div aria-hidden ref={sentinelRef} css={sentinelStyle} />
      {isLoadingMore ? (
        <p aria-live="polite" css={stateTextStyle}>
          {loadingText}
        </p>
      ) : null}
      {!hasMore && items.length > 0 ? <p css={stateTextStyle}>{loadMoreEndText}</p> : null}
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
  gap: 0.8rem;
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
  gap: 0.75rem;
  justify-items: center;
  border-radius: var(--radius-md);
  border: 1px solid rgb(var(--color-border) / 0.24);
  padding: 1rem 1.25rem;
`;

const errorTextStyle = css`
  color: rgb(var(--color-danger, 210 75 75));
  text-align: center;
`;

const retryButtonStyle = css`
  min-height: 2.4rem;
  padding: 0 1rem;
  border-radius: var(--radius-pill);
  border: 1px solid rgb(var(--color-border) / 0.35);
  background-color: transparent;
  color: rgb(var(--color-text));
`;

'use client';

import React, { useCallback, useEffect, useRef } from 'react';
import { css } from 'styled-system/css';

import type { ProjectListItem } from '@/entities/project/model/types';
import { useBrowseProjects } from '@/features/browse-projects/model/use-browse-projects';
import { useAutoLoadAfterScroll } from '@/shared/lib/react/use-auto-load-after-scroll';
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

type ProjectFeedContentProps = {
  emptyText: string;
  items: ProjectListItem[];
};

type ProjectFeedErrorPanelProps = {
  loadErrorText: string;
  onRetry: () => void;
  retryText: string;
};

/**
 * 프로젝트 쇼케이스와 빈 상태만 담당하는 본문 블록입니다.
 */
const ProjectFeedContentBase = ({ emptyText, items }: ProjectFeedContentProps) => (
  <ProjectShowcase emptyText={emptyText} items={items} />
);

ProjectFeedContentBase.displayName = 'ProjectFeedContent';

const ProjectFeedContent = React.memo(ProjectFeedContentBase);

/**
 * 초기 프로젝트 로드 실패 시 노출하는 재시도 패널입니다.
 */
const ProjectFeedErrorPanelBase = ({
  loadErrorText,
  onRetry,
  retryText,
}: ProjectFeedErrorPanelProps) => (
  <div className={errorPanelClass}>
    <p className={errorTextClass}>{loadErrorText}</p>
    <Button onClick={onRetry} tone="white" variant="ghost">
      {retryText}
    </Button>
  </div>
);

ProjectFeedErrorPanelBase.displayName = 'ProjectFeedErrorPanel';

const ProjectFeedErrorPanel = React.memo(ProjectFeedErrorPanelBase);

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
  const { errorMessage, hasMore, isLoadingMore, items, loadMore } = useBrowseProjects({
    initialCursor,
    initialItems,
    locale,
  });
  const isAutoLoadEnabled = useAutoLoadAfterScroll();
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const handleLoadMore = useCallback(() => {
    void loadMore();
  }, [loadMore]);

  useEffect(() => {
    if (!sentinelRef.current) return;

    const observer = new IntersectionObserver(
      entries => {
        const target = entries[0];
        if (!target?.isIntersecting || !isAutoLoadEnabled) return;
        handleLoadMore();
      },
      {
        root: null,
        threshold: 0.25,
      },
    );

    observer.observe(sentinelRef.current);

    return () => observer.disconnect();
  }, [handleLoadMore, isAutoLoadEnabled]);

  return (
    <section className={sectionClass}>
      {errorMessage && items.length === 0 ? (
        <ProjectFeedErrorPanel
          loadErrorText={loadErrorText}
          onRetry={handleLoadMore}
          retryText={retryText}
        />
      ) : (
        <ProjectFeedContent emptyText={emptyText} items={items} />
      )}

      <div aria-hidden className={sentinelClass} ref={sentinelRef} />
      {isLoadingMore ? (
        <p aria-live="polite" className={stateTextClass}>
          {loadingText}
        </p>
      ) : null}
      {!hasMore && items.length > 0 ? (
        <p aria-live="polite" className={srOnlyClass}>
          {loadMoreEndText}
        </p>
      ) : null}
      {errorMessage && items.length > 0 ? (
        <p aria-live="polite" className={errorTextClass}>
          {loadErrorText}
        </p>
      ) : null}
    </section>
  );
};

const sectionClass = css({
  display: 'grid',
  gap: '3',
});

const sentinelClass = css({
  width: 'full',
  height: '[1px]',
});

const stateTextClass = css({
  color: 'muted',
  textAlign: 'center',
});

const errorPanelClass = css({
  display: 'grid',
  gap: '3',
  justifyItems: 'center',
  borderRadius: 'md',
  border: '[1px solid var(--colors-border)]',
  px: '5',
  py: '4',
});

const errorTextClass = css({
  color: 'error',
  textAlign: 'center',
});

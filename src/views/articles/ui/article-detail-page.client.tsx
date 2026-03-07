'use client';

import { css } from '@emotion/react';
import React from 'react';

import type { ArticleDetailListItem } from '@/entities/article/model/types';
import { buildDetailArchiveLinkItems } from '@/shared/ui/detail-page/build-detail-archive-link-items';
import { DetailMetaBar } from '@/shared/ui/detail-page/detail-meta-bar';
import { DetailPageShell } from '@/shared/ui/detail-page/detail-page-shell';

type ArticleDetailPageClientProps = {
  archiveItems: ArticleDetailListItem[];
  content: string | null;
  description: string | null;
  emptyArchiveText: string;
  emptyContentText: string;
  emptySummaryText: string;
  guestbookCtaText: string;
  id: string;
  locale: string;
  noTagsText: string;
  publishedText: string;
  sectionLabels: {
    archive: string;
    tagList: string;
  };
  shareLabels: {
    copyFailed: string;
    copied: string;
    share: string;
    viewCount: string;
  };
  tagLabels: string[];
  title: string;
  viewCount: number;
};

/**
 * 아티클 상세 프레젠테이션 컴포넌트입니다.
 */
export const ArticleDetailPageClient = ({
  archiveItems,
  content,
  description,
  emptyArchiveText,
  emptyContentText,
  emptySummaryText,
  guestbookCtaText,
  id,
  locale,
  noTagsText,
  publishedText,
  sectionLabels,
  shareLabels,
  tagLabels,
  title,
  viewCount,
}: ArticleDetailPageClientProps) => (
  <DetailPageShell
    content={content}
    emptyArchiveText={emptyArchiveText}
    emptyContentText={emptyContentText}
    guestbookCtaText={guestbookCtaText}
    heroDescription={description ?? emptySummaryText}
    metaBar={
      <DetailMetaBar
        copyFailedText={shareLabels.copyFailed}
        copiedText={shareLabels.copied}
        locale={locale}
        primaryMetaText={publishedText}
        shareText={shareLabels.share}
        viewCount={viewCount}
        viewCountLabel={shareLabels.viewCount}
        viewEndpoint={`/api/articles/${id}/views`}
      />
    }
    sidebarItems={buildDetailArchiveLinkItems({
      getHref: item => `/articles/${item.id}`,
      items: archiveItems,
      locale,
      selectedId: id,
    })}
    sidebarLabel={sectionLabels.archive}
    tagContent={
      <div aria-label={sectionLabels.tagList} css={tagListStyle}>
        {tagLabels.length > 0 ? (
          tagLabels.map(tagLabel => (
            <button aria-disabled="true" css={tagButtonStyle} key={tagLabel} type="button">
              #{tagLabel}
            </button>
          ))
        ) : (
          <button aria-disabled="true" css={tagButtonStyle} type="button">
            #{noTagsText}
          </button>
        )}
      </div>
    }
    title={title}
  />
);

const tagListStyle = css`
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: var(--space-2);

  @media (min-width: 961px) {
    gap: var(--space-3);
  }
`;

const tagButtonStyle = css`
  padding: 0.35rem var(--space-3);
  border-radius: var(--radius-pill);
  border: 1px solid rgb(var(--color-border) / 0.28);
  background-color: rgb(var(--color-surface) / 0.82);
  font-size: var(--font-size-14);
  line-height: 1.2;
  color: rgb(var(--color-muted));
`;

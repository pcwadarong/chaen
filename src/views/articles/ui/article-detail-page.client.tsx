'use client';

import { css } from '@emotion/react';
import React from 'react';

import type { ArticleDetailListItem } from '@/entities/article/model/types';
import { formatYear } from '@/shared/lib/date/format-year';
import { DetailMetaBar } from '@/shared/ui/detail-page/detail-meta-bar';
import { DetailPageShell } from '@/shared/ui/detail-page/detail-page-shell';

type ArticleDetailPageClientProps = {
  archiveItems: ArticleDetailListItem[];
  content: string | null;
  description: string | null;
  emptyArchiveText: string;
  emptyContentText: string;
  emptySummaryText: string;
  id: string;
  locale: string;
  noTagsText: string;
  publishedText: string;
  sectionLabels: {
    archive: string;
    content: string;
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
    emptyArchiveText={emptyArchiveText}
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
    sidebarItems={archiveItems.map(item => ({
      description: item.description,
      href: `/articles/${item.id}`,
      isActive: item.id === id,
      title: item.title,
      yearText: formatYear(item.created_at, locale) ?? '-',
    }))}
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
  >
    <section aria-labelledby="article-content-heading" css={contentSectionStyle}>
      <h2 id="article-content-heading" css={sectionTitleStyle}>
        {sectionLabels.content}
      </h2>
      {content ? (
        <div css={plainContentStyle}>{content}</div>
      ) : (
        <p css={emptyTextStyle}>{emptyContentText}</p>
      )}
    </section>
  </DetailPageShell>
);

const tagListStyle = css`
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: var(--space-2);
`;

const tagButtonStyle = css`
  padding: var(--space-1) var(--space-3);
  border-radius: var(--radius-pill);
  border: 1px solid rgb(var(--color-border) / 0.28);
  background-color: rgb(var(--color-surface) / 0.82);
  font-size: var(--font-size-14);
  color: rgb(var(--color-muted));
`;

const contentSectionStyle = css`
  display: grid;
  gap: var(--space-6);
`;

const sectionTitleStyle = css`
  font-size: var(--font-size-32);
  line-height: var(--line-height-110);
  letter-spacing: -0.04em;
`;

const emptyTextStyle = css`
  color: rgb(var(--color-muted));
`;

const plainContentStyle = css`
  white-space: pre-wrap;
  line-height: var(--line-height-170);
`;

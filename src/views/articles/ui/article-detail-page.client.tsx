'use client';

import { css } from '@emotion/react';
import Image from 'next/image';

import { PageHeader, PageSection, PageShell } from '@/shared/ui/page-shell/page-shell';

type ArticleDetailPageClientProps = {
  content: string | null;
  description: string | null;
  emptyContentText: string;
  emptySummaryText: string;
  emptyThumbnailText: string;
  noTagsText: string;
  publishedText: string;
  sectionLabels: {
    content: string;
    tagList: string;
    thumbnail: string;
  };
  tagLabels: string[];
  thumbnailAlt: string;
  thumbnailSrc: string | null;
  title: string;
  updatedText: string | null;
};

/**
 * 아티클 상세 프레젠테이션 컴포넌트입니다.
 */
export const ArticleDetailPageClient = ({
  content,
  description,
  emptyContentText,
  emptySummaryText,
  emptyThumbnailText,
  noTagsText,
  publishedText,
  sectionLabels,
  tagLabels,
  thumbnailAlt,
  thumbnailSrc,
  title,
  updatedText,
}: ArticleDetailPageClientProps) => (
  <PageShell>
    <article css={articleStyle}>
      <PageHeader
        description={description ?? emptySummaryText}
        meta={
          <>
            <span>{publishedText}</span>
            {updatedText ? <span>{updatedText}</span> : null}
          </>
        }
        title={title}
      >
        <ul aria-label={sectionLabels.tagList} css={tagListStyle}>
          {tagLabels.length > 0 ? (
            tagLabels.map(tagLabel => (
              <li key={tagLabel} css={tagItemStyle}>
                #{tagLabel}
              </li>
            ))
          ) : (
            <li css={tagItemStyle}>#{noTagsText}</li>
          )}
        </ul>
      </PageHeader>

      <PageSection title={sectionLabels.thumbnail} titleId="article-thumbnail-heading">
        {thumbnailSrc ? (
          <div css={thumbnailWrapStyle}>
            <Image
              alt={thumbnailAlt}
              height={768}
              src={thumbnailSrc}
              css={thumbnailStyle}
              width={1366}
            />
          </div>
        ) : (
          <p css={emptyTextStyle}>{emptyThumbnailText}</p>
        )}
      </PageSection>

      <PageSection title={sectionLabels.content} titleId="article-content-heading">
        {content ? (
          <p css={plainContentStyle}>{content}</p>
        ) : (
          <p css={emptyTextStyle}>{emptyContentText}</p>
        )}
      </PageSection>
    </article>
  </PageShell>
);

const articleStyle = css`
  display: grid;
  gap: var(--space-5);
`;

const tagListStyle = css`
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
`;

const tagItemStyle = css`
  padding: var(--space-1) var(--space-3);
  border-radius: var(--radius-pill);
  border: 1px solid rgb(var(--color-border) / 0.28);
  background-color: rgb(var(--color-surface) / 0.82);
  font-size: var(--font-size-14);
`;

const emptyTextStyle = css`
  color: rgb(var(--color-muted));
`;

const thumbnailWrapStyle = css`
  width: 100%;
  border-radius: var(--radius-md);
  overflow: hidden;
  border: 1px solid rgb(var(--color-border) / 0.2);
  background-color: rgb(var(--color-surface-strong) / 0.36);
`;

const thumbnailStyle = css`
  width: 100%;
  height: auto;
  aspect-ratio: 16 / 9;
  object-fit: cover;
`;

const plainContentStyle = css`
  white-space: pre-wrap;
  line-height: var(--line-height-170);
`;

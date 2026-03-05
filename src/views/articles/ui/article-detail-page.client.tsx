'use client';

import { css } from '@emotion/react';
import Image from 'next/image';

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
  <main css={pageStyle}>
    <article css={articleStyle}>
      <header css={heroStyle}>
        <div css={metaStyle}>
          <span>{publishedText}</span>
          {updatedText ? <span>{updatedText}</span> : null}
        </div>
        <h1 css={titleStyle}>{title}</h1>
        <p css={descriptionStyle}>{description ?? emptySummaryText}</p>
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
      </header>

      <section aria-labelledby="article-thumbnail-heading" css={panelStyle}>
        <h2 id="article-thumbnail-heading" css={sectionTitleStyle}>
          {sectionLabels.thumbnail}
        </h2>
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
      </section>

      <section aria-labelledby="article-content-heading" css={panelStyle}>
        <h2 id="article-content-heading" css={sectionTitleStyle}>
          {sectionLabels.content}
        </h2>
        {content ? (
          <p css={plainContentStyle}>{content}</p>
        ) : (
          <p css={emptyTextStyle}>{emptyContentText}</p>
        )}
      </section>
    </article>
  </main>
);

const pageStyle = css`
  width: min(1120px, calc(100% - 2rem));
  margin: 0 auto;
  padding: var(--space-12) var(--space-0) var(--space-20);
`;

const articleStyle = css`
  display: grid;
  gap: var(--space-5);
`;

const heroStyle = css`
  display: grid;
  gap: var(--space-3);
  padding: var(--space-7);
  border-radius: var(--radius-lg);
  border: 1px solid rgb(var(--color-border) / 0.24);
  background:
    linear-gradient(180deg, rgb(var(--color-surface)), rgb(var(--color-surface-muted))),
    rgb(var(--color-surface));
`;

const metaStyle = css`
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-3);
  color: rgb(var(--color-muted));
  font-size: var(--font-size-14);
`;

const titleStyle = css`
  font-size: clamp(2.2rem, 5vw, 4.4rem);
  line-height: var(--line-height-98);
  letter-spacing: -0.04em;
`;

const descriptionStyle = css`
  color: rgb(var(--color-muted));
  max-width: 70ch;
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

const panelStyle = css`
  display: grid;
  gap: var(--space-4);
  padding: var(--space-6);
  border-radius: var(--radius-lg);
  border: 1px solid rgb(var(--color-border) / 0.2);
  background-color: rgb(var(--color-surface) / 0.92);
`;

const sectionTitleStyle = css`
  font-size: var(--font-size-20);
  line-height: var(--line-height-120);
  letter-spacing: -0.02em;
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

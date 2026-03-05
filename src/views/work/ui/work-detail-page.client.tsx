'use client';

import { css } from '@emotion/react';

import type { ImageViewerLabels } from '@/shared/ui/image-viewer/image-viewer-modal';
import { WorkDetailMediaGallery } from '@/views/work/ui/work-detail-media-gallery';

type WorkDetailMediaItem = {
  alt: string;
  src: string;
  unoptimized?: boolean;
};

type WorkDetailPageClientProps = {
  content: string | null;
  description: string | null;
  emptyDescriptionText: string;
  emptyMediaText: string;
  emptySummaryText: string;
  mediaItems: WorkDetailMediaItem[];
  noTagsText: string;
  periodText: string;
  publishedText: string;
  sectionLabels: {
    description: string;
    media: string;
    tags: string;
  };
  tagLabels: string[];
  title: string;
  viewerLabels: ImageViewerLabels;
};

/**
 * 프로젝트 상세 프레젠테이션 컴포넌트입니다.
 */
export const WorkDetailPageClient = ({
  content,
  description,
  emptyDescriptionText,
  emptyMediaText,
  emptySummaryText,
  mediaItems,
  noTagsText,
  periodText,
  publishedText,
  sectionLabels,
  tagLabels,
  title,
  viewerLabels,
}: WorkDetailPageClientProps) => (
  <main css={pageStyle}>
    <article css={articleStyle}>
      <header css={heroStyle}>
        <div css={metaStyle}>
          <span>{periodText}</span>
          <span>{publishedText}</span>
        </div>
        <h1 css={titleStyle}>{title}</h1>
        <p css={descriptionStyle}>{description ?? emptySummaryText}</p>
        <ul aria-label={sectionLabels.tags} css={tagListStyle}>
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

      <section aria-labelledby="project-media-heading" css={panelStyle}>
        <h2 id="project-media-heading" css={sectionTitleStyle}>
          {sectionLabels.media}
        </h2>
        <WorkDetailMediaGallery
          emptyText={emptyMediaText}
          items={mediaItems}
          sectionLabel={sectionLabels.media}
          viewerLabels={viewerLabels}
        />
      </section>

      <section aria-labelledby="project-description-heading" css={panelStyle}>
        <h2 id="project-description-heading" css={sectionTitleStyle}>
          {sectionLabels.description}
        </h2>
        {content ? (
          <p css={plainContentStyle}>{content}</p>
        ) : (
          <p css={emptyTextStyle}>{emptyDescriptionText}</p>
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

const plainContentStyle = css`
  white-space: pre-wrap;
  line-height: var(--line-height-170);
`;

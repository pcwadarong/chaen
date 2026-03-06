'use client';

import { css } from '@emotion/react';

import type { ImageViewerLabels } from '@/shared/ui/image-viewer/image-viewer-modal';
import { PageHeader, PageSection, PageShell } from '@/shared/ui/page-shell/page-shell';
import { ProjectDetailMediaGallery } from '@/views/project/ui/project-detail-media-gallery';

type ProjectDetailMediaItem = {
  alt: string;
  src: string;
  unoptimized?: boolean;
};

type ProjectDetailPageClientProps = {
  content: string | null;
  description: string | null;
  emptyDescriptionText: string;
  emptyMediaText: string;
  emptySummaryText: string;
  mediaItems: ProjectDetailMediaItem[];
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
export const ProjectDetailPageClient = ({
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
}: ProjectDetailPageClientProps) => (
  <PageShell>
    <article css={articleStyle}>
      <PageHeader
        description={description ?? emptySummaryText}
        meta={
          <>
            <span>{periodText}</span>
            <span>{publishedText}</span>
          </>
        }
        title={title}
      >
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
      </PageHeader>

      <PageSection title={sectionLabels.media} titleId="project-media-heading">
        <ProjectDetailMediaGallery
          emptyText={emptyMediaText}
          items={mediaItems}
          sectionLabel={sectionLabels.media}
          viewerLabels={viewerLabels}
        />
      </PageSection>

      <PageSection title={sectionLabels.description} titleId="project-description-heading">
        {content ? (
          <p css={plainContentStyle}>{content}</p>
        ) : (
          <p css={emptyTextStyle}>{emptyDescriptionText}</p>
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

const plainContentStyle = css`
  white-space: pre-wrap;
  line-height: var(--line-height-170);
`;

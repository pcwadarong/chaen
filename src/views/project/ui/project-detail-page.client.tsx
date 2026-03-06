'use client';

import { css } from '@emotion/react';
import React from 'react';

import type { ProjectDetailListItem } from '@/entities/project/model/types';
import { formatYear } from '@/shared/lib/date/format-year';
import { DetailMetaBar } from '@/shared/ui/detail-page/detail-meta-bar';
import { DetailPageShell } from '@/shared/ui/detail-page/detail-page-shell';

type ProjectDetailPageClientProps = {
  archiveItems: ProjectDetailListItem[];
  content: string | null;
  description: string | null;
  emptyArchiveText: string;
  emptyDescriptionText: string;
  emptySummaryText: string;
  id: string;
  locale: string;
  noTagsText: string;
  periodText: string;
  sectionLabels: {
    archive: string;
    description: string;
    tagList: string;
  };
  shareLabels: {
    copyFailed: string;
    copied: string;
    share: string;
  };
  tagLabels: string[];
  title: string;
};

/**
 * 프로젝트 상세 프레젠테이션 컴포넌트입니다.
 */
export const ProjectDetailPageClient = ({
  archiveItems,
  content,
  description,
  emptyArchiveText,
  emptyDescriptionText,
  emptySummaryText,
  id,
  locale,
  noTagsText,
  periodText,
  sectionLabels,
  shareLabels,
  tagLabels,
  title,
}: ProjectDetailPageClientProps) => (
  <DetailPageShell
    emptyArchiveText={emptyArchiveText}
    heroDescription={description ?? emptySummaryText}
    metaBar={
      <DetailMetaBar
        copyFailedText={shareLabels.copyFailed}
        copiedText={shareLabels.copied}
        locale={locale}
        primaryMetaText={periodText}
        shareText={shareLabels.share}
      />
    }
    sidebarItems={archiveItems.map(item => ({
      description: item.description,
      href: `/project/${item.id}`,
      isActive: item.id === id,
      title: item.title,
      yearText: formatYear(item.created_at, locale) ?? '-',
    }))}
    sidebarLabel={sectionLabels.archive}
    tagContent={
      <p aria-label={sectionLabels.tagList} css={tagListTextStyle}>
        {tagLabels.length > 0
          ? tagLabels.map(tagLabel => `#${tagLabel}`).join(' ')
          : `#${noTagsText}`}
      </p>
    }
    title={title}
  >
    <section aria-labelledby="project-description-heading" css={contentSectionStyle}>
      <h2 id="project-description-heading" css={sectionTitleStyle}>
        {sectionLabels.description}
      </h2>
      {content ? (
        <div css={plainContentStyle}>{content}</div>
      ) : (
        <p css={emptyTextStyle}>{emptyDescriptionText}</p>
      )}
    </section>
  </DetailPageShell>
);

const tagListTextStyle = css`
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: var(--space-3);
  color: rgb(var(--color-muted));
  font-size: var(--font-size-18);
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

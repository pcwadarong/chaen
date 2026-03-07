'use client';

import { css } from '@emotion/react';
import React from 'react';

import type { ProjectDetailListItem } from '@/entities/project/model/types';
import { buildDetailArchiveLinkItems } from '@/shared/ui/detail-page/build-detail-archive-link-items';
import { DetailMetaBar } from '@/shared/ui/detail-page/detail-meta-bar';
import { DetailPageShell } from '@/shared/ui/detail-page/detail-page-shell';

type ProjectDetailPageClientProps = {
  archiveItems: ProjectDetailListItem[];
  content: string | null;
  description: string | null;
  emptyArchiveText: string;
  emptyDescriptionText: string;
  emptySummaryText: string;
  guestbookCtaText: string;
  id: string;
  locale: string;
  noTagsText: string;
  periodText: string;
  sectionLabels: {
    archive: string;
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
  guestbookCtaText,
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
    content={content}
    emptyArchiveText={emptyArchiveText}
    emptyContentText={emptyDescriptionText}
    guestbookCtaText={guestbookCtaText}
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
    sidebarItems={buildDetailArchiveLinkItems({
      getHref: item => `/project/${item.id}`,
      items: archiveItems,
      locale,
      selectedId: id,
    })}
    sidebarLabel={sectionLabels.archive}
    tagContent={
      <p aria-label={sectionLabels.tagList} css={tagListTextStyle}>
        {tagLabels.length > 0 ? (
          tagLabels.map(tagLabel => <span key={tagLabel}># {tagLabel}</span>)
        ) : (
          <span>{noTagsText}</span>
        )}
      </p>
    }
    title={title}
  />
);

const tagListTextStyle = css`
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  align-items: center;
  gap: var(--space-1) var(--space-2);
  margin: 0;
  color: rgb(var(--color-muted));
  font-size: var(--font-size-13);
  line-height: var(--line-height-140);

  @media (min-width: 961px) {
    gap: var(--space-1) var(--space-3);
    font-size: var(--font-size-14);
  }
`;

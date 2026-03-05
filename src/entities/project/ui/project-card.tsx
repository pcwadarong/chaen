'use client';

import { css } from '@emotion/react';
import Image from 'next/image';
import { useLocale } from 'next-intl';

import { getTagLabelByLocale } from '@/entities/project/model/tag-map';
import type { Project } from '@/entities/project/model/types';
import { Link } from '@/i18n/navigation';
import { formatYear } from '@/shared/lib/date/format-year';
import { createImageViewerUrl } from '@/shared/lib/url/create-image-viewer-url';
import { normalizeImageUrl } from '@/shared/lib/url/normalize-image-url';

type ProjectCardProps = {
  item: Project;
};

/** 프로젝트 요약 카드를 렌더링합니다. */
export const ProjectCard = ({ item }: ProjectCardProps) => {
  const locale = useLocale();
  const tagLabel = item.tags?.[0] ? getTagLabelByLocale(item.tags[0], locale) : 'project';
  const thumbnailSrc = normalizeImageUrl(item.thumbnail_url);
  const previewThumbnailSrc = thumbnailSrc ? createImageViewerUrl(thumbnailSrc) : null;
  const createdYearText = formatYear(item.created_at, locale) ?? '-';

  return (
    <Link aria-label={`${item.title} 상세 보기`} href={`/project/${item.id}`} css={cardLinkStyle}>
      <article css={cardStyle}>
        {previewThumbnailSrc ? (
          <div css={thumbnailWrapStyle}>
            <Image
              alt={`${item.title} thumbnail`}
              height={720}
              src={previewThumbnailSrc}
              css={thumbnailStyle}
              width={1280}
            />
          </div>
        ) : null}
        <div css={metaStyle}>
          <span>{tagLabel}</span>
          <span>{createdYearText}</span>
        </div>
        <div css={bodyStyle}>
          <h3 css={titleStyle}>{item.title}</h3>
          <p css={summaryStyle}>{item.description ?? ''}</p>
        </div>
      </article>
    </Link>
  );
};

const cardStyle = css`
  min-height: 18rem;
  height: 100%;
  display: grid;
  align-content: start;
  gap: var(--space-4);
  padding: var(--space-6);
  border-radius: var(--radius-lg);
  border: 1px solid rgb(var(--color-border) / 0.22);
  background:
    linear-gradient(180deg, rgb(var(--color-surface)), rgb(var(--color-surface-muted))),
    rgb(var(--color-surface));
`;

const thumbnailWrapStyle = css`
  border-radius: var(--radius-md);
  overflow: hidden;
  border: 1px solid rgb(var(--color-border) / 0.18);
  background-color: rgb(var(--color-surface-strong) / 0.5);
`;

const thumbnailStyle = css`
  width: 100%;
  height: auto;
  aspect-ratio: 16 / 9;
  object-fit: cover;
`;

const metaStyle = css`
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-3);
  color: rgb(var(--color-muted));
  font-size: var(--font-size-14);
`;

const bodyStyle = css`
  display: grid;
  gap: var(--space-3);
`;

const titleStyle = css`
  font-size: var(--font-size-20);
  line-height: var(--line-height-120);
  letter-spacing: -0.03em;
`;

const summaryStyle = css`
  color: rgb(var(--color-muted));
`;

const cardLinkStyle = css`
  display: block;
  height: 100%;
  text-decoration: none;
  color: rgb(var(--color-text));
`;

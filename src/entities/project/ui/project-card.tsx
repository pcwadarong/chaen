'use client';

import Image from 'next/image';
import { useLocale } from 'next-intl';
import type { CSSProperties } from 'react';

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
    <Link aria-label={`${item.title} 상세 보기`} href={`/work/${item.id}`} style={cardLinkStyle}>
      <article style={cardStyle}>
        {previewThumbnailSrc ? (
          <div style={thumbnailWrapStyle}>
            <Image
              alt={`${item.title} thumbnail`}
              height={720}
              src={previewThumbnailSrc}
              style={thumbnailStyle}
              width={1280}
            />
          </div>
        ) : null}
        <div style={metaStyle}>
          <span>{tagLabel}</span>
          <span>{createdYearText}</span>
        </div>
        <div style={bodyStyle}>
          <h3 style={titleStyle}>{item.title}</h3>
          <p style={summaryStyle}>{item.description ?? ''}</p>
        </div>
      </article>
    </Link>
  );
};

const cardStyle: CSSProperties = {
  minHeight: '18rem',
  display: 'grid',
  alignContent: 'space-between',
  gap: '1rem',
  padding: '1.5rem',
  borderRadius: 'var(--radius-lg)',
  border: '1px solid rgb(var(--color-border) / 0.22)',
  background:
    'linear-gradient(180deg, rgb(var(--color-surface)), rgb(var(--color-surface-muted))), rgb(var(--color-surface))',
};

const thumbnailWrapStyle: CSSProperties = {
  borderRadius: 'var(--radius-md)',
  overflow: 'hidden',
  border: '1px solid rgb(var(--color-border) / 0.18)',
  backgroundColor: 'rgb(var(--color-surface-strong) / 0.5)',
};

const thumbnailStyle: CSSProperties = {
  width: '100%',
  height: 'auto',
  aspectRatio: '16 / 9',
  objectFit: 'cover',
};

const metaStyle: CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: '0.75rem',
  color: 'rgb(var(--color-muted))',
  fontSize: '0.92rem',
};

const bodyStyle: CSSProperties = {
  display: 'grid',
  gap: '0.75rem',
};

const titleStyle: CSSProperties = {
  fontSize: '1.35rem',
  lineHeight: 1.15,
  letterSpacing: '-0.03em',
};

const summaryStyle: CSSProperties = {
  color: 'rgb(var(--color-muted))',
};

const cardLinkStyle: CSSProperties = {
  display: 'block',
  textDecoration: 'none',
  color: 'rgb(var(--color-text))',
};

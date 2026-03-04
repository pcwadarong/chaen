'use client';

import Image from 'next/image';
import { useLocale } from 'next-intl';
import type { CSSProperties } from 'react';

import type { Article } from '@/entities/article/model/types';
import { getTagLabelByLocale } from '@/entities/project/model/tag-map';
import { createImageViewerUrl } from '@/shared/lib/url/create-image-viewer-url';

type ArticleCardProps = {
  article: Article;
};

/** 아티클 목록용 요약 카드를 렌더링합니다. */
export const ArticleCard = ({ article }: ArticleCardProps) => {
  const locale = useLocale();
  const thumbnailSrc = article.thumbnail_url ? createImageViewerUrl(article.thumbnail_url) : null;
  const normalizedTags = article.tags ?? [];

  return (
    <article style={cardStyle}>
      {thumbnailSrc ? (
        <div style={thumbnailWrapStyle}>
          <Image
            alt={`${article.title} thumbnail`}
            height={768}
            src={thumbnailSrc}
            style={thumbnailStyle}
            width={1366}
          />
        </div>
      ) : null}
      {normalizedTags.length > 0 ? (
        <div style={tagsStyle}>
          {normalizedTags.map(tag => (
            <span key={tag} style={tagStyle}>
              {getTagLabelByLocale(tag, locale)}
            </span>
          ))}
        </div>
      ) : null}
      <div style={bodyStyle}>
        <h3 style={titleStyle}>{article.title}</h3>
        {article.description ? <p style={descriptionStyle}>{article.description}</p> : null}
      </div>
    </article>
  );
};

const cardStyle: CSSProperties = {
  display: 'grid',
  gap: '1rem',
  padding: '1.5rem',
  borderRadius: 'var(--radius-lg)',
  border: '1px solid rgb(var(--color-border) / 0.22)',
  background:
    'linear-gradient(180deg, rgb(var(--color-surface)), rgb(var(--color-surface-muted))), rgb(var(--color-surface))',
};

const thumbnailWrapStyle: CSSProperties = {
  width: '100%',
  borderRadius: 'var(--radius-md)',
  overflow: 'hidden',
};

const thumbnailStyle: CSSProperties = {
  width: '100%',
  height: 'auto',
  aspectRatio: '16 / 9',
  objectFit: 'cover',
};

const tagsStyle: CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: '0.5rem',
};

const tagStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  minHeight: '2rem',
  padding: '0 0.75rem',
  borderRadius: 'var(--radius-pill)',
  backgroundColor: 'rgb(var(--color-text) / 0.06)',
  fontSize: '0.82rem',
  fontWeight: 700,
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
  color: 'rgb(var(--color-muted))',
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

const descriptionStyle: CSSProperties = {
  color: 'rgb(var(--color-muted))',
};

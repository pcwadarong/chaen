'use client';

import { css } from '@emotion/react';
import Image from 'next/image';
import { useLocale } from 'next-intl';

import type { Article } from '@/entities/article/model/types';
import { getTagLabelByLocale } from '@/entities/project/model/tag-map';
import { Link } from '@/i18n/navigation';
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
    <Link
      aria-label={`${article.title} 상세 보기`}
      href={`/articles/${article.id}`}
      css={cardLinkStyle}
    >
      <article css={cardStyle}>
        {thumbnailSrc ? (
          <div css={thumbnailWrapStyle}>
            <Image
              alt={`${article.title} thumbnail`}
              height={768}
              src={thumbnailSrc}
              css={thumbnailStyle}
              width={1366}
            />
          </div>
        ) : null}
        {normalizedTags.length > 0 ? (
          <div css={tagsStyle}>
            {normalizedTags.map(tag => (
              <span key={tag} css={tagStyle}>
                {getTagLabelByLocale(tag, locale)}
              </span>
            ))}
          </div>
        ) : null}
        <div css={bodyStyle}>
          <h3 css={titleStyle}>{article.title}</h3>
          {article.description ? <p css={descriptionStyle}>{article.description}</p> : null}
        </div>
      </article>
    </Link>
  );
};

const cardStyle = css`
  height: 100%;
  display: grid;
  align-content: start;
  gap: 1rem;
  padding: 1.5rem;
  border-radius: var(--radius-lg);
  border: 1px solid rgb(var(--color-border) / 0.22);
  background:
    linear-gradient(180deg, rgb(var(--color-surface)), rgb(var(--color-surface-muted))),
    rgb(var(--color-surface));
`;

const thumbnailWrapStyle = css`
  width: 100%;
  border-radius: var(--radius-md);
  overflow: hidden;
`;

const thumbnailStyle = css`
  width: 100%;
  height: auto;
  aspect-ratio: 16 / 9;
  object-fit: cover;
`;

const tagsStyle = css`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
`;

const tagStyle = css`
  display: inline-flex;
  align-items: center;
  min-height: 2rem;
  padding: 0 0.75rem;
  border-radius: var(--radius-pill);
  background-color: rgb(var(--color-text) / 0.06);
  font-size: 0.82rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: rgb(var(--color-muted));
`;

const bodyStyle = css`
  display: grid;
  gap: 0.75rem;
`;

const titleStyle = css`
  font-size: 1.35rem;
  line-height: 1.15;
  letter-spacing: -0.03em;
`;

const descriptionStyle = css`
  color: rgb(var(--color-muted));
`;

const cardLinkStyle = css`
  display: block;
  height: 100%;
  text-decoration: none;
  color: rgb(var(--color-text));
`;

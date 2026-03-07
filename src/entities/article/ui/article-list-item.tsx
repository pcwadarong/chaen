'use client';

import { css } from '@emotion/react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import React from 'react';

import type { ArticleListItem as ArticleListItemModel } from '@/entities/article/model/types';
import { Link } from '@/i18n/navigation';
import { formatYearMonthDay } from '@/shared/lib/date/format-year-month-day';
import { createImageViewerUrl } from '@/shared/lib/url/create-image-viewer-url';
import { normalizeImageUrl } from '@/shared/lib/url/normalize-image-url';

type ArticleListItemProps = {
  article: ArticleListItemModel;
};

/**
 * 아티클 목록 좌측 컬럼에서 사용하는 와이드 리스트 아이템입니다.
 *
 * 카드형 UI 대신 텍스트 흐름을 먼저 읽고, 썸네일을 보조 정보처럼 우측에 배치합니다.
 */
export const ArticleListItem = ({ article }: ArticleListItemProps) => {
  const t = useTranslations('Articles');
  const thumbnailSrc = normalizeImageUrl(article.thumbnail_url);
  const previewThumbnailSrc = thumbnailSrc ? createImageViewerUrl(thumbnailSrc) : null;
  const publishedDate = formatYearMonthDay(article.created_at) ?? '-';

  return (
    <Link
      aria-label={t('viewArticle', { title: article.title })}
      css={linkStyle}
      href={`/articles/${article.id}`}
    >
      <article css={articleStyle}>
        <div css={contentStyle}>
          <div css={bodyStyle}>
            <h2 css={titleStyle}>{article.title}</h2>
            {article.description ? <p css={descriptionStyle}>{article.description}</p> : null}
          </div>
          <time css={dateStyle} dateTime={article.created_at}>
            {publishedDate}
          </time>
        </div>
        <div css={mediaStyle}>
          {previewThumbnailSrc ? (
            <Image
              alt={`${article.title} thumbnail`}
              css={imageStyle}
              fill
              sizes="8.75rem"
              src={previewThumbnailSrc}
            />
          ) : (
            <div aria-hidden css={imageFallbackStyle} />
          )}
        </div>
      </article>
    </Link>
  );
};

const linkStyle = css`
  display: block;
  color: rgb(var(--color-text));
  text-decoration: none;
`;

const articleStyle = css`
  display: flex;
  justify-content: space-between;
  gap: var(--space-5);
  padding: var(--space-7) 0;
`;

const contentStyle = css`
  display: grid;
  gap: var(--space-4);
  align-content: center;
`;

const bodyStyle = css`
  display: grid;
  gap: var(--space-3);
`;

const titleStyle = css`
  color: rgb(var(--color-primary));
  font-size: 1.5rem;
  line-height: 1.12;
  letter-spacing: -0.05em;
`;

const descriptionStyle = css`
  color: rgb(var(--color-text));
  font-size: 1rem;
  line-height: 1.5;
  letter-spacing: -0.03em;
`;

const dateStyle = css`
  color: rgb(var(--color-muted));
  font-size: var(--font-size-14);
`;

const mediaStyle = css`
  position: relative;
  flex: 0 0 8.75rem;
  width: 8.75rem;
  min-width: 8.75rem;
  aspect-ratio: 4 / 3;
  justify-self: end;
  overflow: hidden;
  border-radius: var(--radius-sm);
  background: rgb(var(--color-muted) / 0.16);
`;

const imageStyle = css`
  display: block;
  object-fit: cover;
`;

const imageFallbackStyle = css`
  width: 100%;
  height: 100%;
`;

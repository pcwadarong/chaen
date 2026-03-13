import Image from 'next/image';
import { useTranslations } from 'next-intl';
import React from 'react';
import { css } from 'styled-system/css';

import type { ArticleListItem as ArticleListItemModel } from '@/entities/article/model/types';
import { Link } from '@/i18n/navigation';
import {
  resolvePublicContentPathSegment,
  resolvePublicContentPublishedAt,
} from '@/shared/lib/content/public-content';
import { formatYearMonthDay } from '@/shared/lib/date/format-year-month-day';
import { normalizeImageUrl } from '@/shared/lib/url/normalize-image-url';
import { createImageViewerUrl } from '@/shared/ui/image-viewer/model/create-image-viewer-url';

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
  const publishedAt = resolvePublicContentPublishedAt(article);
  const publishedDate = formatYearMonthDay(publishedAt) ?? '-';
  const articlePathSegment = resolvePublicContentPathSegment(article);

  return (
    <Link
      aria-label={t('viewArticle', { title: article.title })}
      className={linkClass}
      data-article-list-item="true"
      href={`/articles/${articlePathSegment}`}
    >
      <article className={articleClass}>
        <div className={contentClass}>
          <div className={bodyClass}>
            <h2 className={titleClass}>{article.title}</h2>
            {article.description ? <p className={descriptionClass}>{article.description}</p> : null}
          </div>
          <time className={dateClass} dateTime={publishedAt}>
            {publishedDate}
          </time>
        </div>
        <div className={mediaClass}>
          {previewThumbnailSrc ? (
            <Image
              alt=""
              className={imageClass}
              fill
              sizes="8.75rem"
              src={previewThumbnailSrc}
              unoptimized
            />
          ) : (
            <div aria-hidden className={imageFallbackClass} />
          )}
        </div>
      </article>
    </Link>
  );
};

const linkClass = css({
  display: 'block',
  color: 'text',
  textDecoration: 'none',
});

const articleClass = css({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'stretch',
  gap: '5',
  py: '7',
});

const contentClass = css({
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'space-between',
  minWidth: '0',
  flex: '[1 1 auto]',
  '@media (min-width: 480px)': {
    minHeight: '[8.75rem]',
  },
});

const bodyClass = css({
  display: 'grid',
  minWidth: '0',
  gap: '3',
});

const titleClass = css({
  lineClamp: '2',
  textWrap: 'wrap',
  wordBreak: 'keep-all',
  overflowWrap: 'normal',
  color: 'primary',
  fontSize: '2xl',
  lineHeight: 'tight',
  letterSpacing: '[-0.05em]',
  fontWeight: 'bold',
});

const descriptionClass = css({
  lineClamp: '2',
  textWrap: 'wrap',
  wordBreak: 'keep-all',
  overflowWrap: 'normal',
  color: 'text',
  fontSize: 'md',
  lineHeight: 'normal',
  letterSpacing: '[-0.03em]',
});

const dateClass = css({
  color: 'muted',
  fontSize: 'sm',
  marginTop: '[0.5rem]',
});

const mediaClass = css({
  display: 'none',
  '@media (min-width: 480px)': {
    display: 'block',
    position: 'relative',
    flex: '[0 0 8.75rem]',
    width: '[8.75rem]',
    minWidth: '[8.75rem]',
    aspectRatio: 'square',
    justifySelf: 'end',
    overflow: 'hidden',
    borderRadius: 'sm',
    background: 'surfaceStrong',
  },
});

const imageClass = css({
  display: 'block',
  objectFit: 'cover',
  transition: 'transform',
  '[data-article-list-item="true"]:hover &': {
    transform: '[scale(1.05)]',
  },
  '[data-article-list-item="true"]:focus-visible &': {
    transform: '[scale(1.05)]',
  },
});

const imageFallbackClass = css({
  width: 'full',
  height: 'full',
});

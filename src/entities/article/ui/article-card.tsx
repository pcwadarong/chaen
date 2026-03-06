'use client';

import { useLocale } from 'next-intl';

import type { Article } from '@/entities/article/model/types';
import { formatYear } from '@/shared/lib/date/format-year';
import { createImageViewerUrl } from '@/shared/lib/url/create-image-viewer-url';
import { normalizeImageUrl } from '@/shared/lib/url/normalize-image-url';
import { ContentCard } from '@/shared/ui/content-card/content-card';

type ArticleCardProps = {
  article: Article;
};

/** 아티클 목록용 요약 카드를 렌더링합니다. */
export const ArticleCard = ({ article }: ArticleCardProps) => {
  const locale = useLocale();
  const thumbnailSrc = normalizeImageUrl(article.thumbnail_url);
  const previewThumbnailSrc = thumbnailSrc ? createImageViewerUrl(thumbnailSrc) : null;
  const createdYearText = formatYear(article.created_at, locale) ?? '-';

  return (
    <ContentCard
      ariaLabel={`${article.title} 상세 보기`}
      description={article.description}
      href={`/articles/${article.id}`}
      metaItems={[createdYearText]}
      thumbnailAlt={`${article.title} thumbnail`}
      thumbnailSrc={previewThumbnailSrc}
      title={article.title}
    />
  );
};

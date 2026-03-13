import { useLocale } from 'next-intl';
import React from 'react';

import type { ArticleListItem } from '@/entities/article/model/types';
import {
  resolvePublicContentPathSegment,
  resolvePublicContentPublishedAt,
} from '@/shared/lib/content/public-content';
import { formatYear } from '@/shared/lib/date/format-year';
import { normalizeImageUrl } from '@/shared/lib/url/normalize-image-url';
import { ContentCard } from '@/shared/ui/content-card/content-card';
import { createImageViewerUrl } from '@/shared/ui/image-viewer/model/create-image-viewer-url';

type ArticleCardProps = {
  article: ArticleListItem;
};

/** 아티클 목록용 요약 카드를 렌더링합니다. */
export const ArticleCard = ({ article }: ArticleCardProps) => {
  const locale = useLocale();
  const thumbnailSrc = normalizeImageUrl(article.thumbnail_url);
  const previewThumbnailSrc = thumbnailSrc ? createImageViewerUrl(thumbnailSrc) : null;
  const createdYearText = formatYear(resolvePublicContentPublishedAt(article), locale) ?? '-';

  return (
    <ContentCard
      ariaLabel={`${article.title} 상세 보기`}
      description={article.description}
      href={`/articles/${resolvePublicContentPathSegment(article)}`}
      metaItems={[createdYearText]}
      thumbnailAlt={`${article.title} thumbnail`}
      thumbnailSrc={previewThumbnailSrc}
      title={article.title}
    />
  );
};

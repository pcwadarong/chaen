import { useLocale } from 'next-intl';
import React from 'react';

import type { ProjectListItem } from '@/entities/project/model/types';
import {
  resolvePublicContentPathSegment,
  resolvePublicContentPublishedAt,
} from '@/shared/lib/content/public-content';
import { formatYear } from '@/shared/lib/date/format-year';
import { normalizeImageUrl } from '@/shared/lib/url/normalize-image-url';
import { ContentCard } from '@/shared/ui/content-card/content-card';
import { createImageViewerUrl } from '@/shared/ui/image-viewer/model/create-image-viewer-url';

type ProjectCardProps = {
  item: ProjectListItem;
};

/** 프로젝트 요약 카드를 렌더링합니다. */
export const ProjectCard = ({ item }: ProjectCardProps) => {
  const locale = useLocale();
  const thumbnailSrc = normalizeImageUrl(item.thumbnail_url);
  const previewThumbnailSrc = thumbnailSrc ? createImageViewerUrl(thumbnailSrc) : null;
  const createdYearText = formatYear(resolvePublicContentPublishedAt(item), locale) ?? '-';

  return (
    <ContentCard
      ariaLabel={`${item.title} 상세 보기`}
      description={item.description}
      href={`/project/${resolvePublicContentPathSegment(item)}`}
      locale={locale}
      metaItems={[createdYearText]}
      thumbnailAlt={`${item.title} thumbnail`}
      thumbnailSrc={previewThumbnailSrc}
      title={item.title}
    />
  );
};

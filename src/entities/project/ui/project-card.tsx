import { useLocale } from 'next-intl';

import type { ProjectListItem } from '@/entities/project/model/types';
import { formatYear } from '@/shared/lib/date/format-year';
import { createImageViewerUrl } from '@/shared/lib/url/create-image-viewer-url';
import { normalizeImageUrl } from '@/shared/lib/url/normalize-image-url';
import { ContentCard } from '@/shared/ui/content-card/content-card';

type ProjectCardProps = {
  item: ProjectListItem;
};

/** 프로젝트 요약 카드를 렌더링합니다. */
export const ProjectCard = ({ item }: ProjectCardProps) => {
  const locale = useLocale();
  const thumbnailSrc = normalizeImageUrl(item.thumbnail_url);
  const previewThumbnailSrc = thumbnailSrc ? createImageViewerUrl(thumbnailSrc) : null;
  const createdYearText = formatYear(item.created_at, locale) ?? '-';

  return (
    <ContentCard
      ariaLabel={`${item.title} 상세 보기`}
      description={item.description}
      href={`/project/${item.id}`}
      metaItems={[createdYearText]}
      thumbnailAlt={`${item.title} thumbnail`}
      thumbnailSrc={previewThumbnailSrc}
      title={item.title}
    />
  );
};

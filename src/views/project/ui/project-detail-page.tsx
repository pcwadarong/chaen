import { getTranslations } from 'next-intl/server';

import { getTagLabelByLocale } from '@/entities/project/model/tag-map';
import type { Project } from '@/entities/project/model/types';
import { formatMonthYear } from '@/shared/lib/date/format-month-year';
import { createImageViewerUrl } from '@/shared/lib/url/create-image-viewer-url';
import { normalizeImageUrl } from '@/shared/lib/url/normalize-image-url';
import { ProjectDetailPageClient } from '@/views/project/ui/project-detail-page.client';

type ProjectDetailPageProps = {
  item: Project;
  locale: string;
};

/**
 * GIF URL인지 여부를 판단합니다.
 */
const isGifUrl = (url: string) => /\.gif($|\?)/i.test(url);

/**
 * 프로젝트 미디어 URL 목록을 중복 없이 병합합니다.
 */
const getProjectMediaUrls = (item: Project) => {
  const uniqueMedia = new Set<string>();

  [item.thumbnail_url, ...(item.gallery_urls ?? [])].forEach(mediaUrl => {
    const normalizedMediaUrl = normalizeImageUrl(mediaUrl);

    if (normalizedMediaUrl) {
      uniqueMedia.add(normalizedMediaUrl);
    }
  });

  return [...uniqueMedia];
};

/**
 * 기간 텍스트를 생성합니다.
 */
const formatProjectPeriod = (item: Project, locale: string, ongoingLabel: string) => {
  const startText = formatMonthYear(item.period_start ?? item.created_at, locale);
  const endText = formatMonthYear(item.period_end, locale);

  if (startText && endText) {
    return `${startText} - ${endText}`;
  }

  if (startText && !endText && item.period_start) {
    return `${startText} - ${ongoingLabel}`;
  }

  if (startText) {
    return startText;
  }

  return ongoingLabel;
};

/**
 * 프로젝트 상세 페이지 컨테이너입니다.
 */
export const ProjectDetailPage = async ({ item, locale }: ProjectDetailPageProps) => {
  const t = await getTranslations('ProjectDetail');
  const imageViewerText = await getTranslations('ImageViewer');
  const mediaUrls = getProjectMediaUrls(item);
  const mediaItems = mediaUrls.map((mediaUrl, index) => ({
    alt: t('mediaAlt', { index: index + 1, title: item.title }),
    src: createImageViewerUrl(mediaUrl),
    unoptimized: isGifUrl(mediaUrl),
  }));
  const periodText = formatProjectPeriod(item, locale, t('ongoing'));

  return (
    <ProjectDetailPageClient
      content={item.content}
      description={item.description}
      emptyDescriptionText={t('emptyDescription')}
      emptyMediaText={t('emptyMedia')}
      emptySummaryText={t('emptySummary')}
      mediaItems={mediaItems}
      noTagsText={t('noTags')}
      periodText={periodText}
      publishedText={t('publishedAt', { date: item.created_at.slice(0, 10) })}
      sectionLabels={{
        description: t('descriptionSection'),
        media: t('mediaSection'),
        tags: t('tagSection'),
      }}
      tagLabels={(item.tags ?? []).map(tag => getTagLabelByLocale(tag, locale))}
      title={item.title}
      viewerLabels={{
        closeAriaLabel: imageViewerText('closeAriaLabel'),
        nextAriaLabel: imageViewerText('nextAriaLabel'),
        previousAriaLabel: imageViewerText('previousAriaLabel'),
        thumbnailListAriaLabel: imageViewerText('thumbnailListAriaLabel'),
        zoomInAriaLabel: imageViewerText('zoomInAriaLabel'),
        zoomOutAriaLabel: imageViewerText('zoomOutAriaLabel'),
      }}
    />
  );
};

import { getTranslations } from 'next-intl/server';

import type { Article } from '@/entities/article/model/types';
import { getTagLabelByLocale } from '@/entities/project/model/tag-map';
import { createImageViewerUrl } from '@/shared/lib/url/create-image-viewer-url';
import { normalizeImageUrl } from '@/shared/lib/url/normalize-image-url';
import { ArticleDetailPageClient } from '@/views/articles/ui/article-detail-page.client';

type ArticleDetailPageProps = {
  item: Article;
  locale: string;
};

/**
 * 아티클에 연결된 태그 목록을 locale에 맞는 라벨로 변환합니다.
 */
const getArticleTagLabels = (item: Article, locale: string) =>
  (item.tags ?? []).map(tag => getTagLabelByLocale(tag, locale));

/**
 * 아티클 상세 페이지 컨테이너입니다.
 */
export const ArticleDetailPage = async ({ item, locale }: ArticleDetailPageProps) => {
  const t = await getTranslations('ArticleDetail');
  const normalizedThumbnailUrl = normalizeImageUrl(item.thumbnail_url);
  const thumbnailSrc = normalizedThumbnailUrl ? createImageViewerUrl(normalizedThumbnailUrl) : null;
  const tagLabels = getArticleTagLabels(item, locale);
  const publishedDate = item.created_at.slice(0, 10);
  const updatedDate = item.updated_at?.slice(0, 10);

  return (
    <ArticleDetailPageClient
      content={item.content}
      description={item.description}
      emptyContentText={t('emptyContent')}
      emptySummaryText={t('emptySummary')}
      emptyThumbnailText={t('emptyThumbnail')}
      noTagsText={t('noTags')}
      publishedText={t('publishedAt', { date: publishedDate })}
      sectionLabels={{
        content: t('contentSection'),
        tagList: t('tagSection'),
        thumbnail: t('thumbnailSection'),
      }}
      tagLabels={tagLabels}
      thumbnailAlt={t('thumbnailAlt', { title: item.title })}
      thumbnailSrc={thumbnailSrc}
      title={item.title}
      updatedText={updatedDate ? t('updatedAt', { date: updatedDate }) : null}
    />
  );
};

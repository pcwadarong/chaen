import { getTranslations } from 'next-intl/server';

import type { Article, ArticleDetailListItem } from '@/entities/article/model/types';
import { getTagLabelByLocale } from '@/entities/project/model/tag-map';
import { ArticleDetailPageClient } from '@/views/articles/ui/article-detail-page.client';

type ArticleDetailPageProps = {
  archiveItems: ArticleDetailListItem[];
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
export const ArticleDetailPage = async ({ archiveItems, item, locale }: ArticleDetailPageProps) => {
  const t = await getTranslations('ArticleDetail');
  const detailUi = await getTranslations('DetailUi');
  const tagLabels = getArticleTagLabels(item, locale);
  const publishedDate = item.created_at.slice(0, 10);

  return (
    <ArticleDetailPageClient
      archiveItems={archiveItems}
      content={item.content}
      description={item.description}
      emptyArchiveText={detailUi('emptyArchive')}
      emptyContentText={t('emptyContent')}
      emptySummaryText={t('emptySummary')}
      id={item.id}
      locale={locale}
      noTagsText={t('noTags')}
      publishedText={t('publishedAt', { date: publishedDate })}
      sectionLabels={{
        archive: t('archiveLabel'),
        tagList: t('tagSection'),
      }}
      shareLabels={{
        copyFailed: detailUi('copyFailed'),
        copied: detailUi('shareCopied'),
        share: detailUi('share'),
        viewCount: detailUi('viewCount'),
      }}
      tagLabels={tagLabels}
      title={item.title}
      viewCount={Number(item.view_count ?? 0)}
    />
  );
};

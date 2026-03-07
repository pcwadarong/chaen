import { getTranslations } from 'next-intl/server';

import type { Article, ArticleDetailListItem } from '@/entities/article/model/types';
import { getTagLabelByLocale } from '@/entities/project/model/tag-map';
import { buildDetailArchiveLinkItems } from '@/shared/ui/detail-page/build-detail-archive-link-items';
import { DetailMetaBar } from '@/shared/ui/detail-page/detail-meta-bar';
import { DetailPageShell } from '@/shared/ui/detail-page/detail-page-shell';
import styles from '@/views/articles/ui/article-detail-page.module.css';

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
    <DetailPageShell
      content={item.content}
      emptyArchiveText={detailUi('emptyArchive')}
      emptyContentText={t('emptyContent')}
      guestbookCtaText={detailUi('leaveGuestbookMessage')}
      heroDescription={item.description ?? t('emptySummary')}
      metaBar={
        <DetailMetaBar
          copyFailedText={detailUi('copyFailed')}
          copiedText={detailUi('shareCopied')}
          locale={locale}
          primaryMetaText={t('publishedAt', { date: publishedDate })}
          shareText={detailUi('share')}
          viewCount={Number(item.view_count ?? 0)}
          viewCountLabel={detailUi('viewCount')}
          viewEndpoint={`/api/articles/${item.id}/views`}
        />
      }
      sidebarItems={buildDetailArchiveLinkItems({
        getHref: archiveItem => `/articles/${archiveItem.id}`,
        items: archiveItems,
        locale,
        selectedId: item.id,
      })}
      sidebarLabel={t('archiveLabel')}
      tagContent={
        <div aria-label={t('tagSection')} className={styles.tagList}>
          {tagLabels.length > 0 ? (
            tagLabels.map(tagLabel => (
              <button
                aria-disabled="true"
                className={styles.tagButton}
                key={tagLabel}
                type="button"
              >
                #{tagLabel}
              </button>
            ))
          ) : (
            <button aria-disabled="true" className={styles.tagButton} type="button">
              #{t('noTags')}
            </button>
          )}
        </div>
      }
      title={item.title}
    />
  );
};

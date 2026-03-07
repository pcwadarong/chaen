import { getTranslations } from 'next-intl/server';

import { getTagLabelByLocale } from '@/entities/project/model/tag-map';
import type { Project, ProjectDetailListItem } from '@/entities/project/model/types';
import { formatProjectPeriod } from '@/shared/lib/date/format-project-period';
import { buildDetailArchiveLinkItems } from '@/shared/ui/detail-page/build-detail-archive-link-items';
import { DetailMetaBar } from '@/shared/ui/detail-page/detail-meta-bar';
import { DetailPageShell } from '@/shared/ui/detail-page/detail-page-shell';
import styles from '@/views/project/ui/project-detail-page.module.css';

type ProjectDetailPageProps = {
  archiveItems: ProjectDetailListItem[];
  item: Project;
  locale: string;
};

/**
 * 프로젝트 상세 페이지 컨테이너입니다.
 */
export const ProjectDetailPage = async ({ archiveItems, item, locale }: ProjectDetailPageProps) => {
  const t = await getTranslations('ProjectDetail');
  const detailUi = await getTranslations('DetailUi');
  const periodText = formatProjectPeriod(item, locale, t('ongoing'));

  return (
    <DetailPageShell
      content={item.content}
      emptyArchiveText={detailUi('emptyArchive')}
      emptyContentText={t('emptyContent')}
      guestbookCtaText={detailUi('leaveGuestbookMessage')}
      heroDescription={item.description ?? t('emptySummary')}
      hideAppFrameFooter
      metaBar={
        <DetailMetaBar
          copyFailedText={detailUi('copyFailed')}
          copiedText={detailUi('shareCopied')}
          locale={locale}
          primaryMetaText={periodText}
          shareText={detailUi('share')}
        />
      }
      sidebarItems={buildDetailArchiveLinkItems({
        getHref: archiveItem => `/project/${archiveItem.id}`,
        items: archiveItems,
        locale,
        selectedId: item.id,
      })}
      sidebarLabel={t('archiveLabel')}
      tagContent={
        <p aria-label={t('tagSection')} className={styles.tagList}>
          {(item.tags ?? []).length > 0 ? (
            (item.tags ?? []).map(tag => (
              <span key={tag}># {getTagLabelByLocale(tag, locale)}</span>
            ))
          ) : (
            <span>{t('noTags')}</span>
          )}
        </p>
      }
      title={item.title}
    />
  );
};

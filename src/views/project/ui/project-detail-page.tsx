import { getTranslations } from 'next-intl/server';
import React from 'react';
import { css } from 'styled-system/css';

import type { Project, ProjectDetailListItem } from '@/entities/project/model/types';
import { getTagLabelMapBySlugs } from '@/entities/tag/api/query-tags';
import { formatProjectPeriod } from '@/shared/lib/date/format-project-period';
import { buildDetailArchiveLinkItems } from '@/shared/ui/detail-page/build-detail-archive-link-items';
import { DetailMetaBar } from '@/shared/ui/detail-page/detail-meta-bar';
import { DetailPageShell } from '@/shared/ui/detail-page/detail-page-shell';

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
  const tagLabelMap = await getTagLabelMapBySlugs({
    locale,
    slugs: item.tags ?? [],
  });

  if (tagLabelMap.schemaMissing) {
    throw new Error('[projects] 태그 label schema가 없습니다.');
  }

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
          primaryMetaScreenReaderText={`${t('periodLabel')} ${periodText}`}
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
        <div aria-label={t('tagSection')} className={tagListClass}>
          {(item.tags ?? []).length > 0 ? (
            (item.tags ?? []).map(tag => (
              <button aria-disabled="true" className={tagButtonClass} key={tag} type="button">
                #{tagLabelMap.data.get(tag) ?? tag}
              </button>
            ))
          ) : (
            <button aria-disabled="true" className={tagButtonClass} type="button">
              #{t('noTags')}
            </button>
          )}
        </div>
      }
      title={item.title}
    />
  );
};

const tagListClass = css({
  display: 'flex',
  flexWrap: 'wrap',
  justifyContent: 'center',
  alignItems: 'center',
  rowGap: '1',
  columnGap: '2',
  m: '0',
  color: 'muted',
  fontSize: 'xs',
  lineHeight: 'snug',
  '@media (min-width: 961px)': {
    columnGap: '3',
    fontSize: 'sm',
  },
});

const tagButtonClass = css({
  px: '3',
  py: '[0.35rem]',
  borderRadius: 'full',
  border: '[1px solid var(--colors-border)]',
  backgroundColor: 'surface',
  fontSize: '[inherit]',
  lineHeight: 'tight',
  color: 'muted',
});

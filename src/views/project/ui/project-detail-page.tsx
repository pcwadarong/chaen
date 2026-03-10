import { getTranslations } from 'next-intl/server';
import React from 'react';
import { css } from 'styled-system/css';

import { getProjectDetailArchivePageAction } from '@/entities/project/api/project-actions';
import type { Project, ProjectArchivePage } from '@/entities/project/model/types';
import { getTagLabelMapBySlugs } from '@/entities/tag/api/query-tags';
import type { AppLocale } from '@/i18n/routing';
import { formatProjectPeriod } from '@/shared/lib/date/format-project-period';
import { buildLocalizedPathname } from '@/shared/lib/seo/metadata';
import { buildBreadcrumbJsonLd, buildProjectJsonLd } from '@/shared/lib/seo/structured-data';
import { DetailArchiveFeed } from '@/shared/ui/detail-page/archive/feed';
import { DetailMetaBar } from '@/shared/ui/detail-page/detail-meta-bar';
import { DetailPageShell } from '@/shared/ui/detail-page/detail-page-shell';
import { JsonLd } from '@/shared/ui/seo/JsonLd';

type ProjectDetailPageProps = {
  archivePage: ProjectArchivePage;
  item: Project;
  locale: AppLocale;
};

/**
 * 프로젝트 상세 페이지 컨테이너입니다.
 */
export const ProjectDetailPage = async ({ archivePage, item, locale }: ProjectDetailPageProps) => {
  const t = await getTranslations('ProjectDetail');
  const projectT = await getTranslations('Project');
  const detailUi = await getTranslations('DetailUi');
  const navigationT = await getTranslations('Navigation');
  const periodText = formatProjectPeriod(item, locale, t('ongoing'));
  const tagLabelMap = await getTagLabelMapBySlugs({
    locale,
    slugs: item.tags ?? [],
  });

  if (tagLabelMap.schemaMissing) {
    throw new Error('[projects] 태그 label schema가 없습니다.');
  }

  const tagLabels = (item.tags ?? []).map(tag => tagLabelMap.data.get(tag) ?? tag);
  const projectPath = buildLocalizedPathname({
    locale,
    pathname: `/project/${item.id}`,
  });
  const structuredData = [
    buildBreadcrumbJsonLd([
      {
        name: navigationT('home'),
        path: buildLocalizedPathname({ locale }),
      },
      {
        name: navigationT('project'),
        path: buildLocalizedPathname({ locale, pathname: '/project' }),
      },
      {
        name: item.title,
        path: projectPath,
      },
    ]),
    buildProjectJsonLd({
      createdAt: item.created_at,
      description: item.description ?? t('emptySummary'),
      locale,
      path: projectPath,
      tags: tagLabels,
      thumbnailUrl: item.thumbnail_url,
      title: item.title,
    }),
  ];

  return (
    <>
      <JsonLd data={structuredData} />
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
        sidebarContent={
          <DetailArchiveFeed
            emptyText={detailUi('emptyArchive')}
            hrefBasePath="/project"
            initialPage={archivePage}
            loadErrorText={projectT('loadError')}
            loadPageAction={getProjectDetailArchivePageAction}
            loadMoreEndText={projectT('loadMoreEnd')}
            loadingText={projectT('loading')}
            locale={locale}
            retryText={projectT('retry')}
            selectedId={item.id}
          />
        }
        sidebarLabel={t('archiveLabel')}
        tagContent={
          tagLabels.length > 0 ? (
            <ul aria-label={t('tagSection')} className={tagListClass}>
              {tagLabels.map(tagLabel => (
                <li className={tagItemClass} key={tagLabel}>
                  <span className={tagButtonClass}>#{tagLabel}</span>
                </li>
              ))}
            </ul>
          ) : undefined
        }
        title={item.title}
      />
    </>
  );
};

const tagListClass = css({
  display: 'flex',
  flexWrap: 'wrap',
  justifyContent: 'center',
  alignItems: 'center',
  rowGap: '1',
  columnGap: '2',
  listStyle: 'none',
  p: '0',
  m: '0',
  color: 'muted',
  fontSize: 'xs',
  lineHeight: 'snug',
  '@media (min-width: 961px)': {
    columnGap: '3',
    fontSize: 'sm',
  },
});

const tagItemClass = css({
  display: 'block',
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

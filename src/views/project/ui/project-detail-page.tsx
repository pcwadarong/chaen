import { useTranslations } from 'next-intl';
import React, { Suspense } from 'react';
import { css } from 'styled-system/css';

import {
  deleteProjectAction,
  getProjectDetailArchivePageAction,
} from '@/entities/project/api/mutations/project-actions';
import type { Project, ProjectArchivePage } from '@/entities/project/model/types';
import type { AppLocale } from '@/i18n/routing';
import { resolvePublicContentPathSegment } from '@/shared/lib/content/public-content';
import { formatProjectPeriod } from '@/shared/lib/date/format-project-period';
import { buildLocalizedPathname } from '@/shared/lib/seo/metadata';
import { buildBreadcrumbJsonLd, buildProjectJsonLd } from '@/shared/lib/seo/structured-data';
import { AdminDetailActionsGate } from '@/shared/ui/detail-page/admin-detail-actions-gate';
import { DetailArchiveFeed } from '@/shared/ui/detail-page/archive/feed';
import { DetailMetaBar } from '@/shared/ui/detail-page/detail-meta-bar';
import {
  DetailArchiveSidebarSkeleton,
  DetailTagListSkeleton,
} from '@/shared/ui/detail-page/detail-page-section-skeletons';
import { DetailPageShell } from '@/shared/ui/detail-page/detail-page-shell';
import { JsonLd } from '@/shared/ui/seo/JsonLd';

type ProjectDetailPageProps = {
  archivePagePromise: Promise<ProjectArchivePage>;
  item: Project;
  locale: AppLocale;
  tagLabelsPromise: Promise<string[]>;
};

type ProjectArchiveSidebarProps = {
  archivePagePromise: Promise<ProjectArchivePage>;
  emptyText: string;
  loadErrorText: string;
  loadMoreEndText: string;
  loadingText: string;
  locale: AppLocale;
  retryText: string;
  selectedPathSegment: string;
};

type ProjectTagListProps = {
  ariaLabel: string;
  tagLabelsPromise: Promise<string[]>;
};

/**
 * 프로젝트 상세 좌측 아카이브를 비동기 경계 안에서 렌더링합니다.
 */
const ProjectArchiveSidebar = async ({
  archivePagePromise,
  emptyText,
  loadErrorText,
  loadMoreEndText,
  loadingText,
  locale,
  retryText,
  selectedPathSegment,
}: ProjectArchiveSidebarProps) => {
  const archivePage = await archivePagePromise;

  return (
    <DetailArchiveFeed
      emptyText={emptyText}
      hrefBasePath="/project"
      initialPage={archivePage}
      loadErrorText={loadErrorText}
      loadPageAction={getProjectDetailArchivePageAction}
      loadMoreEndText={loadMoreEndText}
      loadingText={loadingText}
      locale={locale}
      retryText={retryText}
      selectedPathSegment={selectedPathSegment}
    />
  );
};

/**
 * 프로젝트 상세 태그 목록을 비동기 경계 안에서 렌더링합니다.
 */
const ProjectTagList = async ({ ariaLabel, tagLabelsPromise }: ProjectTagListProps) => {
  const tagLabels = await tagLabelsPromise;

  if (tagLabels.length === 0) return null;

  return (
    <ul aria-label={ariaLabel} className={tagListClass}>
      {tagLabels.map(tagLabel => (
        <li className={tagItemClass} key={tagLabel}>
          <span className={tagButtonClass}>#{tagLabel}</span>
        </li>
      ))}
    </ul>
  );
};

/**
 * 프로젝트 상세 페이지 컨테이너입니다.
 */
export const ProjectDetailPage = ({
  archivePagePromise,
  item,
  locale,
  tagLabelsPromise,
}: ProjectDetailPageProps) => {
  const t = useTranslations('ProjectDetail');
  const projectT = useTranslations('Project');
  const detailUi = useTranslations('DetailUi');
  const navigationT = useTranslations('Navigation');

  if (!item.publish_at) {
    throw new Error(`[projects] 공개 프로젝트 publish_at이 없습니다. id=${item.id}`);
  }

  const periodText = formatProjectPeriod(item, locale, t('ongoing'));
  const projectPathSegment = resolvePublicContentPathSegment(item);
  const projectPath = buildLocalizedPathname({
    locale,
    pathname: `/project/${projectPathSegment}`,
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
      tags: item.tags ?? [],
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
        locale={locale}
        metaBar={
          <DetailMetaBar
            copyFailedText={detailUi('copyFailed')}
            copiedText={detailUi('shareCopied')}
            locale={locale}
            primaryMetaScreenReaderText={`${t('periodLabel')} ${periodText}`}
            primaryMetaText={periodText}
            shareText={detailUi('share')}
            actionSlot={
              <AdminDetailActionsGate
                deleteAction={deleteProjectAction.bind(null, {
                  locale,
                  projectId: item.id,
                  projectSlug: projectPathSegment,
                })}
                editHref={`/admin/projects/${item.id}/edit`}
              />
            }
          />
        }
        sidebarContent={
          <Suspense fallback={<DetailArchiveSidebarSkeleton />}>
            <ProjectArchiveSidebar
              archivePagePromise={archivePagePromise}
              emptyText={detailUi('emptyArchive')}
              loadErrorText={projectT('loadError')}
              loadMoreEndText={projectT('loadMoreEnd')}
              loadingText={projectT('loading')}
              locale={locale}
              retryText={projectT('retry')}
              selectedPathSegment={projectPathSegment}
            />
          </Suspense>
        }
        sidebarLabel={t('archiveLabel')}
        tagContent={
          (item.tags?.length ?? 0) > 0 ? (
            <Suspense fallback={<DetailTagListSkeleton />}>
              <ProjectTagList ariaLabel={t('tagSection')} tagLabelsPromise={tagLabelsPromise} />
            </Suspense>
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

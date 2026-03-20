import { useTranslations } from 'next-intl';
import React, { Suspense } from 'react';
import { css } from 'styled-system/css';

import type { Project, ProjectArchivePage } from '@/entities/project/model/types';
import { getProjectDetailArchivePageAction } from '@/features/browse-project-archive/api/get-project-archive-page';
import { deleteProjectAction } from '@/features/manage-project/api/delete-project';
import type { AppLocale } from '@/i18n/routing';
import { resolvePublicContentPathSegment } from '@/shared/lib/content/public-content';
import { formatProjectPeriod } from '@/shared/lib/date/format-project-period';
import { buildLocalizedPathname } from '@/shared/lib/seo/metadata';
import { buildBreadcrumbJsonLd, buildProjectJsonLd } from '@/shared/lib/seo/structured-data';
import { JsonLd } from '@/shared/ui/seo/JsonLd';
import { DetailArchiveFeed } from '@/widgets/detail-page/archive/feed';
import { AdminDetailActionsGate } from '@/widgets/detail-page/ui/admin-detail-actions-gate';
import { DetailMetaBar } from '@/widgets/detail-page/ui/detail-meta-bar';
import { DetailTagListSkeleton } from '@/widgets/detail-page/ui/detail-page-section-skeletons';
import { DetailPageShell } from '@/widgets/detail-page/ui/detail-page-shell';

type ProjectDetailPageProps = {
  initialArchivePage: ProjectArchivePage;
  item: Project;
  locale: AppLocale;
  tagLabelsPromise: Promise<string[]>;
};

type ProjectArchiveSidebarProps = {
  currentItem: Project;
  emptyText: string;
  initialPage: ProjectArchivePage;
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
 * 프로젝트 상세 좌측 아카이브 블록을 렌더링합니다.
 *
 * @param props 현재 프로젝트를 포함해 좌측 아카이브가 유지해야 하는 링크 정보와
 * 로딩/오류 문구를 전달합니다.
 * @param props.currentItem 현재 보고 있는 프로젝트입니다.
 * @param props.emptyText 아카이브가 비어 있을 때 출력할 문구입니다.
 * @param props.initialPage 현재 프로젝트를 포함한 초기 아카이브 slice입니다.
 * @param props.loadErrorText 아카이브 첫 페이지 또는 추가 로드 실패 시 보여줄 문구입니다.
 * @param props.loadMoreEndText 더 이상 불러올 항목이 없을 때 스크린리더에 알릴 문구입니다.
 * @param props.loadingText 추가 로드 중 상태 문구입니다.
 * @param props.locale 연도 표기와 archive page action에 전달할 locale입니다.
 * @param props.retryText bootstrap 또는 추가 로드 실패 후 다시 시도 버튼에 사용할 문구입니다.
 * @param props.selectedPathSegment 현재 상세 경로의 slug 또는 id입니다.
 * @returns 현재 프로젝트 주변 문맥을 포함한 좌측 아카이브 피드 React 노드를 반환합니다.
 */
const ProjectArchiveSidebar = ({
  currentItem,
  emptyText,
  initialPage,
  loadErrorText,
  loadMoreEndText,
  loadingText,
  locale,
  retryText,
  selectedPathSegment,
}: ProjectArchiveSidebarProps) => (
  <DetailArchiveFeed
    activeItemViewportOffsetRatio={0.25}
    currentItem={currentItem}
    emptyText={emptyText}
    hrefBasePath="/project"
    initialPage={initialPage}
    loadErrorText={loadErrorText}
    loadPageAction={getProjectDetailArchivePageAction}
    loadMoreEndText={loadMoreEndText}
    loadingText={loadingText}
    locale={locale}
    pinCurrentItemToTop={false}
    retryText={retryText}
    selectedPathSegment={selectedPathSegment}
  />
);

/**
 * 프로젝트 상세 태그 목록을 렌더링합니다.
 *
 * @param props 태그 aria label과 비동기 태그 label promise를 전달합니다.
 * @param props.ariaLabel 태그 목록을 설명하는 접근성 레이블입니다.
 * @param props.tagLabelsPromise locale fallback이 반영된 태그 label promise입니다.
 * @returns 태그가 없으면 `null`, 있으면 태그 pill 목록 React 노드를 반환합니다.
 *
 * @throws `tagLabelsPromise`가 reject되면 상위 `Suspense`/error 경계가 이를 처리합니다.
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
 * 프로젝트 상세 페이지의 본문/메타/좌측 아카이브 조합을 렌더링합니다.
 *
 * @param props 상세 본문 shell에 필요한 프로젝트 데이터와 locale, 태그 label promise를 전달합니다.
 * @param props.item 현재 상세에 표시할 프로젝트 본문 데이터입니다.
 * @param props.locale 날짜/경로/번역 문자열 생성에 사용할 locale입니다.
 * @param props.tagLabelsPromise 태그 label을 비동기로 읽어오는 promise입니다.
 * @returns 프로젝트 상세 전체 React 노드를 반환합니다.
 *
 * @throws 공개 프로젝트인데 `publish_at`이 비어 있으면 상세 계약 위반으로 예외를 던집니다.
 *
 * @remarks
 * 좌측 아카이브는 현재 프로젝트를 포함한 초기 window를 서버에서 미리 받아, 최신 목록
 * 첫 페이지로 점프하지 않고 현재 문맥부터 렌더링합니다.
 */
export const ProjectDetailPage = ({
  initialArchivePage,
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
          <ProjectArchiveSidebar
            currentItem={item}
            emptyText={detailUi('emptyArchive')}
            initialPage={initialArchivePage}
            loadErrorText={projectT('loadError')}
            loadMoreEndText={projectT('loadMoreEnd')}
            loadingText={projectT('loading')}
            locale={locale}
            retryText={projectT('retry')}
            selectedPathSegment={projectPathSegment}
          />
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

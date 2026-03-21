import { useTranslations } from 'next-intl';
import React from 'react';
import { css } from 'styled-system/css';

import {
  getProjectDisplayMeta,
  type ProjectTechStackGroup,
} from '@/entities/project/model/get-project-display-meta';
import type { Project, ProjectArchivePage } from '@/entities/project/model/types';
import {
  TECH_STACK_CATEGORY_ORDER,
  type TechStackCategory,
} from '@/entities/tech-stack/model/types';
import { getProjectDetailArchivePageAction } from '@/features/browse-project-archive/api/get-project-archive-page';
import { deleteProjectAction } from '@/features/manage-project/api/delete-project';
import type { AppLocale } from '@/i18n/routing';
import { resolvePublicContentPathSegment } from '@/shared/lib/content/public-content';
import { buildLocalizedPathname } from '@/shared/lib/seo/metadata';
import { buildBreadcrumbJsonLd, buildProjectJsonLd } from '@/shared/lib/seo/structured-data';
import { GithubIcon, GlobeIcon } from '@/shared/ui/icons/app-icons';
import { JsonLd } from '@/shared/ui/seo/JsonLd';
import { srOnlyClass } from '@/shared/ui/styles/sr-only-style';
import { DetailArchiveFeed } from '@/widgets/detail-page/archive/feed';
import { AdminDetailActionsGate } from '@/widgets/detail-page/ui/admin-detail-actions-gate';
import { DetailMetaBar } from '@/widgets/detail-page/ui/detail-meta-bar';
import { DetailPageShell } from '@/widgets/detail-page/ui/detail-page-shell';

type ProjectDetailPageProps = {
  initialArchivePage: ProjectArchivePage;
  item: Project;
  locale: AppLocale;
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

type ProjectTechStackListProps = {
  ariaLabel: string;
  groups: ProjectTechStackGroup[];
};

type ProjectExternalLinkListProps = {
  githubUrl?: string | null;
  websiteUrl?: string | null;
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
 * 프로젝트 상세 기술 스택 목록을 카테고리별 행으로 렌더링합니다.
 */
const ProjectTechStackList = ({ ariaLabel, groups }: ProjectTechStackListProps) => {
  if (groups.length === 0) return null;

  return (
    <dl aria-label={ariaLabel} className={techStackListClass}>
      {groups.map(group => (
        <div className={techStackRowClass} key={group.category}>
          <dt className={techStackCategoryClass}>{group.label}</dt>
          <dd className={techStackItemsClass}>
            {group.items.map(techStack => (
              <span className={techStackNameClass} key={techStack.id}>
                {techStack.name}
              </span>
            ))}
          </dd>
        </div>
      ))}
    </dl>
  );
};

/**
 * 프로젝트 상세 헤더 우측 외부 링크 아이콘 묶음을 렌더링합니다.
 */
const ProjectExternalLinkList = ({ githubUrl, websiteUrl }: ProjectExternalLinkListProps) => {
  const linkItems = [
    websiteUrl
      ? {
          href: websiteUrl,
          icon: GlobeIcon,
          key: 'website',
          label: 'Website',
        }
      : null,
    githubUrl
      ? {
          href: githubUrl,
          icon: GithubIcon,
          key: 'github',
          label: 'GitHub',
        }
      : null,
  ].filter(item => item !== null);

  if (linkItems.length === 0) return null;

  return (
    <div className={externalLinkWrapClass}>
      {linkItems.map(item => (
        <a
          className={externalLinkClass}
          href={item.href}
          key={item.key}
          rel="noreferrer noopener"
          target="_blank"
        >
          <item.icon aria-hidden="true" size="md" />
          <span className={srOnlyClass}>{item.label}</span>
        </a>
      ))}
    </div>
  );
};

/**
 * 프로젝트 상세 페이지의 본문/메타/좌측 아카이브 조합을 렌더링합니다.
 */
export const ProjectDetailPage = ({ initialArchivePage, item, locale }: ProjectDetailPageProps) => {
  const t = useTranslations('ProjectDetail');
  const projectT = useTranslations('Project');
  const detailUi = useTranslations('DetailUi');
  const navigationT = useTranslations('Navigation');
  const techStackT = useTranslations('TechStack.category');

  if (!item.publish_at) {
    throw new Error(`[projects] 공개 프로젝트 publish_at이 없습니다. id=${item.id}`);
  }

  const techStackCategoryLabels = TECH_STACK_CATEGORY_ORDER.reduce(
    (labels, category) => ({
      ...labels,
      [category]: techStackT(category),
    }),
    {} as Record<TechStackCategory, string>,
  );
  const { periodText, techStackGroups } = getProjectDisplayMeta({
    categoryLabels: techStackCategoryLabels,
    item,
    locale,
    ongoingLabel: t('ongoing'),
  });
  const projectTagLabels = (item.tech_stacks ?? []).map(techStack => techStack.name);
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
      tags: projectTagLabels,
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
        heroTitleAccessory={
          <ProjectExternalLinkList githubUrl={item.github_url} websiteUrl={item.website_url} />
        }
        hideAppFrameFooter
        locale={locale}
        metaBar={
          <DetailMetaBar
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
            copyFailedText={detailUi('copyFailed')}
            copiedText={detailUi('shareCopied')}
            locale={locale}
            primaryMetaScreenReaderText={`${t('periodLabel')} ${periodText}`}
            primaryMetaText={periodText}
            shareText={detailUi('share')}
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
          techStackGroups.length > 0 ? (
            <ProjectTechStackList ariaLabel={t('tagSection')} groups={techStackGroups} />
          ) : undefined
        }
        title={item.title}
      />
    </>
  );
};

const techStackListClass = css({
  display: 'grid',
  gap: '2',
  width: 'full',
  mx: 'auto',
  px: '4',
});

const externalLinkWrapClass = css({
  display: 'flex',
  flexWrap: 'wrap',
  gap: '2',
  alignItems: 'center',
});

const externalLinkClass = css({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: 'primary',
  transition: 'colors',
  _hover: {
    color: 'text',
  },
  _focusVisible: {
    outline: '[2px solid var(--colors-focus-ring)]',
    outlineOffset: '[2px]',
  },
});

const techStackRowClass = css({
  display: 'grid',
  gridTemplateColumns: '[3rem 1fr]',
  gap: '3',
  alignItems: 'start',
  textAlign: 'left',
});

const techStackCategoryClass = css({
  color: 'muted',
  fontSize: 'xs',
  fontWeight: 'semibold',
  lineHeight: 'snug',
  textTransform: 'uppercase',
});

const techStackItemsClass = css({
  display: 'flex',
  flexWrap: 'wrap',
  gap: '2',
  margin: '0',
});

const techStackNameClass = css({
  color: 'text',
  fontSize: 'sm',
  lineHeight: 'snug',
});

'use client';

import React from 'react';
import { css, cva } from 'styled-system/css';

import type { AdminArticleListItem } from '@/entities/article/model/types';
import type { AdminProjectListItem } from '@/entities/project/model/types';
import { Link } from '@/i18n/navigation';
import { resolvePublicContentPathSegment } from '@/shared/lib/content/public-content';
import { AdminTable } from '@/shared/ui/admin-table';
import { Button } from '@/shared/ui/button/button';
import { ArrowUpIcon, EditIcon, LockIcon, LockOpenIcon } from '@/shared/ui/icons/app-icons';
import { AdminConsoleShell } from '@/widgets/admin-console';

type ContentTab = 'articles' | 'projects';
type VisibilityValue = 'private' | 'public';

type AdminContentPageProps = {
  articles: AdminArticleListItem[];
  locale?: string;
  onSaveProjectOrder?: (orderedProjectIds: string[]) => Promise<void>;
  onToggleArticleVisibility?: (input: {
    articleId: string;
    articleSlug?: string;
    visibility: VisibilityValue;
  }) => Promise<void>;
  onToggleProjectVisibility?: (input: {
    projectId: string;
    projectSlug?: string;
    visibility: VisibilityValue;
  }) => Promise<void>;
  projects: AdminProjectListItem[];
};

type VisibilitySwitchProps = {
  onChange: (value: VisibilityValue) => void;
  pending?: boolean;
  value: VisibilityValue;
};

/**
 * 관리자 리스트에서 공개/비공개 상태를 즉시 전환하는 segmented toggle입니다.
 */
const VisibilitySwitch = ({ onChange, pending = false, value }: VisibilitySwitchProps) => (
  <div aria-label="공개 상태" className={visibilitySwitchGroupClass} role="group">
    <button
      aria-pressed={value === 'public'}
      className={visibilitySwitchButtonClass({ active: value === 'public' })}
      disabled={pending}
      onClick={() => onChange('public')}
      type="button"
    >
      <LockOpenIcon aria-hidden color="current" size="sm" />
      <span className={mobileActionLabelClass}>공개</span>
    </button>
    <button
      aria-pressed={value === 'private'}
      className={visibilitySwitchButtonClass({ active: value === 'private' })}
      disabled={pending}
      onClick={() => onChange('private')}
      type="button"
    >
      <LockIcon aria-hidden color="current" size="sm" />
      <span className={mobileActionLabelClass}>비공개</span>
    </button>
  </div>
);

/**
 * ISO 날짜 문자열을 관리자 리스트용 짧은 날짜로 정리합니다.
 */
const formatDate = (value?: string | null) => {
  if (!value) return '-';

  return value.slice(0, 10);
};

/**
 * 관리자 콘텐츠 화면에서 아티클/프로젝트 탭과 프로젝트 정렬 모드를 제공합니다.
 */
export const AdminContentPage = ({
  articles,
  locale = 'ko',
  onSaveProjectOrder,
  onToggleArticleVisibility,
  onToggleProjectVisibility,
  projects,
}: AdminContentPageProps) => {
  const [activeTab, setActiveTab] = React.useState<ContentTab>('projects');
  const [articleItems, setArticleItems] = React.useState(articles);
  const [articlePendingId, setArticlePendingId] = React.useState<string | null>(null);
  const [isOrdering, setIsOrdering] = React.useState(false);
  const [isSavingOrder, setIsSavingOrder] = React.useState(false);
  const [orderedProjects, setOrderedProjects] = React.useState(projects);
  const [projectPendingId, setProjectPendingId] = React.useState<string | null>(null);

  React.useEffect(() => {
    setArticleItems(articles);
  }, [articles]);

  React.useEffect(() => {
    setOrderedProjects(projects);
  }, [projects]);

  /**
   * 프로젝트 정렬 모드에서 선택한 항목을 한 칸 위/아래로 이동합니다.
   */
  const moveProject = React.useCallback((projectId: string, direction: 'down' | 'up') => {
    setOrderedProjects(currentProjects => {
      const currentIndex = currentProjects.findIndex(project => project.id === projectId);
      if (currentIndex < 0) return currentProjects;

      const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
      if (targetIndex < 0 || targetIndex >= currentProjects.length) {
        return currentProjects;
      }

      const nextProjects = [...currentProjects];
      const [targetProject] = nextProjects.splice(currentIndex, 1);
      nextProjects.splice(targetIndex, 0, targetProject);

      return nextProjects;
    });
  }, []);

  /**
   * 현재 정렬 상태를 서버 액션에 반영하고 정렬 모드를 종료합니다.
   */
  const handleSaveProjectOrder = React.useCallback(async () => {
    if (!onSaveProjectOrder) return;

    setIsSavingOrder(true);

    try {
      await onSaveProjectOrder(orderedProjects.map(project => project.id));
      setIsOrdering(false);
    } finally {
      setIsSavingOrder(false);
    }
  }, [onSaveProjectOrder, orderedProjects]);

  /**
   * 아티클 공개 상태를 낙관적으로 전환한 뒤 실패 시 원래 값으로 되돌립니다.
   */
  const handleArticleVisibilityChange = React.useCallback(
    async (article: AdminArticleListItem, visibility: VisibilityValue) => {
      if (!onToggleArticleVisibility || article.visibility === visibility) {
        return;
      }

      setArticlePendingId(article.id);
      setArticleItems(currentItems =>
        currentItems.map(currentItem =>
          currentItem.id === article.id ? { ...currentItem, visibility } : currentItem,
        ),
      );

      try {
        await onToggleArticleVisibility({
          articleId: article.id,
          articleSlug: article.slug ?? undefined,
          visibility,
        });
      } catch {
        setArticleItems(currentItems =>
          currentItems.map(currentItem =>
            currentItem.id === article.id
              ? {
                  ...currentItem,
                  visibility: article.visibility,
                }
              : currentItem,
          ),
        );
      } finally {
        setArticlePendingId(currentId => (currentId === article.id ? null : currentId));
      }
    },
    [onToggleArticleVisibility],
  );

  /**
   * 프로젝트 공개 상태를 낙관적으로 전환한 뒤 실패 시 원래 값으로 되돌립니다.
   */
  const handleProjectVisibilityChange = React.useCallback(
    async (project: AdminProjectListItem, visibility: VisibilityValue) => {
      if (!onToggleProjectVisibility || project.visibility === visibility) {
        return;
      }

      setProjectPendingId(project.id);
      setOrderedProjects(currentItems =>
        currentItems.map(currentItem =>
          currentItem.id === project.id ? { ...currentItem, visibility } : currentItem,
        ),
      );

      try {
        await onToggleProjectVisibility({
          projectId: project.id,
          projectSlug: project.slug ?? undefined,
          visibility,
        });
      } catch {
        setOrderedProjects(currentItems =>
          currentItems.map(currentItem =>
            currentItem.id === project.id
              ? {
                  ...currentItem,
                  visibility: project.visibility,
                }
              : currentItem,
          ),
        );
      } finally {
        setProjectPendingId(currentId => (currentId === project.id ? null : currentId));
      }
    },
    [onToggleProjectVisibility],
  );

  return (
    <AdminConsoleShell
      action={
        <div className={headerActionGroupClass}>
          <Button asChild tone="primary" variant="solid">
            <Link href="/admin/articles/new">새 아티클</Link>
          </Button>
          <Button asChild className={secondaryActionButtonClass} tone="white" variant="solid">
            <Link href="/admin/projects/new">새 프로젝트</Link>
          </Button>
        </div>
      }
      activeSection="content"
      locale={locale}
      title="Content"
    >
      <div className={toolbarClass}>
        <div aria-label="콘텐츠 유형" className={tabsToolbarClass} role="tablist">
          <button
            aria-selected={activeTab === 'articles'}
            className={contentTabClass({ active: activeTab === 'articles' })}
            onClick={() => {
              setActiveTab('articles');
              setIsOrdering(false);
            }}
            role="tab"
            type="button"
          >
            Articles
          </button>
          <button
            aria-selected={activeTab === 'projects'}
            className={contentTabClass({ active: activeTab === 'projects' })}
            onClick={() => setActiveTab('projects')}
            role="tab"
            type="button"
          >
            Projects
          </button>
        </div>

        {activeTab === 'projects' ? (
          isOrdering ? (
            <div className={orderingActionRowClass}>
              <Button
                disabled={isSavingOrder}
                onClick={handleSaveProjectOrder}
                tone="primary"
                variant="solid"
              >
                저장
              </Button>
              <Button
                disabled={isSavingOrder}
                onClick={() => {
                  setOrderedProjects(projects);
                  setIsOrdering(false);
                }}
                tone="white"
                variant="ghost"
              >
                취소
              </Button>
            </div>
          ) : (
            <Button onClick={() => setIsOrdering(true)} tone="white" variant="ghost">
              정렬 모드
            </Button>
          )
        ) : null}
      </div>

      {activeTab === 'articles' ? (
        <AdminTable>
          <thead>
            <tr>
              <th>Order</th>
              <th>제목</th>
              <th>상태</th>
              <th aria-label="동작" />
            </tr>
          </thead>
          <tbody>
            {articleItems.map((article, index) => (
              <tr key={article.id}>
                <td className={orderCellClass}>{index + 1}</td>
                <td>
                  <div className={titleMetaCellClass}>
                    {article.slug ? (
                      <Link
                        className={titleLinkClass}
                        href={`/articles/${resolvePublicContentPathSegment(article)}`}
                      >
                        {article.title}
                      </Link>
                    ) : (
                      <strong className={primaryLabelClass}>{article.title}</strong>
                    )}
                    <div className={subMetaLineClass}>
                      <span>{formatDate(article.publish_at)}</span>
                      <span>조회수 {article.view_count ?? 0}</span>
                    </div>
                  </div>
                </td>
                <td className={statusCellClass}>
                  <VisibilitySwitch
                    onChange={value => handleArticleVisibilityChange(article, value)}
                    pending={articlePendingId === article.id}
                    value={article.visibility === 'private' ? 'private' : 'public'}
                  />
                </td>
                <td className={actionCellClass}>
                  <Button asChild size="sm" tone="primary" variant="solid">
                    <Link href={`/admin/articles/${article.id}/edit`}>
                      <span className={actionButtonContentClass}>
                        <EditIcon aria-hidden color="current" size="sm" />
                        <span className={mobileActionLabelClass}>수정</span>
                      </span>
                    </Link>
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </AdminTable>
      ) : isOrdering ? (
        <ol className={reorderListClass}>
          {orderedProjects.map((project, index) => (
            <li className={reorderItemClass} key={project.id}>
              <div className={reorderMetaClass}>
                <strong className={primaryLabelClass}>{project.title}</strong>
                <div className={subMetaLineClass}>
                  <span>{formatDate(project.publish_at)}</span>
                  <span>순서 {index + 1}</span>
                  <span>{project.visibility === 'public' ? '공개' : '비공개'}</span>
                </div>
              </div>
              <div className={reorderButtonRowClass}>
                <Button
                  aria-label={`${project.title} 위로 이동`}
                  className={iconButtonClass}
                  disabled={index === 0 || isSavingOrder}
                  onClick={() => moveProject(project.id, 'up')}
                  size="sm"
                  tone="white"
                  variant="ghost"
                >
                  <ArrowUpIcon aria-hidden color="current" size="sm" />
                </Button>
                <Button
                  aria-label={`${project.title} 아래로 이동`}
                  className={iconButtonClass}
                  disabled={index === orderedProjects.length - 1 || isSavingOrder}
                  onClick={() => moveProject(project.id, 'down')}
                  size="sm"
                  tone="white"
                  variant="ghost"
                >
                  <ArrowUpIcon
                    aria-hidden
                    color="current"
                    size="sm"
                    style={{ transform: 'rotate(180deg)' }}
                  />
                </Button>
              </div>
            </li>
          ))}
        </ol>
      ) : (
        <AdminTable>
          <thead>
            <tr>
              <th>Order</th>
              <th>제목</th>
              <th>상태</th>
              <th aria-label="동작" />
            </tr>
          </thead>
          <tbody>
            {orderedProjects.map((project, index) => (
              <tr key={project.id}>
                <td className={orderCellClass}>{project.display_order ?? index + 1}</td>
                <td>
                  <div className={titleMetaCellClass}>
                    {project.slug ? (
                      <Link
                        className={titleLinkClass}
                        href={`/project/${resolvePublicContentPathSegment(project)}`}
                      >
                        {project.title}
                      </Link>
                    ) : (
                      <strong className={primaryLabelClass}>{project.title}</strong>
                    )}
                    <div className={subMetaLineClass}>
                      <span>{formatDate(project.publish_at)}</span>
                    </div>
                  </div>
                </td>
                <td className={statusCellClass}>
                  <VisibilitySwitch
                    onChange={value => handleProjectVisibilityChange(project, value)}
                    pending={projectPendingId === project.id}
                    value={project.visibility === 'private' ? 'private' : 'public'}
                  />
                </td>
                <td className={actionCellClass}>
                  <Button asChild size="sm" tone="primary" variant="solid">
                    <Link href={`/admin/projects/${project.id}/edit`}>
                      <span className={actionButtonContentClass}>
                        <EditIcon aria-hidden color="current" size="sm" />
                        <span className={mobileActionLabelClass}>수정</span>
                      </span>
                    </Link>
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </AdminTable>
      )}
    </AdminConsoleShell>
  );
};

const toolbarClass = css({
  display: 'flex',
  flexWrap: 'wrap',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: '3',
});

const headerActionGroupClass = css({
  display: 'inline-flex',
  alignItems: 'center',
  gap: '2',
  flexWrap: 'wrap',
  justifyContent: 'flex-end',
});

const secondaryActionButtonClass = css({
  borderColor: 'border',
  background: 'surface',
});

const tabsToolbarClass = css({
  display: 'inline-flex',
  width: '[fit-content]',
  padding: '[0.1875rem]',
  borderRadius: 'full',
  border: '[1px solid var(--colors-border)]',
  background: 'surfaceMuted',
});

const contentTabClass = cva({
  base: {
    minHeight: '9',
    px: '4',
    borderRadius: 'full',
    transition: 'common',
    color: 'muted',
    _focusVisible: {
      outline: '[2px solid var(--colors-focus-ring)]',
      outlineOffset: '[2px]',
    },
  },
  variants: {
    active: {
      true: {
        background: 'surface',
        color: 'text',
        fontWeight: 'semibold',
      },
      false: {
        _hover: {
          color: 'text',
        },
      },
    },
  },
});

const titleMetaCellClass = css({
  display: 'grid',
  gap: '1',
  minWidth: '0',
});

const primaryLabelClass = css({
  display: 'block',
  fontSize: 'sm',
  lineClamp: '2',
});

const titleLinkClass = css({
  display: 'block',
  fontSize: 'sm',
  fontWeight: 'semibold',
  lineClamp: '2',
  textDecoration: 'none',
  _hover: {
    textDecoration: 'underline',
    textUnderlineOffset: '[0.18em]',
  },
});

const subMetaLineClass = css({
  display: 'flex',
  flexWrap: 'wrap',
  gap: '3',
  color: 'muted',
  fontSize: 'xs',
});

const orderCellClass = css({
  width: { base: '8', md: '14', lg: '20' },
  whiteSpace: 'nowrap',
  color: 'muted',
  fontSize: 'xs',
});

const statusCellClass = css({
  width: { base: '10', md: '28', lg: '56' },
  textAlign: 'right',
  whiteSpace: 'nowrap',
});

const visibilitySwitchGroupClass = css({
  display: 'inline-flex',
  gap: '1',
  padding: '[0.1875rem]',
  borderRadius: 'full',
  border: '[1px solid var(--colors-border)]',
  background: 'surfaceMuted',
});

const visibilitySwitchButtonClass = cva({
  base: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '1.5',
    minHeight: '8',
    px: { base: '1.5', md: '3' },
    borderRadius: 'full',
    fontSize: 'xs',
    color: 'muted',
    transition: 'common',
    _disabled: {
      opacity: '0.5',
      cursor: 'not-allowed',
    },
  },
  variants: {
    active: {
      true: {
        background: 'surface',
        color: 'text',
        fontWeight: 'semibold',
      },
      false: {
        _hover: {
          color: 'text',
        },
      },
    },
  },
});

const actionCellClass = css({
  width: { base: '10', md: '20', lg: '28' },
  textAlign: 'right',
  whiteSpace: 'nowrap',
});

const actionButtonContentClass = css({
  display: 'inline-flex',
  alignItems: 'center',
  gap: '1.5',
});

const mobileActionLabelClass = css({
  display: { base: 'none', md: 'inline' },
});

const orderingActionRowClass = css({
  display: 'flex',
  gap: '2',
  flexWrap: 'wrap',
});

const reorderListClass = css({
  listStyle: 'none',
  margin: '0',
  padding: '0',
  display: 'grid',
  gap: '2',
});

const reorderItemClass = css({
  display: 'flex',
  justifyContent: 'space-between',
  gap: '3',
  alignItems: 'center',
  padding: '3',
  borderRadius: '2xl',
  border: '[1px solid var(--colors-border)]',
  background: 'surface',
});

const reorderMetaClass = css({
  display: 'grid',
  gap: '1',
  minWidth: '0',
});

const reorderButtonRowClass = css({
  display: 'inline-flex',
  gap: '1',
});

const iconButtonClass = css({
  minWidth: '9',
  paddingX: '0',
});

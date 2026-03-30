'use client';

import React from 'react';

import type { AdminArticleListItem } from '@/entities/article/model/types';
import type { AdminProjectListItem } from '@/entities/project/model/types';
import type {
  AdminContentPageProps,
  ContentTab,
  VisibilityValue,
} from '@/views/admin-content/ui/admin-content-page.types';

type UseAdminContentPageStateParams = Pick<
  AdminContentPageProps,
  | 'articles'
  | 'onSaveProjectOrder'
  | 'onToggleArticleVisibility'
  | 'onToggleProjectVisibility'
  | 'projects'
>;

/**
 * 아티클 리스트가 같은 순서와 핵심 표시값을 유지하는지 얕게 비교합니다.
 */
const areArticleItemsEqual = (left: AdminArticleListItem[], right: AdminArticleListItem[]) =>
  left.length === right.length &&
  left.every((item, index) => {
    const target = right[index];

    return (
      item.id === target?.id &&
      item.slug === target.slug &&
      item.title === target.title &&
      item.visibility === target.visibility &&
      item.publish_at === target.publish_at &&
      item.view_count === target.view_count
    );
  });

/**
 * 프로젝트 리스트가 같은 순서와 핵심 표시값을 유지하는지 얕게 비교합니다.
 */
const areProjectItemsEqual = (left: AdminProjectListItem[], right: AdminProjectListItem[]) =>
  left.length === right.length &&
  left.every((item, index) => {
    const target = right[index];

    return (
      item.id === target?.id &&
      item.slug === target.slug &&
      item.title === target.title &&
      item.visibility === target.visibility &&
      item.publish_at === target.publish_at &&
      item.display_order === target.display_order
    );
  });

/**
 * 관리자 콘텐츠 화면의 탭, 프로젝트 정렬, 공개 상태 변경을 한 곳에서 관리합니다.
 */
export const useAdminContentPageState = ({
  articles,
  onSaveProjectOrder,
  onToggleArticleVisibility,
  onToggleProjectVisibility,
  projects,
}: UseAdminContentPageStateParams) => {
  const [activeTab, setActiveTab] = React.useState<ContentTab>('projects');
  const [articleItems, setArticleItems] = React.useState(articles);
  const [articlePendingId, setArticlePendingId] = React.useState<string | null>(null);
  const [isOrdering, setIsOrdering] = React.useState(false);
  const [isSavingOrder, setIsSavingOrder] = React.useState(false);
  const [orderedProjects, setOrderedProjects] = React.useState(projects);
  const [projectPendingId, setProjectPendingId] = React.useState<string | null>(null);

  React.useEffect(() => {
    setArticleItems(currentItems =>
      areArticleItemsEqual(currentItems, articles) ? currentItems : articles,
    );
  }, [articles]);

  React.useEffect(() => {
    setOrderedProjects(currentItems =>
      areProjectItemsEqual(currentItems, projects) ? currentItems : projects,
    );
  }, [projects]);

  /**
   * 탭 전환 시 프로젝트 정렬 모드를 필요한 경우 함께 초기화합니다.
   */
  const handleTabChange = React.useCallback((tab: ContentTab) => {
    setActiveTab(tab);

    if (tab === 'articles') {
      setIsOrdering(false);
    }
  }, []);

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
   * 프로젝트 정렬 상태를 초기 프로젝트 목록으로 되돌리고 정렬 모드를 닫습니다.
   */
  const handleCancelOrdering = React.useCallback(() => {
    setOrderedProjects(projects);
    setIsOrdering(false);
  }, [projects]);

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

  return {
    activeTab,
    articleItems,
    articlePendingId,
    handleArticleVisibilityChange,
    handleCancelOrdering,
    handleProjectVisibilityChange,
    handleSaveProjectOrder,
    handleTabChange,
    isOrdering,
    isSavingOrder,
    orderedProjects,
    projectPendingId,
    setIsOrdering,
    moveProject,
  };
};

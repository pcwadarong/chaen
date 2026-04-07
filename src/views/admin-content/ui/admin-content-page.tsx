'use client';

import React from 'react';
import { css } from 'styled-system/css';

import { useAdminContentPageState } from '@/views/admin-content/model/use-admin-content-page-state';
import {
  AdminArticleTable,
  AdminContentHeaderAction,
  AdminContentTabs,
  AdminProjectOrderingList,
  AdminProjectTable,
} from '@/views/admin-content/ui/admin-content-blocks';
import type { AdminContentPageProps } from '@/views/admin-content/ui/admin-content-page.types';
import { AdminConsoleShell } from '@/widgets/admin-console';

/**
 * 관리자 콘텐츠 화면에서 탭, 정렬, 상태 변경 블록을 조립합니다.
 */
export const AdminContentPage = ({
  articles,
  onSaveProjectOrder,
  onToggleArticleVisibility,
  onToggleProjectVisibility,
  projects,
  signOutRedirectPath = '/admin/login',
}: AdminContentPageProps) => {
  const {
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
    moveProject,
    orderedProjects,
    projectPendingId,
    setIsOrdering,
  } = useAdminContentPageState({
    articles,
    onSaveProjectOrder,
    onToggleArticleVisibility,
    onToggleProjectVisibility,
    projects,
  });

  return (
    <AdminConsoleShell
      action={
        <AdminContentHeaderAction
          isOrdering={isOrdering}
          isProjectTab={activeTab === 'projects'}
          isSavingOrder={isSavingOrder}
          onCancelOrdering={handleCancelOrdering}
          onSaveProjectOrder={handleSaveProjectOrder}
          onStartOrdering={() => setIsOrdering(true)}
        />
      }
      activeSection="content"
      signOutRedirectPath={signOutRedirectPath}
      title="Content"
    >
      <div className={toolbarClass}>
        <AdminContentTabs activeTab={activeTab} onChange={handleTabChange} />
      </div>

      {activeTab === 'articles' ? (
        <AdminArticleTable
          articleItems={articleItems}
          articlePendingId={articlePendingId}
          onArticleVisibilityChange={handleArticleVisibilityChange}
        />
      ) : isOrdering ? (
        <AdminProjectOrderingList
          isSavingOrder={isSavingOrder}
          moveProject={moveProject}
          orderedProjects={orderedProjects}
        />
      ) : (
        <AdminProjectTable
          onProjectVisibilityChange={handleProjectVisibilityChange}
          orderedProjects={orderedProjects}
          projectPendingId={projectPendingId}
        />
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

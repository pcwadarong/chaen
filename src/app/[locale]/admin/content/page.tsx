import type { Metadata } from 'next';
import React from 'react';

import { getAdminArticles } from '@/entities/article/api/list/get-admin-articles';
import { getAdminProjects } from '@/entities/project/api/list/get-admin-projects';
import { buildAdminPath } from '@/features/admin-session';
import { updateArticleVisibilityAction } from '@/features/manage-article/api/update-article-visibility';
import { updateProjectDisplayOrderAction } from '@/features/manage-project/api/update-project-display-order';
import { updateProjectVisibilityAction } from '@/features/manage-project/api/update-project-visibility';
import { requireAdmin } from '@/shared/lib/auth/require-admin';
import { AdminContentPage } from '@/views/admin-content';

export const metadata: Metadata = {
  robots: {
    follow: false,
    index: false,
  },
};

/**
 * 관리자 콘텐츠 관리 페이지 엔트리입니다.
 */
const AdminContentRoute = async ({
  params,
}: {
  params: Promise<{
    locale: string;
  }>;
}) => {
  const { locale } = await params;

  await requireAdmin({ locale });

  const [articles, projects] = await Promise.all([getAdminArticles(), getAdminProjects()]);

  const handleSaveProjectOrder = async (orderedProjectIds: string[]) => {
    'use server';

    await updateProjectDisplayOrderAction({
      locale,
      orderedProjectIds,
    });
  };

  const handleToggleArticleVisibility = async (input: {
    articleId: string;
    articleSlug?: string;
    visibility: 'private' | 'public';
  }) => {
    'use server';

    await updateArticleVisibilityAction({
      articleId: input.articleId,
      articleSlug: input.articleSlug,
      locale,
      visibility: input.visibility,
    });
  };

  const handleToggleProjectVisibility = async (input: {
    projectId: string;
    projectSlug?: string;
    visibility: 'private' | 'public';
  }) => {
    'use server';

    await updateProjectVisibilityAction({
      locale,
      projectId: input.projectId,
      projectSlug: input.projectSlug,
      visibility: input.visibility,
    });
  };

  return (
    <AdminContentPage
      articles={articles}
      onToggleArticleVisibility={handleToggleArticleVisibility}
      onToggleProjectVisibility={handleToggleProjectVisibility}
      onSaveProjectOrder={handleSaveProjectOrder}
      projects={projects}
      signOutRedirectPath={buildAdminPath({ locale, section: 'login' })}
    />
  );
};

export default AdminContentRoute;

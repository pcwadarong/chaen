import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import React from 'react';

import {
  publishEditorContentAction,
  saveEditorDraftAction,
} from '@/entities/editor/api/editor-actions';
import { createEditorSeed, getEditorDraftSeed } from '@/entities/editor/api/editor-read';
import { getAllTechStacks } from '@/entities/tech-stack/api/query-tech-stacks';
import { mapTechStacksToAvailableTags } from '@/entities/tech-stack/model/map-tech-stacks-to-available-tags';
import { buildAdminPath } from '@/features/admin-session';
import { requireAdmin } from '@/shared/lib/auth/require-admin';
import { EditorPage } from '@/views/editor';

export const metadata: Metadata = {
  robots: {
    follow: false,
    index: false,
  },
};

/**
 * 관리자 신규 project 작성 페이지입니다.
 */
const AdminProjectNewRoute = async ({
  searchParams,
}: {
  searchParams?: Promise<{
    draftId?: string;
  }>;
}) => {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;

  await requireAdmin();

  const availableTags = mapTechStacksToAvailableTags(await getAllTechStacks().catch(() => []));
  const seed = resolvedSearchParams?.draftId
    ? await getEditorDraftSeed({
        contentType: 'project',
        draftId: resolvedSearchParams.draftId,
      })
    : createEditorSeed('project');

  if (!seed) {
    notFound();
  }

  const handleDraftSave = async (
    state: Parameters<NonNullable<React.ComponentProps<typeof EditorPage>['onDraftSave']>>[0],
    settings: Parameters<NonNullable<React.ComponentProps<typeof EditorPage>['onDraftSave']>>[1],
    draftId?: string | null,
  ) => {
    'use server';

    return saveEditorDraftAction({
      contentType: 'project',
      draftId,
      settings,
      state,
    });
  };

  const handlePublishSubmit = async (
    settings: Parameters<
      NonNullable<React.ComponentProps<typeof EditorPage>['onPublishSubmit']>
    >[0],
    editorState: Parameters<
      NonNullable<React.ComponentProps<typeof EditorPage>['onPublishSubmit']>
    >[1],
    draftId?: string | null,
  ) => {
    'use server';

    return publishEditorContentAction({
      contentType: 'project',
      draftId,
      editorState,
      settings,
    });
  };

  return (
    <EditorPage
      adminChrome={{
        signOutRedirectPath: buildAdminPath({ section: 'login' }),
      }}
      availableTags={availableTags}
      hideAppFrameFooter
      onDraftSave={handleDraftSave}
      onPublishSubmit={handlePublishSubmit}
      {...seed}
    />
  );
};

export default AdminProjectNewRoute;

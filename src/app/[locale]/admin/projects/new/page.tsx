import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import React from 'react';

import {
  publishEditorContentAction,
  saveEditorDraftAction,
} from '@/entities/editor/api/editor-actions';
import { createEditorSeed, getEditorDraftSeed } from '@/entities/editor/api/editor-read';
import { getAllTechStacks } from '@/entities/tech-stack/api/query-tech-stacks';
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
  params,
  searchParams,
}: {
  params: Promise<{
    locale: string;
  }>;
  searchParams?: Promise<{
    draftId?: string;
  }>;
}) => {
  const { locale } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : undefined;

  await requireAdmin({ locale });

  const availableTags = (await getAllTechStacks()).map(techStack => ({
    group: techStack.category,
    id: techStack.id,
    label: techStack.name,
    slug: techStack.slug,
  }));
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
      locale,
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

    await publishEditorContentAction({
      contentType: 'project',
      draftId,
      editorState,
      locale,
      settings,
    });
  };

  return (
    <EditorPage
      availableTags={availableTags}
      hideAppFrameFooter
      onDraftSave={handleDraftSave}
      onPublishSubmit={handlePublishSubmit}
      {...seed}
    />
  );
};

export default AdminProjectNewRoute;

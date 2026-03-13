import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import React from 'react';

import {
  publishEditorContentAction,
  saveEditorDraftAction,
} from '@/entities/editor/api/editor-actions';
import { getEditorSeed } from '@/entities/editor/api/editor-read';
import { getTagOptionsByLocale } from '@/entities/tag/api/query-tags';
import { requireAdmin } from '@/shared/lib/auth/require-admin';
import { EditorPage } from '@/views/editor';

export const metadata: Metadata = {
  robots: {
    follow: false,
    index: false,
  },
};

/**
 * 관리자 project 편집 페이지입니다.
 */
const AdminProjectEditRoute = async ({
  params,
}: {
  params: Promise<{
    id: string;
    locale: string;
  }>;
}) => {
  const { id, locale } = await params;

  await requireAdmin({ locale });

  const [availableTags, seed] = await Promise.all([
    getTagOptionsByLocale(locale),
    getEditorSeed({
      contentId: id,
      contentType: 'project',
    }),
  ]);

  if (!seed) {
    notFound();
  }

  const handleDraftSave = async (
    state: Parameters<NonNullable<React.ComponentProps<typeof EditorPage>['onDraftSave']>>[0],
    draftId?: string | null,
  ) => {
    'use server';

    return saveEditorDraftAction({
      contentId: id,
      contentType: 'project',
      draftId,
      locale,
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
      contentId: id,
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
      onDraftSave={handleDraftSave}
      onPublishSubmit={handlePublishSubmit}
      {...seed}
    />
  );
};

export default AdminProjectEditRoute;

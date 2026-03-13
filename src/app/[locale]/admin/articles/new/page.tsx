import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import React from 'react';

import {
  publishEditorContentAction,
  saveEditorDraftAction,
} from '@/entities/editor/api/editor-actions';
import { createEditorSeed, getEditorDraftSeed } from '@/entities/editor/api/editor-read';
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
 * 관리자 신규 article 작성 페이지입니다.
 */
const AdminArticleNewRoute = async ({
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

  const availableTags = await getTagOptionsByLocale(locale);
  const seed = resolvedSearchParams?.draftId
    ? await getEditorDraftSeed({
        contentType: 'article',
        draftId: resolvedSearchParams.draftId,
      })
    : createEditorSeed('article');

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
      contentType: 'article',
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
      contentType: 'article',
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

export default AdminArticleNewRoute;

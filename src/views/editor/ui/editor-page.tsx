import React from 'react';

import type { PublishActionResult } from '@/entities/editor/model/editor-types';
import { EditorClient } from '@/views/editor/ui/editor-client';
import { AdminConsoleShell } from '@/widgets/admin-console';
import type {
  DraftSaveResult,
  EditorContentType,
  EditorPublicationState,
  EditorState,
  Locale,
  PublishSettings,
  TranslationField,
} from '@/widgets/editor';

type EditorPageProps = {
  adminChrome?: {
    locale: string;
    title: string;
  };
  availableTags: {
    id: string;
    label: string;
    slug: string;
  }[];
  contentId?: string;
  contentType: EditorContentType;
  hideAppFrameFooter?: boolean;
  initialDraftId?: string | null;
  initialPublicationState?: EditorPublicationState;
  initialPublished?: boolean;
  initialSavedAt?: string | null;
  initialSettings?: PublishSettings;
  initialSlug?: string;
  initialTags?: string[];
  initialTranslations: Record<Locale, TranslationField>;
  onDraftSave?: (
    state: EditorState,
    settings: PublishSettings,
    draftId?: string | null,
  ) => Promise<DraftSaveResult | void>;
  onPublishSubmit?: (
    settings: PublishSettings,
    editorState: EditorState,
    draftId?: string | null,
  ) => Promise<PublishActionResult | void>;
};

/**
 * 관리자 전용 article/project 공용 에디터 페이지입니다.
 */
export const EditorPage = ({
  adminChrome,
  availableTags,
  contentId,
  contentType,
  hideAppFrameFooter = false,
  initialDraftId,
  initialPublicationState,
  initialPublished,
  initialSavedAt,
  initialSettings,
  initialSlug,
  initialTags,
  initialTranslations,
  onDraftSave,
  onPublishSubmit,
}: EditorPageProps) => {
  const content = (
    <EditorClient
      availableTags={availableTags}
      contentId={contentId}
      contentType={contentType}
      hideAppFrameFooter={hideAppFrameFooter}
      initialDraftId={initialDraftId}
      initialPublicationState={initialPublicationState}
      initialPublished={initialPublished}
      initialSavedAt={initialSavedAt}
      initialSettings={initialSettings}
      initialSlug={initialSlug}
      initialTags={initialTags}
      initialTranslations={initialTranslations}
      onDraftSave={onDraftSave}
      onPublishSubmit={onPublishSubmit}
    />
  );

  if (!adminChrome) {
    return content;
  }

  return (
    <AdminConsoleShell
      activeSection="content"
      locale={adminChrome.locale}
      title={adminChrome.title}
    >
      {content}
    </AdminConsoleShell>
  );
};

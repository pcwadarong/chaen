import React from 'react';

import { EditorClient } from '@/views/editor/ui/editor-client';
import type {
  DraftSaveResult,
  EditorContentType,
  EditorState,
  Locale,
  PublishSettings,
  TranslationField,
} from '@/widgets/editor';

type EditorPageProps = {
  availableTags: {
    id: string;
    label: string;
    slug: string;
  }[];
  contentId?: string;
  contentType: EditorContentType;
  initialDraftId?: string | null;
  initialPublished?: boolean;
  initialSavedAt?: string | null;
  initialSettings?: PublishSettings;
  initialSlug?: string;
  initialTags?: string[];
  initialTranslations: Record<Locale, TranslationField>;
  onDraftSave?: (state: EditorState, draftId?: string | null) => Promise<DraftSaveResult | void>;
  onPublishSubmit?: (
    settings: PublishSettings,
    editorState: EditorState,
    draftId?: string | null,
  ) => Promise<void>;
};

/**
 * 관리자 전용 article/project 공용 에디터 페이지입니다.
 */
export const EditorPage = ({
  availableTags,
  contentId,
  contentType,
  initialDraftId,
  initialPublished,
  initialSavedAt,
  initialSettings,
  initialSlug,
  initialTags,
  initialTranslations,
  onDraftSave,
  onPublishSubmit,
}: EditorPageProps) => (
  <EditorClient
    availableTags={availableTags}
    contentId={contentId}
    contentType={contentType}
    initialDraftId={initialDraftId}
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

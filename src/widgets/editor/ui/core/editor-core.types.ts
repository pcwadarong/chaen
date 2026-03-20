import type {
  DraftSaveResult,
  EditorContentType,
  EditorPublicationState,
  EditorState,
  Locale,
  PublishSettings,
  TranslationField,
} from '@/entities/editor/model/editor-types';

export {
  type DraftSaveResult,
  EDITOR_LOCALES,
  type EditorContentType,
  type EditorPublicationState,
  type EditorState,
  type Locale,
  type PublishSettings,
  type PublishVisibility,
  type TranslationField,
} from '@/entities/editor/model/editor-types';

export interface EditorCoreProps {
  availableTags: { group?: string; id: string; label: string; slug: string }[];
  contentId?: string;
  contentType: EditorContentType;
  hideAppFrameFooter?: boolean;
  initialPublished?: boolean;
  initialSavedAt?: string | null;
  initialSlug?: string;
  initialTags: string[];
  initialTranslations: Record<Locale, TranslationField>;
  onDraftSave?: (state: EditorState) => Promise<DraftSaveResult | void>;
  onOpenPublishPanel: (state: EditorState) => void;
}

export type MobileEditorPane = 'edit' | 'preview';

export interface PublishPanelProps {
  contentId?: string;
  contentType: EditorContentType;
  editorState: EditorState;
  initialSettings?: PublishSettings;
  isOpen: boolean;
  isPublished?: boolean;
  publicationState?: EditorPublicationState;
  onClose: () => void;
  onSettingsChange?: (settings: PublishSettings) => void;
  onSubmit: (settings: PublishSettings) => Promise<void>;
}

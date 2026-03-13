export const EDITOR_LOCALES = ['ko', 'en', 'ja', 'fr'] as const;

export type Locale = (typeof EDITOR_LOCALES)[number];

export interface TranslationField {
  content: string;
  description: string;
  title: string;
}

export interface EditorState {
  dirty: boolean;
  slug: string;
  tags: string[];
  translations: Record<Locale, TranslationField>;
}

export type DraftSaveResult = {
  draftId?: string;
  savedAt?: string | null;
};

export type EditorContentType = 'article' | 'project' | 'resume';
export type PublishVisibility = 'public' | 'private';

export interface EditorCoreProps {
  availableTags: { id: string; label: string; slug: string }[];
  contentId?: string;
  contentType: EditorContentType;
  initialPublished?: boolean;
  initialSavedAt?: string | null;
  initialSlug?: string;
  initialTags: string[];
  initialTranslations: Record<Locale, TranslationField>;
  onDraftSave?: (state: EditorState) => Promise<DraftSaveResult | void>;
  onOpenPublishPanel: (state: EditorState) => void;
}

export type MobileEditorPane = 'edit' | 'preview';

export type EditorLocaleValidation = {
  hasContentWithoutTitle: boolean;
  hasCompleteTranslation: boolean;
};

export type EditorValidationResult = {
  canSave: boolean;
  hasAnyCompleteTranslation: boolean;
  localeValidation: Record<Locale, EditorLocaleValidation>;
};

export interface PublishSettings {
  allowComments: boolean;
  publishAt: string | null;
  slug: string;
  thumbnailUrl: string;
  visibility: PublishVisibility;
}

export interface PublishPanelProps {
  contentId?: string;
  contentType: EditorContentType;
  editorState: EditorState;
  initialSettings?: PublishSettings;
  isOpen: boolean;
  isPublished?: boolean;
  onClose: () => void;
  onSettingsChange?: (settings: PublishSettings) => void;
  onSubmit: (settings: PublishSettings) => Promise<void>;
}

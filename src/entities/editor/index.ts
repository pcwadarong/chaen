export type { EditorDraftSummary, EditorSeed } from '@/entities/editor/api/editor.types';
export {
  EDITOR_ATTACHMENT_ALLOWED_EXTENSIONS,
  EDITOR_ATTACHMENT_ALLOWED_MIME_TYPES,
  EDITOR_ATTACHMENT_FILE_INPUT_ACCEPT,
  EDITOR_ATTACHMENT_MAX_FILE_SIZE,
  isAllowedEditorAttachmentExtension,
  isAllowedEditorAttachmentFile,
} from '@/entities/editor/model/editor-attachment-policy';
export {
  createEditorError,
  EDITOR_ERROR_MESSAGE,
  parseEditorError,
  resolveEditorErrorMessage,
  resolveEditorPublishInlineErrorField,
} from '@/entities/editor/model/editor-error';
export {
  createEmptyTranslations,
  formatSavedAtLabel,
  isEditorStateEqual,
  normalizeEditorState,
  normalizeTagSlugs,
  validateEditorState,
} from '@/entities/editor/model/editor-state-utils';
export {
  type DraftSaveResult,
  EDITOR_LOCALES,
  type EditorContentType,
  type EditorLocaleValidation,
  type EditorPublicationState,
  type EditorState,
  type EditorValidationResult,
  type Locale,
  type PublishSettings,
  type PublishVisibility,
  type TranslationField,
} from '@/entities/editor/model/editor-types';
export {
  EDITOR_VIDEO_ALLOWED_EXTENSIONS,
  EDITOR_VIDEO_ALLOWED_MIME_TYPES,
  EDITOR_VIDEO_FILE_INPUT_ACCEPT,
  EDITOR_VIDEO_MAX_FILE_SIZE,
  isAllowedEditorVideoExtension,
  isAllowedEditorVideoFile,
} from '@/entities/editor/model/editor-video-policy';
export {
  buildEditorLinkInsertion,
  createMarkdownLink,
  createMarkdownLinkByMode,
} from '@/entities/editor/model/markdown-link';
export {
  applyTextareaTransform,
  continueMarkdownList,
  focusTextarea,
  getPendingSelection,
  indentMarkdownList,
  insertTemplate,
  outdentMarkdownList,
  prefixLine,
  restoreCursor,
  toggleHeadingLine,
  wrapSelection,
} from '@/entities/editor-core/model/selection-utils';

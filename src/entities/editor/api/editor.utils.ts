import type { EditorSeed } from '@/entities/editor/api/editor.types';
import { createEmptyTranslations } from '@/entities/editor/model/editor-state-utils';
import type {
  EditorPublicationState,
  Locale,
  PublishSettings,
  TranslationField,
} from '@/entities/editor/model/editor-types';

export type EditorContentTableConfig = {
  relationForeignKey: 'article_id' | 'project_id';
  relationTable: 'article_tags' | 'project_tags';
  table: 'articles' | 'projects';
  translationForeignKey: 'article_id' | 'project_id';
  translationTable: 'article_translations' | 'project_translations';
};

export type EditorDraftSeed = {
  allowComments: boolean;
  contentId: string | null;
  draftId: string;
  publishAt: string | null;
  slug: string;
  tags: string[];
  thumbnailUrl: string;
  translations: Record<Locale, TranslationField>;
  updatedAt: string;
  visibility: PublishSettings['visibility'];
};

type DraftFieldKey = 'content' | 'description' | 'title';

type DraftFieldRecord = Record<string, unknown> | null;

const EDITOR_CONTENT_TABLE_CONFIG_BY_TYPE: Record<'article' | 'project', EditorContentTableConfig> =
  {
    article: {
      relationForeignKey: 'article_id',
      relationTable: 'article_tags',
      table: 'articles',
      translationForeignKey: 'article_id',
      translationTable: 'article_translations',
    },
    project: {
      relationForeignKey: 'project_id',
      relationTable: 'project_tags',
      table: 'projects',
      translationForeignKey: 'project_id',
      translationTable: 'project_translations',
    },
  };

/**
 * article/project 타입별 editor content 테이블 설정을 반환합니다.
 */
export const getEditorContentTableConfig = (contentType: 'article' | 'project') =>
  EDITOR_CONTENT_TABLE_CONFIG_BY_TYPE[contentType];

/**
 * draft jsonb 저장용 locale 필드 레코드를 생성합니다.
 */
export const buildDraftFieldRecord = (
  translations: Record<Locale, TranslationField>,
  key: DraftFieldKey,
) =>
  Object.fromEntries(
    (Object.keys(translations) as Locale[]).map(locale => [locale, translations[locale][key]]),
  );

/**
 * content translation table에 저장할 locale별 행 목록을 구성합니다.
 */
export const buildEditorTranslationRows = ({
  contentId,
  foreignKey,
  translations,
}: {
  contentId: string;
  foreignKey: 'article_id' | 'project_id';
  translations: Record<Locale, TranslationField>;
}) =>
  (Object.keys(translations) as Locale[])
    .map(locale => ({
      content: translations[locale].content.trim() || null,
      description: translations[locale].description.trim() || null,
      [foreignKey]: contentId,
      locale,
      title: translations[locale].title.trim(),
    }))
    .filter(
      row =>
        row.title.length > 0 || (typeof row.content === 'string' && row.content.trim().length > 0),
    );

/**
 * drafts jsonb title/content 레코드를 editor translations shape로 복원합니다.
 */
export const buildDraftTranslations = ({
  contentRecord,
  descriptionRecord,
  titleRecord,
}: {
  contentRecord: DraftFieldRecord;
  descriptionRecord: DraftFieldRecord;
  titleRecord: DraftFieldRecord;
}) => {
  const translations = createEmptyTranslations();

  (Object.keys(translations) as Locale[]).forEach(locale => {
    translations[locale] = {
      content: getDraftFieldValue(contentRecord, locale),
      description: getDraftFieldValue(descriptionRecord, locale),
      title: getDraftFieldValue(titleRecord, locale),
    };
  });

  return translations;
};

/**
 * 기존 editor seed 위에 draft 내용을 덮어써 이어쓰기 초기값을 구성합니다.
 */
export const mergeEditorSeedWithDraft = (
  seed: EditorSeed,
  draftSeed: EditorDraftSeed,
): EditorSeed => ({
  ...seed,
  contentId: draftSeed.contentId ?? seed.contentId,
  initialDraftId: draftSeed.draftId,
  initialPublicationState: seed.initialPublicationState ?? 'draft',
  initialPublished: seed.initialPublished,
  initialSavedAt: draftSeed.updatedAt,
  initialSettings: {
    allowComments: draftSeed.allowComments,
    publishAt: draftSeed.publishAt,
    slug: draftSeed.slug,
    thumbnailUrl: draftSeed.thumbnailUrl,
    visibility: draftSeed.visibility,
  },
  initialSlug: draftSeed.slug,
  initialTags: draftSeed.tags,
  initialTranslations: draftSeed.translations,
});

/**
 * DB visibility 값을 발행 패널이 사용하는 visibility enum으로 정규화합니다.
 */
export const normalizeEditorVisibility = (
  visibility: string | null | undefined,
): PublishSettings['visibility'] => {
  if (visibility === 'private') {
    return visibility;
  }

  return 'public';
};

/**
 * 기존 콘텐츠의 `publish_at`을 기준으로 현재 발행 상태를 정규화합니다.
 */
export const resolveEditorPublicationState = (
  publishAt: string | null,
  visibility: string | null | undefined,
  now: Date = new Date(),
): EditorPublicationState => {
  if (!publishAt) {
    return 'draft';
  }

  const publishDate = new Date(publishAt);

  if (Number.isNaN(publishDate.getTime())) {
    return 'draft';
  }

  if (publishDate.getTime() > now.getTime()) {
    return 'scheduled';
  }

  return visibility === 'public' ? 'published' : 'draft';
};

/**
 * draft jsonb 레코드에서 locale 문자열 값을 안전하게 추출합니다.
 */
const getDraftFieldValue = (record: DraftFieldRecord, locale: Locale) => {
  const value = record?.[locale];

  return typeof value === 'string' ? value : '';
};

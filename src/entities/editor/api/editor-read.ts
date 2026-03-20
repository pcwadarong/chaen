import type { EditorDraftSummary, EditorSeed } from '@/entities/editor/api/editor.types';
import {
  buildDraftTranslations,
  getEditorContentTableConfig,
  mergeEditorSeedWithDraft,
  normalizeEditorVisibility,
  resolveEditorPublicationState,
} from '@/entities/editor/api/editor.utils';
import { createEditorError } from '@/entities/editor/model/editor-error';
import { createEmptyTranslations } from '@/entities/editor/model/editor-state-utils';
import type { EditorContentType, Locale } from '@/entities/editor/model/editor-types';
import { getTechStackSlugsByIds } from '@/entities/tech-stack/api/query-tech-stacks';
import { createOptionalServiceRoleSupabaseClient } from '@/shared/lib/supabase/service-role';

import 'server-only';

type ContentRow = {
  allow_comments: boolean;
  created_at: string;
  id: string;
  publish_at: string | null;
  slug: string | null;
  thumbnail_url: string | null;
  updated_at: string | null;
  visibility: 'private' | 'public' | null;
};

type TranslationRow = {
  content: string | null;
  description: string | null;
  locale: string;
  title: string | null;
};

type RelationRow = {
  tag_id?: string;
  tech_stack_id?: string;
};

type TagRow = {
  id: string;
  slug: string;
};

type DraftRow = {
  allow_comments: boolean | null;
  content: Record<string, unknown> | null;
  content_id: string | null;
  content_type: EditorContentType;
  description: Record<string, unknown> | null;
  id: string;
  publish_at: string | null;
  slug: string | null;
  tags: unknown[] | null;
  thumbnail_url: string | null;
  title: Record<string, unknown> | null;
  updated_at: string;
  visibility: string | null;
};

type ResumeDraftRow = {
  contents: Record<string, unknown> | null;
  id: string;
  updated_at: string;
};

/**
 * 신규 작성 화면에서 사용하는 빈 editor seed를 구성합니다.
 */
export const createEditorSeed = (contentType: EditorContentType): EditorSeed => ({
  contentType,
  initialDraftId: null,
  initialPublicationState: 'draft',
  initialPublished: false,
  initialSavedAt: null,
  initialSettings: undefined,
  initialSlug: '',
  initialTags: [],
  initialTranslations: createEmptyTranslations(),
});

/**
 * editor 관리자 조회에 필요한 service role Supabase 클라이언트를 안전하게 반환합니다.
 */
const getServiceRoleSupabaseOrThrow = () => {
  const supabase = createOptionalServiceRoleSupabaseClient();

  if (!supabase) {
    throw createEditorError('serviceRoleUnavailable');
  }

  return supabase;
};

/**
 * article/project 편집 화면에서 사용할 초기 editor seed를 읽습니다.
 */
export const getEditorSeed = async ({
  contentId,
  contentType,
}: {
  contentId: string;
  contentType: 'article' | 'project';
}): Promise<EditorSeed | null> => {
  const supabase = getServiceRoleSupabaseOrThrow();
  const config = getEditorContentTableConfig(contentType);

  const { data: contentRow, error: contentError } = await supabase
    .from(config.table)
    .select('id,slug,thumbnail_url,visibility,allow_comments,publish_at,created_at,updated_at')
    .eq('id', contentId)
    .maybeSingle<ContentRow>();

  if (contentError) {
    throw new Error(`[editor] ${contentType} 조회 실패: ${contentError.message}`);
  }

  if (!contentRow) {
    return null;
  }

  const { data: translationRows, error: translationError } = await supabase
    .from(config.translationTable)
    .select('locale,title,description,content')
    .eq(config.translationForeignKey, contentId);

  if (translationError) {
    throw new Error(`[editor] ${contentType} 번역 조회 실패: ${translationError.message}`);
  }

  const { data: relationRows, error: relationError } = await supabase
    .from(config.relationTable)
    .select(config.relationIdColumn)
    .eq(config.relationForeignKey, contentId);

  if (relationError) {
    throw new Error(`[editor] ${contentType} 태그 relation 조회 실패: ${relationError.message}`);
  }

  const relationIds = ((relationRows ?? []) as RelationRow[])
    .map(row => row[config.relationIdColumn])
    .filter((value): value is string => typeof value === 'string');
  const relationSlugs = await getEditorRelationSlugsByIds({
    contentType,
    ids: relationIds,
  });

  const translations = createEmptyTranslations();

  ((translationRows ?? []) as TranslationRow[]).forEach(row => {
    const normalizedLocale = row.locale.toLowerCase();

    if (!isEditorLocale(normalizedLocale)) {
      return;
    }

    translations[normalizedLocale] = {
      content: row.content ?? '',
      description: row.description ?? '',
      title: row.title ?? '',
    };
  });

  const visibility = normalizeEditorVisibility(contentRow.visibility);

  const seed: EditorSeed = {
    contentId: contentRow.id,
    contentType,
    initialDraftId: null,
    initialPublicationState: resolveEditorPublicationState(
      contentRow.publish_at,
      contentRow.visibility,
    ),
    initialPublished: true,
    initialSavedAt: contentRow.updated_at ?? contentRow.created_at,
    initialSettings: {
      allowComments: contentRow.allow_comments,
      publishAt: contentRow.publish_at,
      slug: contentRow.slug ?? '',
      thumbnailUrl: contentRow.thumbnail_url ?? '',
      visibility,
    },
    initialSlug: contentRow.slug ?? '',
    initialTags: relationSlugs,
    initialTranslations: translations,
  };

  const draftSeed = await getDraftSeed({
    contentId,
    contentType,
  });

  return draftSeed ? mergeEditorSeedWithDraft(seed, draftSeed) : seed;
};

/**
 * 신규 작성 화면에서 draftId 기반 이어쓰기 seed를 읽습니다.
 */
export const getEditorDraftSeed = async ({
  contentType,
  draftId,
}: {
  contentType: 'article' | 'project';
  draftId: string;
}): Promise<EditorSeed | null> => {
  const draftSeed = await getDraftSeed({
    contentType,
    draftId,
  });

  if (!draftSeed) {
    return null;
  }

  return mergeEditorSeedWithDraft(createEditorSeed(contentType), draftSeed);
};

/**
 * draft 목록 페이지와 route에서 사용하는 관리자용 요약 목록을 반환합니다.
 */
export const getEditorDraftSummaries = async (): Promise<EditorDraftSummary[]> => {
  const supabase = getServiceRoleSupabaseOrThrow();
  const { data, error } = await supabase
    .from('drafts')
    .select('id,content_type,content_id,title,updated_at')
    .order('updated_at', { ascending: false });
  const { data: resumeDrafts, error: resumeDraftsError } = await supabase
    .from('resume_drafts')
    .select('id,contents,updated_at')
    .order('updated_at', { ascending: false });

  if (error) {
    throw new Error(`[editor] draft 목록 조회 실패: ${error.message}`);
  }

  if (resumeDraftsError) {
    throw new Error(`[editor] resume draft 목록 조회 실패: ${resumeDraftsError.message}`);
  }

  const contentDrafts = ((data ?? []) as DraftRow[]).map(row => ({
    contentId: row.content_id,
    contentType: row.content_type,
    id: row.id,
    title: getKoreanDraftTitle(row.title),
    updatedAt: row.updated_at,
  }));
  const resumeDraftItems = ((resumeDrafts ?? []) as ResumeDraftRow[]).map(row => ({
    contentId: null,
    contentType: 'resume' as const,
    id: row.id,
    title: getKoreanResumeDraftTitle(row.contents),
    updatedAt: row.updated_at,
  }));

  return [...contentDrafts, ...resumeDraftItems].sort(
    (left, right) => new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime(),
  );
};

/**
 * draft JSON title에서 목록 표시용 한국어 제목만 안전하게 추출합니다.
 */
const getKoreanDraftTitle = (title: Record<string, unknown> | null) => {
  const koTitle = title?.ko;

  return typeof koTitle === 'string' && koTitle.trim().length > 0 ? koTitle : '(제목 없음)';
};

/**
 * resume_drafts.contents에서 목록 표시용 한국어 제목만 안전하게 추출합니다.
 */
const getKoreanResumeDraftTitle = (contents: Record<string, unknown> | null) => {
  const koContent = contents?.ko;

  if (typeof koContent !== 'object' || koContent === null) {
    return '(제목 없음)';
  }

  const koTitle = (koContent as { title?: unknown }).title;

  return typeof koTitle === 'string' && koTitle.trim().length > 0 ? koTitle : '(제목 없음)';
};

/**
 * drafts 테이블에서 이어쓰기용 editor seed를 읽습니다.
 */
const getDraftSeed = async ({
  contentId,
  contentType,
  draftId,
}: {
  contentId?: string;
  contentType: 'article' | 'project';
  draftId?: string;
}) => {
  const supabase = getServiceRoleSupabaseOrThrow();
  let query = supabase
    .from('drafts')
    .select(
      'id,content_type,content_id,title,description,content,tags,slug,thumbnail_url,visibility,allow_comments,publish_at,updated_at',
    )
    .eq('content_type', contentType)
    .order('updated_at', { ascending: false })
    .limit(1);

  if (draftId) {
    query = query.eq('id', draftId);
  } else if (contentId) {
    query = query.eq('content_id', contentId);
  } else {
    return null;
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`[editor] ${contentType} draft 조회 실패: ${error.message}`);
  }

  const draftRow = ((data ?? []) as DraftRow[])[0];

  if (!draftRow) {
    return null;
  }

  const tagSlugs = await getEditorRelationSlugsByIds({
    contentType,
    ids: (draftRow.tags ?? []).filter((value): value is string => typeof value === 'string'),
  });

  return {
    allowComments: draftRow.allow_comments ?? true,
    contentId: draftRow.content_id,
    draftId: draftRow.id,
    publishAt: draftRow.publish_at,
    slug: draftRow.slug ?? '',
    tags: tagSlugs,
    thumbnailUrl: draftRow.thumbnail_url ?? '',
    translations: buildDraftTranslations({
      contentRecord: draftRow.content,
      descriptionRecord: draftRow.description,
      titleRecord: draftRow.title,
    }),
    updatedAt: draftRow.updated_at,
    visibility: normalizeEditorVisibility(draftRow.visibility),
  };
};

/**
 * article은 태그, project는 기술 스택 slug 배열로 복원합니다.
 */
const getEditorRelationSlugsByIds = async ({
  contentType,
  ids,
}: {
  contentType: 'article' | 'project';
  ids: string[];
}) => {
  if (ids.length === 0) return [];

  const supabase = getServiceRoleSupabaseOrThrow();

  if (contentType === 'project') {
    return getTechStackSlugsByIds({
      ids,
      supabase,
    });
  }

  const { data: tagRows, error: tagError } = await supabase
    .from('tags')
    .select('id,slug')
    .in('id', ids);

  if (tagError) {
    throw new Error(`[editor] 태그 slug 조회 실패: ${tagError.message}`);
  }

  const tagSlugById = new Map(((tagRows ?? []) as TagRow[]).map(row => [row.id, row.slug]));

  return ids
    .map(id => tagSlugById.get(id))
    .filter((slug): slug is string => typeof slug === 'string');
};

/**
 * 현재 editor가 다루는 locale인지 판별합니다.
 */
const isEditorLocale = (locale: string): locale is Locale =>
  locale === 'ko' || locale === 'en' || locale === 'ja' || locale === 'fr';

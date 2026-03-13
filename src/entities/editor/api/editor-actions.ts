'use server';

import { revalidatePath, revalidateTag } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';

import { ARTICLES_CACHE_TAG, createArticleCacheTag } from '@/entities/article/model/cache-tags';
import { createEditorError, EDITOR_ERROR_MESSAGE } from '@/entities/editor/model/editor-error';
import { createProjectCacheTag, PROJECTS_CACHE_TAG } from '@/entities/project/model/cache-tags';
import { requireAdmin } from '@/shared/lib/auth/require-admin';
import { isValidSlugFormat, normalizeSlugInput } from '@/shared/lib/editor/slug';
import { resolveActionLocale } from '@/shared/lib/i18n/get-action-translations';
import { buildLocalizedPathname } from '@/shared/lib/seo/metadata';
import { createOptionalServiceRoleSupabaseClient } from '@/shared/lib/supabase/service-role';
import type { DraftSaveResult, EditorState, PublishSettings } from '@/widgets/editor';
import { validateEditorState } from '@/widgets/editor/model/editor-core.utils';

import { checkSlugDuplicate } from './check-slug-duplicate';
import type { EditorContentTableConfig } from './editor.utils';
import {
  buildDraftFieldRecord,
  buildEditorTranslationRows,
  getEditorContentTableConfig,
} from './editor.utils';

const translationFieldSchema = z.object({
  content: z.string(),
  description: z.string(),
  title: z.string(),
});

const editorStateSchema = z.object({
  dirty: z.boolean(),
  slug: z.string(),
  tags: z.array(z.string()),
  translations: z.object({
    en: translationFieldSchema,
    fr: translationFieldSchema,
    ja: translationFieldSchema,
    ko: translationFieldSchema,
  }),
});

const publishSettingsSchema = z.object({
  allowComments: z.boolean(),
  publishAt: z.string().nullable(),
  slug: z.string(),
  thumbnailUrl: z.string(),
  visibility: z.enum(['public', 'private']),
});

type EditorDraftRow = {
  id: string;
  updated_at: string;
};

type SaveEditorDraftActionInput = {
  contentId?: string;
  contentType: 'article' | 'project';
  draftId?: string | null;
  locale?: string | null;
  settings: PublishSettings;
  state: EditorState;
};

type PublishEditorContentActionInput = {
  contentId?: string;
  contentType: 'article' | 'project';
  draftId?: string | null;
  editorState: EditorState;
  locale?: string | null;
  settings: PublishSettings;
};

type DeleteEditorDraftActionInput = {
  contentType: 'article' | 'project' | 'resume';
  draftId: string;
  locale?: string | null;
};

/**
 * article/project 관리자 draft를 upsert하고 마지막 저장 시각을 반환합니다.
 */
export const saveEditorDraftAction = async ({
  contentId,
  contentType,
  draftId,
  locale,
  settings,
  state,
}: SaveEditorDraftActionInput): Promise<DraftSaveResult> => {
  await requireAdmin({ locale, onUnauthorized: 'throw' });

  const parsedState = editorStateSchema.safeParse(state);
  const parsedSettings = publishSettingsSchema.safeParse(settings);

  if (!parsedState.success)
    throw createEditorError(
      'draftSaveInvalidState',
      parsedState.error.issues[0]?.message ?? EDITOR_ERROR_MESSAGE.draftSaveInvalidState,
    );
  if (!parsedSettings.success)
    throw createEditorError(
      'draftSaveInvalidSettings',
      parsedSettings.error.issues[0]?.message ?? EDITOR_ERROR_MESSAGE.draftSaveInvalidSettings,
    );

  const supabase = createOptionalServiceRoleSupabaseClient();
  if (!supabase) throw createEditorError('serviceRoleUnavailable');
  const normalizedTagIds = await getTagIdsBySlugs(parsedState.data.tags);
  const normalizedLocale = resolveActionLocale(locale);
  const draftPayload = {
    allow_comments: parsedSettings.data.allowComments,
    content: buildDraftFieldRecord(parsedState.data.translations, 'content'),
    content_id: contentId ?? null,
    content_type: contentType,
    description: buildDraftFieldRecord(parsedState.data.translations, 'description'),
    publish_at: parsedSettings.data.publishAt,
    slug: normalizeSlugInput(parsedSettings.data.slug) || null,
    tags: normalizedTagIds,
    thumbnail_url: parsedSettings.data.thumbnailUrl.trim() || null,
    title: buildDraftFieldRecord(parsedState.data.translations, 'title'),
    visibility: parsedSettings.data.visibility,
  };
  const resolvedDraftId =
    draftId ??
    (await resolveEditorDraftId({
      contentId,
      contentType,
    }));

  if (resolvedDraftId) {
    const { data, error } = await supabase
      .from('drafts')
      .update(draftPayload)
      .eq('id', resolvedDraftId)
      .select('id,updated_at')
      .single<EditorDraftRow>();

    if (error) throw createEditorError('draftSaveFailed');

    revalidatePath(
      buildLocalizedPathname({
        locale: normalizedLocale,
        pathname: '/admin/drafts',
      }),
    );

    return {
      draftId: data.id,
      savedAt: data.updated_at,
    };
  }

  const { data, error } = await supabase
    .from('drafts')
    .insert(draftPayload)
    .select('id,updated_at')
    .single<EditorDraftRow>();

  if (error) throw createEditorError('draftSaveFailed');

  revalidatePath(
    buildLocalizedPathname({
      locale: normalizedLocale,
      pathname: '/admin/drafts',
    }),
  );

  return {
    draftId: data.id,
    savedAt: data.updated_at,
  };
};

/**
 * article/project 발행 설정과 editor 상태를 실제 콘텐츠 테이블에 반영합니다.
 * 신규 작성과 수정 모두 저장 후 편집 화면으로 리다이렉트합니다.
 */
export const publishEditorContentAction = async ({
  contentId,
  contentType,
  draftId,
  editorState,
  locale,
  settings,
}: PublishEditorContentActionInput) => {
  await requireAdmin({ locale, onUnauthorized: 'throw' });

  const parsedState = editorStateSchema.safeParse(editorState);
  const parsedSettings = publishSettingsSchema.safeParse(settings);

  if (!parsedState.success)
    throw createEditorError(
      'publishInvalidState',
      parsedState.error.issues[0]?.message ?? EDITOR_ERROR_MESSAGE.publishInvalidState,
    );
  if (!parsedSettings.success)
    throw createEditorError(
      'publishInvalidSettings',
      parsedSettings.error.issues[0]?.message ?? EDITOR_ERROR_MESSAGE.publishInvalidSettings,
    );

  const validation = validateEditorState(parsedState.data.translations);

  if (!validation.canSave) throw createEditorError('missingCompleteTranslation');
  if (!parsedState.data.translations.ko.title.trim()) throw createEditorError('missingKoTitle');

  const normalizedSlug = normalizeSlugInput(parsedSettings.data.slug);
  if (!normalizedSlug) throw createEditorError('missingSlug');

  if (!isValidSlugFormat(normalizedSlug)) throw createEditorError('slugFormatInvalid');

  if (parsedSettings.data.publishAt) {
    const scheduledDate = new Date(parsedSettings.data.publishAt);

    if (Number.isNaN(scheduledDate.getTime()) || scheduledDate.getTime() <= new Date().getTime()) {
      throw createEditorError('scheduledPublishMustBeFuture');
    }
  }

  const duplicateResult = await checkSlugDuplicate(normalizedSlug, {
    excludeId: contentId ?? null,
    type: contentType,
  });

  if (duplicateResult.data.duplicate) throw createEditorError('duplicateSlug');

  const supabase = createOptionalServiceRoleSupabaseClient();
  if (!supabase) throw createEditorError('serviceRoleUnavailable');
  const targetContentId = contentId ?? crypto.randomUUID();
  const config = getEditorContentTableConfig(contentType);
  const nowIso = new Date().toISOString();
  const contentPayload = {
    allow_comments: parsedSettings.data.allowComments,
    publish_at: parsedSettings.data.publishAt,
    slug: normalizedSlug,
    thumbnail_url: parsedSettings.data.thumbnailUrl.trim() || null,
    updated_at: nowIso,
    visibility: parsedSettings.data.visibility,
  };

  if (contentId) {
    const { error } = await supabase
      .from(config.table)
      .update(contentPayload)
      .eq('id', targetContentId);

    if (error) throw createEditorError('publishFailed');
  } else {
    const { error } = await supabase.from(config.table).insert({
      ...contentPayload,
      created_at: nowIso,
      id: targetContentId,
    });

    if (error) throw createEditorError('publishFailed');
  }

  try {
    await syncEditorContentTranslations({
      config,
      contentId: targetContentId,
      supabase,
      translations: parsedState.data.translations,
    });
    await syncEditorContentTags({
      config,
      contentId: targetContentId,
      supabase,
      tagSlugs: parsedState.data.tags,
    });
    await deleteEditorDrafts({
      contentId: targetContentId,
      contentType,
      draftId,
    });
  } catch {
    throw createEditorError('publishFailed');
  }

  revalidateEditorContent({
    contentId: targetContentId,
    contentType,
    locale,
  });

  redirect(
    buildLocalizedPathname({
      locale: resolveActionLocale(locale),
      pathname: getPublishRedirectPath({
        contentType,
        publishAt: parsedSettings.data.publishAt,
        slug: normalizedSlug,
      }),
    }),
  );
};

/**
 * 발행 시점과 콘텐츠 타입에 따라 최종 redirect 경로를 계산합니다.
 */
const getPublishRedirectPath = ({
  contentType,
  publishAt,
  slug,
}: {
  contentType: 'article' | 'project';
  publishAt: string | null;
  slug: string;
}) => {
  if (publishAt) {
    return contentType === 'article' ? '/articles' : '/project';
  }

  return contentType === 'article' ? `/articles/${slug}` : `/project/${slug}`;
};

/**
 * 콘텐츠 타입별 관리자 편집 화면 경로를 계산합니다.
 */
const getEditorEditPath = ({
  contentId,
  contentType,
}: {
  contentId: string;
  contentType: 'article' | 'project';
}) =>
  contentType === 'article'
    ? `/admin/articles/${contentId}/edit`
    : `/admin/projects/${contentId}/edit`;

/**
 * draft 목록 화면에서 선택한 임시저장을 삭제합니다.
 * resume는 전용 `resume_drafts`, article/project는 공용 `drafts`에서 제거합니다.
 */
export const deleteEditorDraftAction = async ({
  contentType,
  draftId,
  locale,
}: DeleteEditorDraftActionInput) => {
  await requireAdmin({ locale, onUnauthorized: 'throw' });

  const supabase = createOptionalServiceRoleSupabaseClient();
  if (!supabase) throw createEditorError('serviceRoleUnavailable');

  if (contentType === 'resume') {
    const { error } = await supabase.from('resume_drafts').delete().eq('id', draftId);

    if (error) {
      throw createEditorError('draftDeleteFailed');
    }

    revalidatePath(
      buildLocalizedPathname({
        locale: resolveActionLocale(locale),
        pathname: '/admin/resume/edit',
      }),
    );
  } else {
    const { error } = await supabase
      .from('drafts')
      .delete()
      .eq('id', draftId)
      .eq('content_type', contentType);

    if (error) {
      throw createEditorError('draftDeleteFailed');
    }
  }

  revalidatePath(
    buildLocalizedPathname({
      locale: resolveActionLocale(locale),
      pathname: '/admin/drafts',
    }),
  );
};

/**
 * 기존 contentId 또는 명시된 draftId 기준으로 관리자 draft id를 찾습니다.
 */
const resolveEditorDraftId = async ({
  contentId,
  contentType,
}: {
  contentId?: string;
  contentType: 'article' | 'project';
}) => {
  if (!contentId) return null;

  const supabase = createOptionalServiceRoleSupabaseClient();
  if (!supabase) throw createEditorError('serviceRoleUnavailable');
  const { data, error } = await supabase
    .from('drafts')
    .select('id')
    .eq('content_type', contentType)
    .eq('content_id', contentId)
    .order('updated_at', { ascending: false })
    .limit(1);

  if (error) throw new Error(`[editor] draft 탐색 실패: ${error.message}`);

  return (data?.[0] as { id: string } | undefined)?.id ?? null;
};

/**
 * slug 배열을 drafts/content relation 저장용 tag id 배열로 변환합니다.
 */
const getTagIdsBySlugs = async (tagSlugs: string[]) => {
  if (tagSlugs.length === 0) return [];

  const normalizedTagSlugs = Array.from(
    new Set(
      tagSlugs.map(tagSlug => tagSlug.trim().toLowerCase()).filter(tagSlug => tagSlug.length > 0),
    ),
  );

  if (normalizedTagSlugs.length === 0) return [];

  const supabase = createOptionalServiceRoleSupabaseClient();
  if (!supabase) throw createEditorError('serviceRoleUnavailable');
  const { data, error } = await supabase
    .from('tags')
    .select('id,slug')
    .in('slug', normalizedTagSlugs);

  if (error) throw new Error(`[editor] 태그 조회 실패: ${error.message}`);

  const tagIdBySlug = new Map(
    (data ?? []).map(row => [(row as { slug: string }).slug, (row as { id: string }).id]),
  );

  return normalizedTagSlugs
    .map(tagSlug => tagIdBySlug.get(tagSlug))
    .filter((tagId): tagId is string => typeof tagId === 'string');
};

/**
 * 콘텐츠 본문 translation 테이블을 현재 editor 상태 기준으로 동기화합니다.
 */
const syncEditorContentTranslations = async ({
  config,
  contentId,
  supabase,
  translations,
}: {
  config: EditorContentTableConfig;
  contentId: string;
  supabase: NonNullable<ReturnType<typeof createOptionalServiceRoleSupabaseClient>>;
  translations: EditorState['translations'];
}) => {
  const { error: deleteError } = await supabase
    .from(config.translationTable)
    .delete()
    .eq(config.translationForeignKey, contentId);

  if (deleteError) throw new Error(`[editor] 번역 초기화 실패: ${deleteError.message}`);

  const translationRows = buildEditorTranslationRows({
    contentId,
    foreignKey: config.translationForeignKey,
    translations,
  });
  if (translationRows.length === 0) return;

  const { error: insertError } = await supabase
    .from(config.translationTable)
    .insert(translationRows);

  if (insertError) throw new Error(`[editor] 번역 저장 실패: ${insertError.message}`);
};

/**
 * 콘텐츠 relation table의 태그 연결을 현재 editor 상태 기준으로 동기화합니다.
 */
const syncEditorContentTags = async ({
  config,
  contentId,
  supabase,
  tagSlugs,
}: {
  config: EditorContentTableConfig;
  contentId: string;
  supabase: NonNullable<ReturnType<typeof createOptionalServiceRoleSupabaseClient>>;
  tagSlugs: string[];
}) => {
  const { error: deleteError } = await supabase
    .from(config.relationTable)
    .delete()
    .eq(config.relationForeignKey, contentId);

  if (deleteError) throw new Error(`[editor] 태그 relation 초기화 실패: ${deleteError.message}`);

  const tagIds = await getTagIdsBySlugs(tagSlugs);
  if (tagIds.length === 0) return;

  const relationRows = tagIds.map(tagId => ({
    [config.relationForeignKey]: contentId,
    tag_id: tagId,
  }));
  const { error: insertError } = await supabase.from(config.relationTable).insert(relationRows);
  if (insertError) throw new Error(`[editor] 태그 relation 저장 실패: ${insertError.message}`);
};

/**
 * 발행 완료 후 연결된 draft를 제거합니다.
 */
const deleteEditorDrafts = async ({
  contentId,
  contentType,
  draftId,
}: {
  contentId: string;
  contentType: 'article' | 'project';
  draftId?: string | null;
}) => {
  const supabase = createOptionalServiceRoleSupabaseClient();
  if (!supabase) throw new Error('[editor] service role env is not configured');
  let query = supabase.from('drafts').delete().eq('content_type', contentType);

  if (draftId) query = query.eq('id', draftId);
  else query = query.eq('content_id', contentId);

  const { error } = await query;
  if (error) throw new Error(`[editor] draft 정리 실패: ${error.message}`);
};

/**
 * 발행 저장 뒤 public/admin 캐시 경계를 갱신합니다.
 */
const revalidateEditorContent = ({
  contentId,
  contentType,
  locale,
}: {
  contentId: string;
  contentType: 'article' | 'project';
  locale?: string | null;
}) => {
  const resolvedLocale = resolveActionLocale(locale);
  const adminEditPath = buildLocalizedPathname({
    locale: resolvedLocale,
    pathname: getEditorEditPath({
      contentId,
      contentType,
    }),
  });
  const adminDraftsPath = buildLocalizedPathname({
    locale: resolvedLocale,
    pathname: '/admin/drafts',
  });

  revalidatePath(adminEditPath);
  revalidatePath(adminDraftsPath);

  if (contentType === 'article') {
    revalidateTag(ARTICLES_CACHE_TAG);
    revalidateTag(createArticleCacheTag(contentId));
    return;
  }

  revalidateTag(PROJECTS_CACHE_TAG);
  revalidateTag(createProjectCacheTag(contentId));
};

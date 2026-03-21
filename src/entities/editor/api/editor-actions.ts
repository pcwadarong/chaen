'use server';

import { revalidatePath, revalidateTag } from 'next/cache';
import { z } from 'zod';

import { ARTICLES_CACHE_TAG, createArticleCacheTag } from '@/entities/article/model/cache-tags';
import { checkSlugDuplicate } from '@/entities/editor/api/check-slug-duplicate';
import type { EditorContentTableConfig } from '@/entities/editor/api/editor.utils';
import {
  buildDraftFieldRecord,
  buildEditorTranslationRows,
  getEditorContentTableConfig,
  resolveEditorPublicationState,
} from '@/entities/editor/api/editor.utils';
import { createEditorError, EDITOR_ERROR_MESSAGE } from '@/entities/editor/model/editor-error';
import { validateEditorState } from '@/entities/editor/model/editor-state-utils';
import type {
  DraftSaveResult,
  EditorState,
  PublishActionResult,
  PublishSettings,
} from '@/entities/editor/model/editor-types';
import { createProjectCacheTag, PROJECTS_CACHE_TAG } from '@/entities/project/model/cache-tags';
import { getTechStackIdsBySlugs } from '@/entities/tech-stack/api/query-tech-stacks';
import { locales } from '@/i18n/routing';
import { requireAdmin } from '@/shared/lib/auth/require-admin';
import { resolveActionLocale } from '@/shared/lib/i18n/get-action-translations';
import { buildLocalizedPathname } from '@/shared/lib/seo/metadata';
import { isValidSlugFormat, normalizeSlugInput } from '@/shared/lib/slug/slug';
import { createOptionalServiceRoleSupabaseClient } from '@/shared/lib/supabase/service-role';
import { normalizeHttpUrl } from '@/shared/lib/url/normalize-http-url';

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
  githubUrl: z.string(),
  publishAt: z.string().nullable(),
  slug: z.string(),
  thumbnailUrl: z.string(),
  visibility: z.enum(['public', 'private']),
  websiteUrl: z.string(),
});

type EditorDraftRow = {
  id: string;
  updated_at: string;
};

type EditorContentPublishRow = {
  publish_at: string | null;
  visibility: string | null;
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
  const config = getEditorContentTableConfig(contentType);
  const existingContentPublication = contentId
    ? await getExistingContentPublication({
        config,
        contentId,
        supabase,
      })
    : null;
  const existingPublicationState = resolveEditorPublicationState(
    existingContentPublication?.publish_at ?? null,
    existingContentPublication?.visibility,
  );
  const normalizedRelationIds = await getRelationIdsBySlugs({
    contentType,
    slugs: parsedState.data.tags,
  });
  const normalizedLocale = resolveActionLocale(locale);
  const draftWebsiteUrl =
    contentType === 'project' ? parsedSettings.data.websiteUrl.trim() || null : null;
  const draftGithubUrl =
    contentType === 'project' ? parsedSettings.data.githubUrl.trim() || null : null;
  const draftPayload = {
    allow_comments: contentType === 'article' ? parsedSettings.data.allowComments : false,
    content: buildDraftFieldRecord(parsedState.data.translations, 'content'),
    content_id: contentId ?? null,
    content_type: contentType,
    description: buildDraftFieldRecord(parsedState.data.translations, 'description'),
    github_url: draftGithubUrl,
    publish_at:
      existingPublicationState === 'published'
        ? (existingContentPublication?.publish_at ?? null)
        : parsedSettings.data.publishAt,
    slug: normalizeSlugInput(parsedSettings.data.slug) || null,
    tags: normalizedRelationIds,
    thumbnail_url: parsedSettings.data.thumbnailUrl.trim() || null,
    title: buildDraftFieldRecord(parsedState.data.translations, 'title'),
    visibility: parsedSettings.data.visibility,
    website_url: draftWebsiteUrl,
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
}: PublishEditorContentActionInput): Promise<PublishActionResult> => {
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

  const normalizedWebsiteUrl = normalizeProjectExternalUrl(
    parsedSettings.data.websiteUrl,
    'websiteUrlInvalid',
  );
  const normalizedGithubUrl = normalizeProjectExternalUrl(
    parsedSettings.data.githubUrl,
    'githubUrlInvalid',
  );

  const supabase = createOptionalServiceRoleSupabaseClient();
  if (!supabase) throw createEditorError('serviceRoleUnavailable');
  const targetContentId = contentId ?? crypto.randomUUID();
  const config = getEditorContentTableConfig(contentType);
  const existingContentPublication = contentId
    ? await getExistingContentPublication({
        config,
        contentId: targetContentId,
        supabase,
      })
    : null;
  const existingPublicationState = resolveEditorPublicationState(
    existingContentPublication?.publish_at ?? null,
    existingContentPublication?.visibility,
  );
  const nextPublishAtToValidate =
    existingPublicationState === 'published' ? null : parsedSettings.data.publishAt;

  if (existingPublicationState === 'published' && parsedSettings.data.publishAt !== null) {
    throw createEditorError('publishedContentCannotBeRescheduled');
  }

  if (nextPublishAtToValidate) {
    const scheduledDate = new Date(nextPublishAtToValidate);

    if (Number.isNaN(scheduledDate.getTime()) || scheduledDate.getTime() <= new Date().getTime()) {
      throw createEditorError('scheduledPublishMustBeFuture');
    }
  }

  const duplicateResult = await checkSlugDuplicate(normalizedSlug, {
    excludeId: contentId ?? null,
    type: contentType,
  });

  if (duplicateResult.data.duplicate) throw createEditorError('duplicateSlug');

  const nowIso = new Date().toISOString();
  const effectivePublishAt =
    existingPublicationState === 'published'
      ? (existingContentPublication?.publish_at ?? null)
      : (parsedSettings.data.publishAt ?? nowIso);
  const redirectPath = getPublishRedirectPath({
    contentId: targetContentId,
    contentType,
    publishAt: effectivePublishAt,
    visibility: parsedSettings.data.visibility,
    slug: normalizedSlug,
  });
  const contentPayload =
    contentType === 'article'
      ? {
          allow_comments: parsedSettings.data.allowComments,
          publish_at: effectivePublishAt,
          slug: normalizedSlug,
          thumbnail_url: parsedSettings.data.thumbnailUrl.trim() || null,
          visibility: parsedSettings.data.visibility,
        }
      : {
          github_url: normalizedGithubUrl,
          publish_at: effectivePublishAt,
          slug: normalizedSlug,
          thumbnail_url: parsedSettings.data.thumbnailUrl.trim() || null,
          visibility: parsedSettings.data.visibility,
          website_url: normalizedWebsiteUrl,
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
    await syncEditorContentRelations({
      config,
      contentId: targetContentId,
      supabase,
      relationSlugs: parsedState.data.tags,
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
    slug: normalizedSlug,
  });

  return {
    redirectPath: buildLocalizedPathname({
      locale: resolveActionLocale(locale),
      pathname: redirectPath,
    }),
  };
};

/**
 * 발행 시점과 콘텐츠 타입에 따라 최종 redirect 경로를 계산합니다.
 */
const getPublishRedirectPath = ({
  contentId,
  contentType,
  publishAt,
  visibility,
  slug,
}: {
  contentId: string;
  contentType: 'article' | 'project';
  publishAt: string | null;
  visibility: PublishSettings['visibility'];
  slug: string;
}) => {
  if (visibility !== 'public') {
    return getEditorEditPath({
      contentId,
      contentType,
    });
  }

  const publishDate = publishAt ? new Date(publishAt) : null;
  const isScheduled =
    publishDate !== null &&
    !Number.isNaN(publishDate.getTime()) &&
    publishDate.getTime() > new Date().getTime();

  if (isScheduled) {
    return contentType === 'article' ? '/articles' : '/project';
  }

  return contentType === 'article' ? `/articles/${slug}` : `/project/${slug}`;
};

/**
 * 기존 콘텐츠의 등록/공개 메타데이터를 읽어 수정 발행 규칙 판단에 사용합니다.
 */
const getExistingContentPublication = async ({
  config,
  contentId,
  supabase,
}: {
  config: EditorContentTableConfig;
  contentId: string;
  supabase: NonNullable<ReturnType<typeof createOptionalServiceRoleSupabaseClient>>;
}) => {
  const { data, error } = await supabase
    .from(config.table)
    .select('publish_at,visibility')
    .eq('id', contentId)
    .maybeSingle<EditorContentPublishRow>();

  if (error) {
    throw createEditorError('publishFailed');
  }

  return data ?? null;
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
 * slug 배열을 drafts/content relation 저장용 id 배열로 변환합니다.
 */
const getRelationIdsBySlugs = async ({
  contentType,
  slugs,
}: {
  contentType: 'article' | 'project';
  slugs: string[];
}) => {
  if (slugs.length === 0) return [];

  const supabase = createOptionalServiceRoleSupabaseClient();
  if (!supabase) throw createEditorError('serviceRoleUnavailable');

  if (contentType === 'project') {
    return getTechStackIdsBySlugs({
      slugs,
      supabase,
    });
  }

  const normalizedTagSlugs = Array.from(
    new Set(
      slugs.map(tagSlug => tagSlug.trim().toLowerCase()).filter(tagSlug => tagSlug.length > 0),
    ),
  );

  if (normalizedTagSlugs.length === 0) return [];

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
 * project 외부 링크 입력을 공개 저장 가능한 http/https URL 또는 null로 정규화합니다.
 */
const normalizeProjectExternalUrl = (
  rawUrl: string,
  errorCode: 'githubUrlInvalid' | 'websiteUrlInvalid',
) => {
  const trimmed = rawUrl.trim();

  if (!trimmed) return null;

  const normalized = normalizeHttpUrl(trimmed);

  if (!normalized) {
    throw createEditorError(errorCode);
  }

  return normalized;
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
 * 콘텐츠 relation table 연결을 현재 editor 상태 기준으로 동기화합니다.
 */
const syncEditorContentRelations = async ({
  config,
  contentId,
  supabase,
  relationSlugs,
}: {
  config: EditorContentTableConfig;
  contentId: string;
  supabase: NonNullable<ReturnType<typeof createOptionalServiceRoleSupabaseClient>>;
  relationSlugs: string[];
}) => {
  const { error: deleteError } = await supabase
    .from(config.relationTable)
    .delete()
    .eq(config.relationForeignKey, contentId);

  if (deleteError) throw new Error(`[editor] relation 초기화 실패: ${deleteError.message}`);

  const relationIds = await getRelationIdsBySlugs({
    contentType: config.table === 'articles' ? 'article' : 'project',
    slugs: relationSlugs,
  });
  if (relationIds.length === 0) return;

  const relationRows = relationIds.map(relationId => ({
    [config.relationForeignKey]: contentId,
    [config.relationIdColumn]: relationId,
  }));
  const { error: insertError } = await supabase.from(config.relationTable).insert(relationRows);
  if (insertError) throw new Error(`[editor] relation 저장 실패: ${insertError.message}`);
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
  if (!supabase) throw createEditorError('serviceRoleUnavailable');
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
  slug,
}: {
  contentId: string;
  contentType: 'article' | 'project';
  locale?: string | null;
  slug: string;
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
  revalidatePublicContentPaths({
    contentType,
    slug,
  });

  if (contentType === 'article') {
    revalidateTag(ARTICLES_CACHE_TAG);
    revalidateTag(createArticleCacheTag(contentId));
    return;
  }

  revalidateTag(PROJECTS_CACHE_TAG);
  revalidateTag(createProjectCacheTag(contentId));
};

/**
 * article/project 공개 목록과 상세 경로를 전 locale 기준으로 다시 검증하게 만듭니다.
 */
const revalidatePublicContentPaths = ({
  contentType,
  slug,
}: {
  contentType: 'article' | 'project';
  slug: string;
}) => {
  locales.forEach(locale => {
    if (contentType === 'article') {
      revalidatePath(
        buildLocalizedPathname({
          locale,
          pathname: '/articles',
        }),
      );
      revalidatePath(
        buildLocalizedPathname({
          locale,
          pathname: `/articles/${slug}`,
        }),
      );
      return;
    }

    revalidatePath(
      buildLocalizedPathname({
        locale,
        pathname: '/project',
      }),
    );
    revalidatePath(
      buildLocalizedPathname({
        locale,
        pathname: `/project/${slug}`,
      }),
    );
    revalidatePath(
      buildLocalizedPathname({
        locale,
        pathname: '/',
      }),
    );
  });
};

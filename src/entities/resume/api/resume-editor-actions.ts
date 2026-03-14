'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';

import {
  type DraftSaveResult,
  EDITOR_LOCALES,
  type Locale,
} from '@/entities/editor/model/editor-types';
import { getPdfFileAvailability } from '@/entities/pdf-file/api/get-pdf-file-availability';
import { getPdfFileContentConfig } from '@/entities/pdf-file/model/config';
import { requireAdmin } from '@/shared/lib/auth/require-admin';
import { resolveActionLocale } from '@/shared/lib/i18n/get-action-translations';
import { buildLocalizedPathname } from '@/shared/lib/seo/metadata';
import { createOptionalServiceRoleSupabaseClient } from '@/shared/lib/supabase/service-role';

import type {
  ResumeEditorContentMap,
  ResumeEditorState,
  ResumePublishSettings,
} from '../model/resume-editor.types';
import {
  buildResumeDraftContentRecord,
  validateResumePublishState,
} from '../model/resume-editor.utils';
import { createResumeEditorError, RESUME_EDITOR_ERROR_MESSAGE } from '../model/resume-editor-error';

const resumeContentSchema = z.object({
  body: z.string(),
  description: z.string(),
  download_button_label: z.string(),
  download_unavailable_label: z.string(),
  title: z.string(),
});

const resumeEditorStateSchema = z.object({
  contents: z.object({
    en: resumeContentSchema,
    fr: resumeContentSchema,
    ja: resumeContentSchema,
    ko: resumeContentSchema,
  }),
  dirty: z.boolean(),
});

const resumePublishSettingsSchema = z.object({
  downloadFileName: z.string(),
  downloadPath: z.string(),
  filePath: z.string(),
  isPdfReady: z.boolean(),
});

type ResumeDraftRow = {
  id: string;
  updated_at: string;
};

type SaveResumeDraftActionInput = {
  draftId?: string | null;
  locale?: string | null;
  state: ResumeEditorState;
};

type PublishResumeContentActionInput = {
  draftId?: string | null;
  locale?: string | null;
  settings: ResumePublishSettings;
  state: ResumeEditorState;
};

type ResumeServiceRoleSupabase = NonNullable<
  ReturnType<typeof createOptionalServiceRoleSupabaseClient>
>;

/**
 * resume 전용 draft를 upsert하고 마지막 저장 시각을 반환합니다.
 */
export const saveResumeDraftAction = async ({
  draftId,
  locale,
  state,
}: SaveResumeDraftActionInput): Promise<DraftSaveResult> => {
  await requireAdmin({ locale, onUnauthorized: 'throw' });

  const parsedState = resumeEditorStateSchema.safeParse(state);

  if (!parsedState.success) {
    throw createResumeEditorError(
      'draftSaveInvalidState',
      parsedState.error.issues[0]?.message ?? RESUME_EDITOR_ERROR_MESSAGE.draftSaveInvalidState,
    );
  }

  const supabase = createOptionalServiceRoleSupabaseClient();
  if (!supabase) {
    throw createResumeEditorError('serviceRoleUnavailable');
  }
  const normalizedLocale = resolveActionLocale(locale);
  const draftPayload = {
    contents: buildResumeDraftContentRecord(parsedState.data.contents),
  };
  const resolvedDraftId = draftId ?? (await resolveLatestResumeDraftId());

  if (resolvedDraftId) {
    const { data, error } = await supabase
      .from('resume_drafts')
      .update(draftPayload)
      .eq('id', resolvedDraftId)
      .select('id,updated_at')
      .single<ResumeDraftRow>();

    if (error) {
      throw createResumeEditorError('draftSaveFailed');
    }

    revalidateResumeEditorPaths(normalizedLocale);

    return {
      draftId: data.id,
      savedAt: data.updated_at,
    };
  }

  const { data, error } = await supabase
    .from('resume_drafts')
    .insert(draftPayload)
    .select('id,updated_at')
    .single<ResumeDraftRow>();

  if (error) {
    throw createResumeEditorError('draftSaveFailed');
  }

  revalidateResumeEditorPaths(normalizedLocale);

  return {
    draftId: data.id,
    savedAt: data.updated_at,
  };
};

/**
 * resume 편집 상태를 `resume_contents`에 반영하고 public/admin 경로를 갱신합니다.
 */
export const publishResumeContentAction = async ({
  draftId,
  locale,
  settings,
  state,
}: PublishResumeContentActionInput) => {
  await requireAdmin({ locale, onUnauthorized: 'throw' });

  const parsedState = resumeEditorStateSchema.safeParse(state);
  const parsedSettings = resumePublishSettingsSchema.safeParse(settings);

  if (!parsedState.success) {
    throw createResumeEditorError(
      'publishInvalidState',
      parsedState.error.issues[0]?.message ?? RESUME_EDITOR_ERROR_MESSAGE.publishInvalidState,
    );
  }

  if (!parsedSettings.success) {
    throw createResumeEditorError(
      'publishInvalidSettings',
      parsedSettings.error.issues[0]?.message ?? RESUME_EDITOR_ERROR_MESSAGE.publishInvalidSettings,
    );
  }

  const validation = validateResumePublishState({
    contents: parsedState.data.contents,
    settings: parsedSettings.data,
  });

  if (validation.koTitle) {
    throw createResumeEditorError('missingKoTitle', validation.koTitle);
  }

  if (validation.koBody) {
    throw createResumeEditorError('missingKoBody', validation.koBody);
  }

  const isPdfReady = await getPdfFileAvailability({
    kind: 'resume',
  }).catch(() => false);

  if (!parsedSettings.data.isPdfReady || !isPdfReady) {
    throw createResumeEditorError(
      'missingPdf',
      validation.pdf ?? RESUME_EDITOR_ERROR_MESSAGE.missingPdf,
    );
  }

  const supabase = createOptionalServiceRoleSupabaseClient();
  if (!supabase) {
    throw createResumeEditorError('serviceRoleUnavailable');
  }
  const { tableName } = getPdfFileContentConfig('resume');
  const nowIso = new Date().toISOString();
  const contentRows = buildResumeContentRows({
    contents: parsedState.data.contents,
    updatedAt: nowIso,
  });
  const { error } = await supabase.from(tableName).upsert(contentRows, {
    onConflict: 'locale',
  });

  if (error) {
    throw createResumeEditorError('publishFailed');
  }

  await deleteResumeDrafts(supabase, draftId);

  revalidateResumeEditorPaths(resolveActionLocale(locale));
  revalidateResumePublicPaths();

  redirect(
    buildLocalizedPathname({
      locale: resolveActionLocale(locale),
      pathname: '/admin/resume/edit',
    }),
  );
};

/**
 * locale별 resume row를 DB upsert 형태로 구성합니다.
 */
const buildResumeContentRows = ({
  contents,
  updatedAt,
}: {
  contents: ResumeEditorContentMap;
  updatedAt: string;
}) =>
  EDITOR_LOCALES.map(locale => ({
    body: contents[locale].body.trim(),
    description: contents[locale].description.trim(),
    download_button_label: contents[locale].download_button_label.trim(),
    download_unavailable_label: contents[locale].download_unavailable_label.trim(),
    locale,
    title: contents[locale].title.trim(),
    updated_at: updatedAt,
  }));

/**
 * 기존 resume draft id가 있으면 그 draft를, 없으면 resume draft 전체를 정리합니다.
 */
const deleteResumeDrafts = async (supabase: ResumeServiceRoleSupabase, draftId?: string | null) => {
  let query = supabase.from('resume_drafts').delete();

  if (draftId) {
    query = query.eq('id', draftId);
  }

  const { error } = await query;

  if (error) {
    throw createResumeEditorError('publishFailed');
  }
};

/**
 * 가장 최근 resume draft id를 반환합니다.
 */
const resolveLatestResumeDraftId = async () => {
  const supabase = createOptionalServiceRoleSupabaseClient();
  if (!supabase) {
    throw createResumeEditorError('serviceRoleUnavailable');
  }
  const { data, error } = await supabase
    .from('resume_drafts')
    .select('id')
    .order('updated_at', { ascending: false })
    .limit(1);

  if (error) {
    throw createResumeEditorError('draftSaveFailed');
  }

  return (data?.[0] as { id: string } | undefined)?.id ?? null;
};

/**
 * 현재 locale 기준 admin resume 편집/임시저장 경로를 다시 검증하게 만듭니다.
 */
const revalidateResumeEditorPaths = (locale: Locale) => {
  revalidatePath(
    buildLocalizedPathname({
      locale,
      pathname: '/admin/drafts',
    }),
  );
  revalidatePath(
    buildLocalizedPathname({
      locale,
      pathname: '/admin/resume/edit',
    }),
  );
};

/**
 * locale별 public resume 페이지를 모두 다시 검증하게 만듭니다.
 */
const revalidateResumePublicPaths = () => {
  EDITOR_LOCALES.forEach(locale => {
    revalidatePath(
      buildLocalizedPathname({
        locale,
        pathname: '/resume',
      }),
    );
  });
};

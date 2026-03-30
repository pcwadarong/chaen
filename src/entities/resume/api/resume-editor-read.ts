import type { Locale } from '@/entities/editor/model/editor-types';
import type { PdfFileContent } from '@/entities/pdf-file';
import { getPdfFileContentConfig } from '@/entities/pdf-file';
import type {
  ResumeDraftSeed,
  ResumeEditorContentMap,
  ResumeEditorSeed,
} from '@/entities/resume/model/resume-editor.types';
import {
  createDefaultResumeEditorContentMap,
  getResumeEditorSavedAt,
  mergeResumeEditorSeedWithDraft,
  toResumeEditorContent,
} from '@/entities/resume/model/resume-editor.utils';
import { createOptionalServiceRoleSupabaseClient } from '@/shared/lib/supabase/service-role';

import 'server-only';

type ResumeDraftRow = {
  contents: Record<string, unknown> | null;
  id: string;
  pdf_file_path: string | null;
  updated_at: string;
};

type ResumeDraftLocaleContent = {
  body?: string;
  description?: string;
  title?: string;
};

/**
 * service role 연결 문제나 조회 오류가 있어도 resume 편집 화면은 기본 seed로 열릴 수 있도록
 * 읽기 실패를 로깅하고 안전한 fallback을 반환합니다.
 *
 * @param scope 실패가 발생한 읽기 단계 식별자
 * @param error 원본 예외
 */
const logResumeEditorReadFailure = (scope: 'contents' | 'draft', error: unknown) => {
  console.error(`[resume-editor] ${scope} read failed`, {
    error,
  });
};

/**
 * resume 편집 화면에서 사용할 locale별 콘텐츠 레코드를 반환합니다.
 */
export const getResumeEditorContentMap = async (): Promise<ResumeEditorContentMap> => {
  const rows = await getResumeEditorRows();
  const contentMap = createDefaultResumeEditorContentMap();

  rows.forEach(row => {
    const normalizedLocale = row.locale.toLowerCase();

    if (!isResumeLocale(normalizedLocale)) {
      return;
    }

    contentMap[normalizedLocale] = toResumeEditorContent(row);
  });

  return contentMap;
};

/**
 * resume 편집 화면에서 사용할 초기 콘텐츠를 반환합니다.
 */
export const getResumeEditorSeed = async ({
  draftId,
}: {
  draftId?: string;
} = {}): Promise<ResumeEditorSeed> => {
  const contentMap = createDefaultResumeEditorContentMap();
  const rows = await getResumeEditorRows();

  rows.forEach(row => {
    const normalizedLocale = row.locale.toLowerCase();

    if (!isResumeLocale(normalizedLocale)) {
      return;
    }

    contentMap[normalizedLocale] = toResumeEditorContent(row);
  });

  const seed: ResumeEditorSeed = {
    initialDraftId: null,
    initialContents: contentMap,
    initialSavedAt: getResumeEditorSavedAt(rows),
  };

  const draftSeed = await getResumeDraftSeed({
    draftId,
  });

  return draftSeed ? mergeResumeEditorSeedWithDraft(seed, draftSeed) : seed;
};

/**
 * resume 편집 화면이 다루는 locale 레코드를 Supabase에서 조회합니다.
 */
const getResumeEditorRows = async (): Promise<PdfFileContent[]> => {
  const supabase = createOptionalServiceRoleSupabaseClient();
  if (!supabase) {
    logResumeEditorReadFailure('contents', new Error('service role env is not configured'));
    return [];
  }
  const { tableName } = getPdfFileContentConfig('resume');
  const { data, error } = await supabase.from(tableName).select('*');

  if (error) {
    logResumeEditorReadFailure('contents', new Error(error.message));
    return [];
  }

  return ((data ?? []) as PdfFileContent[]).filter(row => isResumeLocale(row.locale.toLowerCase()));
};

/**
 * resume 이어쓰기용 draft를 읽어 편집 seed에 맞는 형태로 복원합니다.
 */
const getResumeDraftSeed = async ({
  draftId,
}: {
  draftId?: string;
}): Promise<ResumeDraftSeed | null> => {
  const supabase = createOptionalServiceRoleSupabaseClient();
  if (!supabase) {
    logResumeEditorReadFailure('draft', new Error('service role env is not configured'));
    return null;
  }
  let query = supabase
    .from('resume_drafts')
    .select('id,contents,pdf_file_path,updated_at')
    .order('updated_at', { ascending: false })
    .limit(1);

  if (draftId) {
    query = query.eq('id', draftId);
  }

  const { data, error } = await query;

  if (error) {
    logResumeEditorReadFailure('draft', new Error(error.message));
    return null;
  }

  const draftRow = ((data ?? []) as ResumeDraftRow[])[0];

  if (!draftRow) {
    return null;
  }

  const contents = createDefaultResumeEditorContentMap();

  (Object.keys(contents) as Locale[]).forEach(locale => {
    const draftContent = draftRow.contents?.[locale];
    const normalizedDraftContent = isResumeDraftLocaleContent(draftContent) ? draftContent : null;

    contents[locale] = {
      body: typeof normalizedDraftContent?.body === 'string' ? normalizedDraftContent.body : '',
      description:
        typeof normalizedDraftContent?.description === 'string'
          ? normalizedDraftContent.description
          : '',
      title: typeof normalizedDraftContent?.title === 'string' ? normalizedDraftContent.title : '',
    };
  });

  return {
    contents,
    draftId: draftRow.id,
    updatedAt: draftRow.updated_at,
  };
};

/**
 * resume 편집 화면이 다루는 locale인지 판별합니다.
 */
const isResumeLocale = (locale: string): locale is Locale =>
  locale === 'ko' || locale === 'en' || locale === 'ja' || locale === 'fr';

/**
 * drafts.content에 저장된 locale payload가 resume 필드 객체인지 판별합니다.
 */
const isResumeDraftLocaleContent = (value: unknown): value is ResumeDraftLocaleContent =>
  typeof value === 'object' && value !== null;

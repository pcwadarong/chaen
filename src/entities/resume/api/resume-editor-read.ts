import type { Locale } from '@/entities/editor/model/editor-types';
import type { PdfFileContent } from '@/entities/pdf-file';
import {
  buildPdfFileDownloadPath,
  getPdfFileAvailability,
  getPdfFileContentConfig,
} from '@/entities/pdf-file';
import { getPdfFileStorageConfig } from '@/entities/pdf-file/model/config';
import { createOptionalServiceRoleSupabaseClient } from '@/shared/lib/supabase/service-role';

import 'server-only';

import type {
  ResumeDraftSeed,
  ResumeEditorContentMap,
  ResumeEditorSeed,
} from '../model/resume-editor.types';
import {
  createDefaultResumeEditorContentMap,
  getResumeEditorSavedAt,
  mergeResumeEditorSeedWithDraft,
  toResumeEditorContent,
} from '../model/resume-editor.utils';

type ResumeDraftRow = {
  contents: Record<string, unknown> | null;
  id: string;
  pdf_file_path: string | null;
  updated_at: string;
};

type ResumeDraftLocaleContent = {
  body?: string;
  description?: string;
  download_button_label?: string;
  download_unavailable_label?: string;
  title?: string;
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
 * resume 편집 화면에서 사용할 초기 콘텐츠와 PDF 게시 상태를 함께 반환합니다.
 */
export const getResumeEditorSeed = async ({
  draftId,
}: {
  draftId?: string;
} = {}): Promise<ResumeEditorSeed> => {
  const [rows, isPdfReady] = await Promise.all([
    getResumeEditorRows(),
    getPdfFileAvailability({
      kind: 'resume',
    }).catch(() => false),
  ]);
  const contentMap = createDefaultResumeEditorContentMap();

  rows.forEach(row => {
    const normalizedLocale = row.locale.toLowerCase();

    if (!isResumeLocale(normalizedLocale)) {
      return;
    }

    contentMap[normalizedLocale] = toResumeEditorContent(row);
  });

  const storageConfig = getPdfFileStorageConfig('resume');

  const seed: ResumeEditorSeed = {
    initialDraftId: null,
    initialContents: contentMap,
    initialPublishSettings: {
      downloadFileName: storageConfig.downloadFileName,
      downloadPath: buildPdfFileDownloadPath('resume'),
      filePath: storageConfig.filePath,
      isPdfReady,
    },
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
    throw new Error('[resume-editor] service role env is not configured');
  }
  const { tableName } = getPdfFileContentConfig('resume');
  const { data, error } = await supabase.from(tableName).select('*');

  if (error) {
    throw new Error(`[resume-editor] 콘텐츠 조회 실패: ${error.message}`);
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
    throw new Error('[resume-editor] service role env is not configured');
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
    throw new Error(`[resume-editor] draft 조회 실패: ${error.message}`);
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
      download_button_label:
        typeof normalizedDraftContent?.download_button_label === 'string'
          ? normalizedDraftContent.download_button_label
          : '',
      download_unavailable_label:
        typeof normalizedDraftContent?.download_unavailable_label === 'string'
          ? normalizedDraftContent.download_unavailable_label
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

import type { PdfFileContent } from '@/entities/pdf-file';
import {
  buildPdfFileDownloadPath,
  getPdfFileAvailability,
  getPdfFileContentConfig,
} from '@/entities/pdf-file';
import { getPdfFileStorageConfig } from '@/entities/pdf-file/model/config';
import { createServerSupabaseClient } from '@/shared/lib/supabase/server';
import type { Locale } from '@/widgets/editor/model/editor-core.types';

import 'server-only';

import type { ResumeEditorContentMap, ResumeEditorSeed } from '../model/resume-editor.types';
import {
  createDefaultResumeEditorContentMap,
  getResumeEditorSavedAt,
  toResumeEditorContent,
} from '../model/resume-editor.utils';

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
export const getResumeEditorSeed = async (): Promise<ResumeEditorSeed> => {
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

  return {
    initialContents: contentMap,
    initialPublishSettings: {
      downloadFileName: storageConfig.downloadFileName,
      downloadPath: buildPdfFileDownloadPath('resume'),
      filePath: storageConfig.filePath,
      isPdfReady,
    },
    initialSavedAt: getResumeEditorSavedAt(rows),
  };
};

/**
 * resume 편집 화면이 다루는 locale 레코드를 Supabase에서 조회합니다.
 */
const getResumeEditorRows = async (): Promise<PdfFileContent[]> => {
  const supabase = await createServerSupabaseClient();
  const { tableName } = getPdfFileContentConfig('resume');
  const { data, error } = await supabase.from(tableName).select('*');

  if (error) {
    throw new Error(`[resume-editor] 콘텐츠 조회 실패: ${error.message}`);
  }

  return ((data ?? []) as PdfFileContent[]).filter(row => isResumeLocale(row.locale.toLowerCase()));
};

/**
 * resume 편집 화면이 다루는 locale인지 판별합니다.
 */
const isResumeLocale = (locale: string): locale is Locale =>
  locale === 'ko' || locale === 'en' || locale === 'ja' || locale === 'fr';

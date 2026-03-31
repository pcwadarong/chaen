import type {
  PdfFileAssetKey,
  PdfFileAssetLocale,
  PdfFileContent,
  PdfFileKind,
  PdfFileStorageConfig,
} from '@/entities/pdf-file/model/types';
import {
  type ContentStorageBucket,
  createContentStoragePath,
  STORAGE_BUCKET,
  STORAGE_DIRECTORY,
} from '@/shared/lib/storage/storage-path';

type PdfFileContentConfig = {
  tableName: string;
};

type PdfFileAssetDefinition = {
  envFileName?: string;
  kind: PdfFileKind;
  locale: PdfFileAssetLocale;
  title: string;
};

const DEFAULT_PDF_FILE_ASSET_KEY_BY_KIND: Record<PdfFileKind, PdfFileAssetKey> = {
  portfolio: 'portfolio-en',
  resume: 'resume-en',
};

const PDF_FILE_ASSET_KEY_ORDER: PdfFileAssetKey[] = [
  'resume-ko',
  'resume-en',
  'portfolio-ko',
  'portfolio-en',
];

const PDF_FILE_ASSET_DEFINITION_BY_KEY: Record<PdfFileAssetKey, PdfFileAssetDefinition> = {
  'portfolio-en': {
    envFileName: process.env.NEXT_PUBLIC_PDF_PORTFOLIO_EN_NAME,
    kind: 'portfolio',
    locale: 'en',
    title: '포트폴리오 PDF · 영문',
  },
  'portfolio-ko': {
    envFileName: process.env.NEXT_PUBLIC_PDF_PORTFOLIO_KO_NAME,
    kind: 'portfolio',
    locale: 'ko',
    title: '포트폴리오 PDF · 국문',
  },
  'resume-en': {
    envFileName: process.env.NEXT_PUBLIC_PDF_RESUME_EN_NAME,
    kind: 'resume',
    locale: 'en',
    title: '이력서 PDF · 영문',
  },
  'resume-ko': {
    envFileName: process.env.NEXT_PUBLIC_PDF_RESUME_KO_NAME,
    kind: 'resume',
    locale: 'ko',
    title: '이력서 PDF · 국문',
  },
};

const DEFAULT_PDF_FILE_NAME_BY_ASSET_KEY: Record<PdfFileAssetKey, string> = {
  'portfolio-en': 'ParkChaewon-Portfolio-en.pdf',
  'portfolio-ko': 'ParkChaewon-Portfolio-kr.pdf',
  'resume-en': 'ParkChaewon-Resume-en.pdf',
  'resume-ko': 'ParkChaewon-Resume-kr.pdf',
};

/**
 * PDF 자산 키별 storage 버킷을 반환합니다.
 *
 * resume 자산은 resume 버킷, portfolio 자산은 project 버킷 내부 `pdf/` 디렉터리에 저장합니다.
 *
 * @param assetKey 조회할 PDF 자산 키입니다.
 * @returns 자산 키에 대응하는 storage 버킷 이름입니다.
 */
const getPdfFileStorageBucket = (assetKey: PdfFileAssetKey): ContentStorageBucket =>
  assetKey.startsWith('resume-') ? STORAGE_BUCKET.resume : STORAGE_BUCKET.project;

/**
 * PDF 자산 키별 storage object path를 반환합니다.
 *
 * @param fileName 실제 저장할 파일명입니다.
 * @returns 자산 키 정책에 맞는 storage object path입니다.
 */
const getPdfFileStoragePath = (fileName: string) =>
  createContentStoragePath(STORAGE_DIRECTORY.pdf, fileName);

const SHARED_PDF_FILE_CONTENT_TABLE_NAME = 'resume_contents';

/**
 * 특정 PDF 자산 키의 Supabase Storage 설정을 반환합니다.
 */
export const getPdfFileAssetStorageConfig = (assetKey: PdfFileAssetKey): PdfFileStorageConfig => {
  const assetDefinition = PDF_FILE_ASSET_DEFINITION_BY_KEY[assetKey];
  const resolvedFileName =
    assetDefinition.envFileName ?? DEFAULT_PDF_FILE_NAME_BY_ASSET_KEY[assetKey];

  return {
    assetKey,
    bucket: getPdfFileStorageBucket(assetKey),
    downloadFileName: resolvedFileName,
    filePath: getPdfFileStoragePath(resolvedFileName),
    kind: assetDefinition.kind,
    locale: assetDefinition.locale,
    title: assetDefinition.title,
  };
};

/**
 * 특정 PDF 종류가 공개 다운로드에서 사용할 기본 자산 키를 반환합니다.
 */
export const getDefaultPdfFileAssetKey = (kind: PdfFileKind): PdfFileAssetKey =>
  DEFAULT_PDF_FILE_ASSET_KEY_BY_KIND[kind];

/**
 * PDF 자산 전체 목록을 관리자 화면 순서에 맞춰 반환합니다.
 */
export const listPdfFileAssetStorageConfigs = (): PdfFileStorageConfig[] =>
  PDF_FILE_ASSET_KEY_ORDER.map(assetKey => getPdfFileAssetStorageConfig(assetKey));

/**
 * 특정 PDF 종류에 연결된 자산 목록을 관리자/공개 노출 순서대로 반환합니다.
 */
export const listPdfFileAssetStorageConfigsByKind = (kind: PdfFileKind): PdfFileStorageConfig[] =>
  listPdfFileAssetStorageConfigs().filter(storageConfig => storageConfig.kind === kind);

/**
 * PDF 종류별 기본 Supabase Storage 설정을 반환합니다.
 * 기존 공개 다운로드 경로는 kind별 기본 자산(영문 파일명)을 사용합니다.
 */
export const getPdfFileStorageConfig = (kind: PdfFileKind): PdfFileStorageConfig =>
  getPdfFileAssetStorageConfig(getDefaultPdfFileAssetKey(kind));

/**
 * PDF 소개 콘텐츠 조회 설정을 반환합니다.
 * 현재 소개 콘텐츠는 `resume_contents` 테이블을 공용으로 사용합니다.
 */
export const getPdfFileContentConfig = (_kind: PdfFileKind): PdfFileContentConfig => ({
  tableName: SHARED_PDF_FILE_CONTENT_TABLE_NAME,
});

const DEFAULT_PDF_FILE_CONTENT_UPDATED_AT = '1970-01-01T00:00:00.000Z';
const DEFAULT_PDF_FILE_CONTENT_TEXT = {
  title: '박채원 (Park Chaewon)',
  description: 'Web Frontend Developer',
  body: `사용자 경험을 시각적 설계와 공학적 구조로 완성하는 프론트엔드 개발자 입니다.
시각적 완성도와 성능 사이의 균형을 설계하며, 직관적이고 몰입도 높은 사용자 경험을 구현합니다.
사용자의 행동과 인지 흐름을 기준으로 인터랙션 구조를 설계하고,
렌더링 · 성능 · 접근성까지 고려해 경험의 완성도를 높입니다.
CS 기반의 문제 분석 역량을 바탕으로 구현 방식을 선택하며,
AI와 자동화 도구를 프로세스에 통합해 개발 효율과 품질을 함께 개선합니다.`,
} satisfies Omit<PdfFileContent, 'locale' | 'updated_at'>;

/**
 * PDF 소개 콘텐츠 조회 실패 시 사용할 기본값을 생성합니다.
 */
export const createDefaultPdfFileContent = (locale: string): PdfFileContent => ({
  locale: locale.toLowerCase().split('-')[0] ?? 'en',
  ...DEFAULT_PDF_FILE_CONTENT_TEXT,
  updated_at: DEFAULT_PDF_FILE_CONTENT_UPDATED_AT,
});

/**
 * PDF 소개 콘텐츠의 종류입니다.
 * - `resume`: 이력서 페이지에서 사용하는 소개 콘텐츠
 * - `portfolio`: 프로젝트 페이지에서 사용하는 소개 콘텐츠
 */
export type PdfFileKind = 'resume' | 'portfolio';

/**
 * PDF 자산의 파일명/다운로드 변형을 구분하는 locale 키입니다.
 * - `ko`: 국문 파일명 자산
 * - `en`: 영문 파일명 자산
 */
export type PdfFileAssetLocale = 'ko' | 'en';

/**
 * 공개 PDF 다운로드가 발생한 화면 위치를 구분하는 source 값입니다.
 */
export type PdfFileDownloadSource = 'resume-page' | 'project-page';

/**
 * 다운로드 요청의 기기 분류 값입니다.
 */
export type PdfFileDownloadDeviceType = 'mobile' | 'tablet' | 'desktop' | 'bot' | 'unknown';

/**
 * 관리자에서 개별 업로드/다운로드 확인 대상으로 관리하는 PDF 자산 키입니다.
 */
export type PdfFileAssetKey = 'resume-ko' | 'resume-en' | 'portfolio-ko' | 'portfolio-en';

const PDF_FILE_ASSET_KEYS = [
  'resume-ko',
  'resume-en',
  'portfolio-ko',
  'portfolio-en',
] as const satisfies readonly PdfFileAssetKey[];

const PDF_FILE_DOWNLOAD_SOURCES = [
  'resume-page',
  'project-page',
] as const satisfies readonly PdfFileDownloadSource[];

const PDF_FILE_DOWNLOAD_DEVICE_TYPES = [
  'mobile',
  'tablet',
  'desktop',
  'bot',
  'unknown',
] as const satisfies readonly PdfFileDownloadDeviceType[];

/**
 * 공개 페이지에서 사용하는 PDF 다운로드 옵션입니다.
 */
export type PdfFileDownloadOption = {
  assetKey: PdfFileAssetKey;
  fileName: string;
  href: string | null;
  locale: PdfFileAssetLocale;
};

/**
 * PDF 다운로드 로그 생성에 필요한 입력 타입입니다.
 */
export type CreatePdfDownloadLogInput = {
  assetKey: PdfFileAssetKey;
  countryCode: string | null;
  deviceType: PdfFileDownloadDeviceType;
  fileLocale: PdfFileAssetLocale;
  ip: string | null;
  kind: PdfFileKind;
  referer: string | null;
  refererPath: string | null;
  source: PdfFileDownloadSource;
  utmSource: string | null;
};

/**
 * Supabase `pdf_download_logs` 테이블의 레코드 타입입니다.
 */
export type PdfFileDownloadLog = {
  asset_key: PdfFileAssetKey;
  country_code: string | null;
  created_at: string;
  device_type: PdfFileDownloadDeviceType;
  file_locale: PdfFileAssetLocale;
  id: string;
  ip: string | null;
  kind: PdfFileKind;
  referer: string | null;
  referer_path: string | null;
  source: PdfFileDownloadSource;
  utm_source: string | null;
};

/**
 * 주어진 문자열이 지원하는 PDF 파일 종류인지 확인합니다.
 */
export const isPdfFileKind = (value: string): value is PdfFileKind =>
  value === 'resume' || value === 'portfolio';

/**
 * 주어진 문자열이 지원하는 PDF 자산 키인지 확인합니다.
 */
export const isPdfFileAssetKey = (value: string): value is PdfFileAssetKey =>
  PDF_FILE_ASSET_KEYS.includes(value as PdfFileAssetKey);

/**
 * 주어진 문자열이 지원하는 PDF 다운로드 source인지 확인합니다.
 */
export const isPdfFileDownloadSource = (value: string): value is PdfFileDownloadSource =>
  PDF_FILE_DOWNLOAD_SOURCES.includes(value as PdfFileDownloadSource);

/**
 * 주어진 문자열이 지원하는 PDF 다운로드 device type인지 확인합니다.
 */
export const isPdfFileDownloadDeviceType = (value: string): value is PdfFileDownloadDeviceType =>
  PDF_FILE_DOWNLOAD_DEVICE_TYPES.includes(value as PdfFileDownloadDeviceType);

/**
 * Supabase의 PDF 소개 콘텐츠 테이블에서 사용하는 레코드 타입입니다.
 */
export type PdfFileContent = {
  body: string;
  description: string;
  locale: string;
  title: string;
  updated_at: string;
};

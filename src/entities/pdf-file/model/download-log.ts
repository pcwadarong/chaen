import type {
  PdfFileDownloadDeviceType,
  PdfFileDownloadSource,
  PdfFileKind,
} from '@/entities/pdf-file/model/types';

/**
 * PDF 다운로드 로그를 저장하는 테이블 이름입니다.
 */
export const PDF_DOWNLOAD_LOG_TABLE_NAME = 'pdf_download_logs';

type ExtractPdfDownloadRequestMetadataInput = {
  request: Request;
};

type PdfDownloadRequestMetadata = {
  countryCode: string | null;
  deviceType: PdfFileDownloadDeviceType;
  ip: string | null;
  referer: string | null;
  refererPath: string | null;
  utmSource: string | null;
};

const BOT_USER_AGENT_PATTERN =
  /bot|crawler|spider|slurp|bingpreview|facebookexternalhit|discordbot|slackbot|whatsapp|telegrambot/i;
const TABLET_USER_AGENT_PATTERN = /ipad|tablet|playbook|silk|(android(?!.*mobile))/i;
const MOBILE_USER_AGENT_PATTERN =
  /mobile|iphone|ipod|android.*mobile|windows phone|blackberry|opera mini/i;

/**
 * 다운로드 source가 기대하는 PDF kind와 일치하는지 확인합니다.
 */
export const doesPdfDownloadSourceMatchKind = (
  source: PdfFileDownloadSource,
  kind: PdfFileKind,
): boolean => {
  if (source === 'resume-page') return kind === 'resume';
  if (source === 'project-page') return kind === 'portfolio';

  return false;
};

/**
 * 요청 헤더에서 PDF 다운로드 로그 메타데이터를 추출합니다.
 */
export const extractPdfDownloadRequestMetadata = ({
  request,
}: ExtractPdfDownloadRequestMetadataInput): PdfDownloadRequestMetadata => {
  const requestUrl = new URL(request.url);
  const refererHeader = readHeader(request.headers, ['referer', 'referrer']);
  const refererUrl = parseUrlSafely(refererHeader);
  const referer = normalizeOptionalValue(refererUrl?.origin);
  const refererPath =
    refererUrl && refererUrl.origin === requestUrl.origin ? refererUrl.pathname : null;

  return {
    countryCode: resolveCountryCode(request.headers),
    deviceType: resolvePdfDownloadDeviceType(readHeader(request.headers, ['user-agent'])),
    ip: resolveIpAddress(request.headers),
    referer,
    refererPath,
    utmSource: normalizeOptionalValue(refererUrl?.searchParams.get('utm_source')),
  };
};

/**
 * User-Agent 문자열을 단순한 기기 분류 값으로 변환합니다.
 */
export const resolvePdfDownloadDeviceType = (
  userAgent: string | null,
): PdfFileDownloadDeviceType => {
  const normalizedUserAgent = normalizeOptionalValue(userAgent);
  if (!normalizedUserAgent) return 'unknown';
  if (BOT_USER_AGENT_PATTERN.test(normalizedUserAgent)) return 'bot';
  if (TABLET_USER_AGENT_PATTERN.test(normalizedUserAgent)) return 'tablet';
  if (MOBILE_USER_AGENT_PATTERN.test(normalizedUserAgent)) return 'mobile';

  return 'desktop';
};

/**
 * 프록시 헤더에서 첫 번째 클라이언트 IP를 안전하게 추출합니다.
 */
export const resolveIpAddress = (headers: Headers): string | null => {
  const forwardedFor = normalizeOptionalValue(headers.get('x-forwarded-for'));

  if (forwardedFor) {
    const [firstForwardedFor] = forwardedFor.split(',');
    const normalizedForwardedFor = normalizeOptionalValue(firstForwardedFor);
    if (normalizedForwardedFor) return normalizedForwardedFor;
  }

  return readHeader(headers, ['x-real-ip', 'cf-connecting-ip']);
};

/**
 * 배포 플랫폼 헤더에서 국가 코드를 읽어옵니다.
 */
export const resolveCountryCode = (headers: Headers): string | null => {
  const countryCode = readHeader(headers, ['x-vercel-ip-country', 'cf-ipcountry']);
  if (!countryCode) return null;

  return countryCode.toUpperCase();
};

/**
 * 지정한 헤더 이름 목록에서 첫 번째 유효한 값을 반환합니다.
 */
const readHeader = (headers: Headers, headerNames: string[]): string | null => {
  for (const headerName of headerNames) {
    const value = normalizeOptionalValue(headers.get(headerName));
    if (value) return value;
  }

  return null;
};

/**
 * 비어 있거나 공백뿐인 문자열을 null로 정규화합니다.
 */
const normalizeOptionalValue = (value: string | null | undefined): string | null => {
  const normalizedValue = value?.trim();
  if (!normalizedValue) return null;

  return normalizedValue;
};

/**
 * URL 파싱이 실패하면 null을 반환합니다.
 */
const parseUrlSafely = (value: string | null): URL | null => {
  if (!value) return null;

  try {
    return new URL(value);
  } catch {
    return null;
  }
};

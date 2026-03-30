import 'server-only';

export type GoogleSearchConsoleConfig = {
  clientEmail: string;
  privateKey: string;
  siteUrl: string;
};

/**
 * Google Search Console 설정용 환경변수를 읽어 공백을 정리한 원시 값을 반환합니다.
 *
 * - `clientEmail`: `GOOGLE_SEARCH_CONSOLE_CLIENT_EMAIL`에서 읽습니다.
 * - `privateKey`: `GOOGLE_SEARCH_CONSOLE_PRIVATE_KEY`에서 읽습니다.
 * - `siteUrl`: `GOOGLE_SEARCH_CONSOLE_SITE_URL`에서 읽습니다.
 *
 * 각 값은 존재할 때 `.trim()`으로 정규화되며, 환경변수가 없으면 `undefined`를 유지합니다.
 * 빈 문자열만 들어 있는 경우에는 `.trim()` 결과가 빈 문자열(`''`)이 될 수 있으며,
 * 이 단계에서는 아직 `null`로 바꾸지 않습니다.
 */
const readGoogleSearchConsoleEnv = () => ({
  clientEmail: process.env.GOOGLE_SEARCH_CONSOLE_CLIENT_EMAIL?.trim(),
  privateKey: process.env.GOOGLE_SEARCH_CONSOLE_PRIVATE_KEY?.trim(),
  siteUrl: process.env.GOOGLE_SEARCH_CONSOLE_SITE_URL?.trim(),
});

/**
 * Google Search Console 서비스 계정 설정을 안전하게 읽어 유효할 때만 반환합니다.
 *
 * 내부에서는 `readGoogleSearchConsoleEnv()`가 읽은 문자열 값을 다시 검사해
 * `clientEmail`, `privateKey`, `siteUrl` 세 필드가 모두 비어 있지 않은지 확인합니다.
 * 세 값 중 하나라도 `undefined`, 빈 문자열, 공백 문자열이면 `null`을 반환합니다.
 *
 * 유효한 경우에는 `GOOGLE_SEARCH_CONSOLE_PRIVATE_KEY`의 `\\n` 시퀀스를 실제 개행으로 복원해
 * 서비스 계정 PEM 키 형식으로 반환합니다.
 *
 * 호출자는 반환값이 `null`일 수 있으므로 항상 null 체크 후 사용해야 합니다.
 */
export const getGoogleSearchConsoleConfigOptional = (): GoogleSearchConsoleConfig | null => {
  const env = readGoogleSearchConsoleEnv();
  if (!env.clientEmail || !env.privateKey || !env.siteUrl) return null;

  return {
    clientEmail: env.clientEmail,
    privateKey: env.privateKey.replace(/\\n/g, '\n'),
    siteUrl: env.siteUrl,
  };
};

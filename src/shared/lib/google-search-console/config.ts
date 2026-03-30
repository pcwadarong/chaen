import 'server-only';

export type GoogleSearchConsoleConfig = {
  clientEmail: string;
  privateKey: string;
  siteUrl: string;
};

const readGoogleSearchConsoleEnv = () => ({
  clientEmail: process.env.GOOGLE_SEARCH_CONSOLE_CLIENT_EMAIL?.trim(),
  privateKey: process.env.GOOGLE_SEARCH_CONSOLE_PRIVATE_KEY?.trim(),
  siteUrl: process.env.GOOGLE_SEARCH_CONSOLE_SITE_URL?.trim(),
});

/**
 * Google Search Console 서비스 계정 설정을 optional하게 읽습니다.
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

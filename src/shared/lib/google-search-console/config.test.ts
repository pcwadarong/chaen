/**
 * @vitest-environment node
 */

import { afterEach, describe, expect, it } from 'vitest';

import { getGoogleSearchConsoleConfigOptional } from '@/shared/lib/google-search-console/config';

describe('getGoogleSearchConsoleConfigOptional', () => {
  const originalClientEmail = process.env.GOOGLE_SEARCH_CONSOLE_CLIENT_EMAIL;
  const originalPrivateKey = process.env.GOOGLE_SEARCH_CONSOLE_PRIVATE_KEY;
  const originalSiteUrl = process.env.GOOGLE_SEARCH_CONSOLE_SITE_URL;

  afterEach(() => {
    if (originalClientEmail === undefined) {
      delete process.env.GOOGLE_SEARCH_CONSOLE_CLIENT_EMAIL;
    } else {
      process.env.GOOGLE_SEARCH_CONSOLE_CLIENT_EMAIL = originalClientEmail;
    }

    if (originalPrivateKey === undefined) {
      delete process.env.GOOGLE_SEARCH_CONSOLE_PRIVATE_KEY;
    } else {
      process.env.GOOGLE_SEARCH_CONSOLE_PRIVATE_KEY = originalPrivateKey;
    }

    if (originalSiteUrl === undefined) {
      delete process.env.GOOGLE_SEARCH_CONSOLE_SITE_URL;
    } else {
      process.env.GOOGLE_SEARCH_CONSOLE_SITE_URL = originalSiteUrl;
    }
  });

  it('필수 설정이 모두 있으면 private key 개행을 복원해 반환해야 한다', () => {
    process.env.GOOGLE_SEARCH_CONSOLE_CLIENT_EMAIL = 'bot@example.iam.gserviceaccount.com';
    process.env.GOOGLE_SEARCH_CONSOLE_PRIVATE_KEY = 'line-1\\nline-2';
    process.env.GOOGLE_SEARCH_CONSOLE_SITE_URL = 'sc-domain:chaen.dev';

    expect(getGoogleSearchConsoleConfigOptional()).toEqual({
      clientEmail: 'bot@example.iam.gserviceaccount.com',
      privateKey: 'line-1\nline-2',
      siteUrl: 'sc-domain:chaen.dev',
    });
  });

  it('필수 설정 중 하나라도 없으면 null을 반환해야 한다', () => {
    delete process.env.GOOGLE_SEARCH_CONSOLE_CLIENT_EMAIL;
    process.env.GOOGLE_SEARCH_CONSOLE_PRIVATE_KEY = 'line-1\\nline-2';
    process.env.GOOGLE_SEARCH_CONSOLE_SITE_URL = 'sc-domain:chaen.dev';

    expect(getGoogleSearchConsoleConfigOptional()).toBeNull();
  });
});

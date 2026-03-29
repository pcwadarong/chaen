/* @vitest-environment node */

import { describe, expect, it } from 'vitest';

import { isAuthSessionMissingError } from '@/shared/lib/auth/is-auth-session-missing-error';

describe('isAuthSessionMissingError', () => {
  it('세션 누락 메시지면 true를 반환한다', () => {
    expect(isAuthSessionMissingError('Auth session missing!')).toBe(true);
  });

  it('refresh token 누락 메시지면 true를 반환한다', () => {
    expect(isAuthSessionMissingError('Invalid Refresh Token: Refresh Token Not Found')).toBe(true);
  });

  it('대소문자가 달라도 refresh token 누락 메시지를 인식한다', () => {
    expect(isAuthSessionMissingError('INVALID REFRESH TOKEN: REFRESH TOKEN NOT FOUND')).toBe(true);
  });

  it('다른 인증 에러면 false를 반환한다', () => {
    expect(isAuthSessionMissingError('fetch failed')).toBe(false);
  });
});

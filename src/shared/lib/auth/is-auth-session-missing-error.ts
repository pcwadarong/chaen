/**
 * Supabase 인증 에러가 "세션 없음" 계열의 정상 초기 상태인지 판별합니다.
 *
 * @param message Supabase가 반환한 인증 에러 메시지입니다. `null` 또는 `undefined`도 허용하며, 내부에서 소문자로 정규화합니다.
 * @returns 메시지가 세션 누락 또는 refresh token 부재/무효 상황을 뜻하면 `true`, 그 외에는 `false`를 반환합니다.
 *
 * @example
 * isAuthSessionMissingError('Auth session missing!')
 * isAuthSessionMissingError('Invalid Refresh Token: Refresh Token Not Found')
 */
export const isAuthSessionMissingError = (message: string | null | undefined) => {
  const normalizedMessage = message?.toLowerCase() ?? '';

  return (
    normalizedMessage.includes('auth session missing') ||
    normalizedMessage.includes('invalid refresh token') ||
    normalizedMessage.includes('refresh token not found')
  );
};

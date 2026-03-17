/**
 * `redirect()`에 넘겨도 되는 내부 상대 경로인지 검사합니다.
 *
 * `//example.com` 형태의 protocol-relative URL은 외부 이동으로 이어질 수 있으므로 차단합니다.
 */
export const isSafeRedirectPath = (value: string) =>
  value.startsWith('/') && !value.startsWith('//');

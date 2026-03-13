export const AUTH_ACTION_ERROR_CODE = {
  invalidCredentials: 'auth.invalidCredentials',
  sessionMissing: 'auth.sessionMissing',
  signInFailed: 'auth.signInFailed',
  signOutFailed: 'auth.signOutFailed',
} as const;

export type AuthActionErrorCode =
  (typeof AUTH_ACTION_ERROR_CODE)[keyof typeof AUTH_ACTION_ERROR_CODE];

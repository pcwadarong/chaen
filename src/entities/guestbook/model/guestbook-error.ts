export const GUESTBOOK_ERROR_CODE = {
  adminAuthRequired: 'guestbook.adminAuthRequired',
  contentRequired: 'guestbook.contentRequired',
  contentTooLong: 'guestbook.contentTooLong',
  createFailed: 'guestbook.createFailed',
  deleteFailed: 'guestbook.deleteFailed',
  entryIdRequired: 'guestbook.entryIdRequired',
  entryNotFound: 'guestbook.entryNotFound',
  invalidPassword: 'guestbook.invalidPassword',
  nameRequired: 'guestbook.nameRequired',
  parentEntryNotFound: 'guestbook.parentEntryNotFound',
  parentPasswordMissing: 'guestbook.parentPasswordMissing',
  passwordRequired: 'guestbook.passwordRequired',
  serviceRoleUnavailable: 'guestbook.serviceRoleUnavailable',
  updateFailed: 'guestbook.updateFailed',
} as const;

export type GuestbookErrorCode = (typeof GUESTBOOK_ERROR_CODE)[keyof typeof GUESTBOOK_ERROR_CODE];

const GUESTBOOK_ERROR_MESSAGE: Record<GuestbookErrorCode, string> = {
  [GUESTBOOK_ERROR_CODE.adminAuthRequired]: 'admin auth required',
  [GUESTBOOK_ERROR_CODE.contentRequired]: 'content is required',
  [GUESTBOOK_ERROR_CODE.contentTooLong]: 'content length must be 3000 or less',
  [GUESTBOOK_ERROR_CODE.createFailed]: 'failed to create entry',
  [GUESTBOOK_ERROR_CODE.deleteFailed]: 'failed to delete entry',
  [GUESTBOOK_ERROR_CODE.entryIdRequired]: 'entryId is required',
  [GUESTBOOK_ERROR_CODE.entryNotFound]: 'entry not found',
  [GUESTBOOK_ERROR_CODE.invalidPassword]: 'invalid password',
  [GUESTBOOK_ERROR_CODE.nameRequired]: 'authorName is required',
  [GUESTBOOK_ERROR_CODE.parentEntryNotFound]: 'parent entry not found',
  [GUESTBOOK_ERROR_CODE.parentPasswordMissing]: 'parent password is missing',
  [GUESTBOOK_ERROR_CODE.passwordRequired]: 'password is required',
  [GUESTBOOK_ERROR_CODE.serviceRoleUnavailable]: 'service role env is not configured',
  [GUESTBOOK_ERROR_CODE.updateFailed]: 'failed to update entry',
};

type GuestbookError = Error & {
  code?: GuestbookErrorCode;
};

/**
 * 방명록 도메인 오류를 코드 기반으로 생성합니다.
 */
export const createGuestbookError = (code: GuestbookErrorCode, detail?: string): GuestbookError => {
  const baseMessage = GUESTBOOK_ERROR_MESSAGE[code];
  const error = new Error(detail ? `${baseMessage}: ${detail}` : baseMessage) as GuestbookError;

  error.code = code;

  return error;
};

/**
 * 임의 오류에서 방명록 도메인 오류 코드를 추출합니다.
 */
export const resolveGuestbookErrorCode = (error: unknown): GuestbookErrorCode | null => {
  if (!(error instanceof Error)) {
    return null;
  }

  const code = (error as GuestbookError).code;

  return code && Object.values(GUESTBOOK_ERROR_CODE).includes(code) ? code : null;
};

/**
 * 오류가 특정 방명록 도메인 코드와 일치하는지 검사합니다.
 */
export const hasGuestbookErrorCode = (error: unknown, code: GuestbookErrorCode): boolean =>
  resolveGuestbookErrorCode(error) === code;

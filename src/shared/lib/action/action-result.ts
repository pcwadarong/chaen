export type ActionResult<T> = {
  data: T | null;
  errorCode?: string | null;
  errorMessage: string | null;
  ok: boolean;
};

/**
 * Server Action의 초기 상태를 생성합니다.
 */
export const createInitialActionResult = <T>(): ActionResult<T> => ({
  data: null,
  errorMessage: null,
  ok: false,
});

/**
 * Server Action 성공 결과를 공통 형태로 생성합니다.
 */
export const createActionSuccess = <T>(data: T): ActionResult<T> => ({
  data,
  errorMessage: null,
  ok: true,
});

/**
 * Server Action 실패 결과를 공통 형태로 생성합니다.
 */
export const createActionFailure = <T>(
  errorMessage: string,
  errorCode?: string | null,
): ActionResult<T> => ({
  ...(errorCode ? { errorCode } : {}),
  data: null,
  errorMessage,
  ok: false,
});

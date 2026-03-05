/**
 * unknown 타입 에러를 안전한 문자열 메시지로 정규화합니다.
 */
export const getErrorMessage = (error: unknown, fallbackMessage = 'unknown error'): string => {
  if (error instanceof Error) return error.message;

  return fallbackMessage;
};

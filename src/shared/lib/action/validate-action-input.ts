import type { ZodType } from 'zod';

type ValidationFailure = {
  data: null;
  errorMessage: string;
  ok: false;
};

type ValidationSuccess<T> = {
  data: T;
  errorMessage: null;
  ok: true;
};

type ValidationResult<T> = ValidationFailure | ValidationSuccess<T>;

const DEFAULT_VALIDATION_ERROR_MESSAGE = '입력값을 다시 확인해주세요.';

/**
 * Zod 스키마로 Server Action 입력값을 검증하고 첫 번째 오류 메시지를 반환합니다.
 */
export const validateActionInput = <T>(schema: ZodType<T>, input: unknown): ValidationResult<T> => {
  const parsed = schema.safeParse(input);

  if (!parsed.success) {
    return {
      data: null,
      errorMessage: parsed.error.issues[0]?.message ?? DEFAULT_VALIDATION_ERROR_MESSAGE,
      ok: false,
    };
  }

  return {
    data: parsed.data,
    errorMessage: null,
    ok: true,
  };
};

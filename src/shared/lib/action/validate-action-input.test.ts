import { z } from 'zod';

import { validateActionInput } from '@/shared/lib/action/validate-action-input';

describe('validateActionInput', () => {
  it('유효한 입력값이면 파싱된 데이터를 반환한다', () => {
    const schema = z.object({
      email: z.email(),
      password: z.string().min(8),
    });

    expect(
      validateActionInput(schema, {
        email: 'admin@example.com',
        password: 'password123',
      }),
    ).toEqual({
      data: {
        email: 'admin@example.com',
        password: 'password123',
      },
      errorMessage: null,
      ok: true,
    });
  });

  it('유효하지 않은 입력값이면 첫 번째 오류 메시지를 반환한다', () => {
    const schema = z.object({
      email: z.email('이메일 형식이 올바르지 않습니다.'),
      password: z.string().min(8, '비밀번호는 8자 이상이어야 합니다.'),
    });

    expect(
      validateActionInput(schema, {
        email: 'wrong-email',
        password: '1234',
      }),
    ).toEqual({
      data: null,
      errorMessage: '이메일 형식이 올바르지 않습니다.',
      ok: false,
    });
  });
});

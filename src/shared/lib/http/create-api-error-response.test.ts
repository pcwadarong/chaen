import { createApiErrorResponse } from './create-api-error-response';

describe('createApiErrorResponse', () => {
  it('기본 상태코드와 reason을 포함한 에러 응답을 반환한다', async () => {
    const response = createApiErrorResponse({
      defaultStatus: 500,
      error: new Error('db failed'),
    });

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      ok: false,
      reason: 'db failed',
    });
  });

  it('reason별 상태코드 매핑이 있으면 우선 적용한다', async () => {
    const response = createApiErrorResponse({
      defaultStatus: 400,
      error: new Error('invalid password'),
      statusByReason: {
        'invalid password': 403,
      },
    });

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({
      ok: false,
      reason: 'invalid password',
    });
  });
});

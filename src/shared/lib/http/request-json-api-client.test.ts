import { createApiRequestError, requestJsonApiClient } from './request-json-api-client';

/**
 * JSON 응답 객체를 생성합니다.
 */
const createJsonResponse = (payload: unknown, status = 200): Response =>
  new Response(JSON.stringify(payload), {
    status,
    headers: {
      'content-type': 'application/json',
    },
  });

describe('requestJsonApiClient', () => {
  afterEach(() => {
    vi.clearAllMocks();
    vi.unstubAllGlobals();
  });

  it('성공 응답이면 payload를 그대로 반환한다', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        createJsonResponse({
          ok: true,
          data: 'hello',
        }),
      ),
    );

    const payload = await requestJsonApiClient<{ data: string; ok: true }>({
      method: 'GET',
      url: '/api/test',
    });

    expect(payload).toEqual({ ok: true, data: 'hello' });
  });

  it('payload.ok=false면 상태코드를 포함한 에러를 던진다', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        createJsonResponse(
          {
            ok: false,
            reason: 'invalid password',
          },
          403,
        ),
      ),
    );

    await expect(
      requestJsonApiClient({
        method: 'POST',
        url: '/api/test',
      }),
    ).rejects.toMatchObject({
      message: 'invalid password',
      status: 403,
    });
  });

  it('응답 JSON 파싱 실패 시 fallback reason 에러를 던진다', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response('invalid-json', {
          status: 500,
        }),
      ),
    );

    await expect(
      requestJsonApiClient({
        method: 'GET',
        url: '/api/test',
        fallbackReason: 'failed to parse',
      }),
    ).rejects.toMatchObject({
      message: 'failed to parse',
      status: 500,
    });
  });
});

describe('createApiRequestError', () => {
  it('message와 status를 포함한 Error를 생성한다', () => {
    const error = createApiRequestError('failed', 400);

    expect(error.message).toBe('failed');
    expect(error.status).toBe(400);
  });
});

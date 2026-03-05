export type ApiRequestError = Error & {
  status?: number;
};

type JsonApiLikeResponse = {
  ok: boolean;
  reason?: string;
};

type RequestJsonApiClientParams = {
  body?: Record<string, unknown>;
  fallbackReason?: string;
  init?: Omit<RequestInit, 'body' | 'headers' | 'method'>;
  method: 'DELETE' | 'GET' | 'PATCH' | 'POST';
  url: string;
};

/**
 * HTTP 상태코드를 포함할 수 있는 클라이언트 요청 에러를 생성합니다.
 */
export const createApiRequestError = (reason: string, status?: number): ApiRequestError => {
  const error = new Error(reason) as ApiRequestError;
  error.status = status;

  return error;
};

/**
 * 클라이언트에서 JSON API를 호출하고 `{ ok, reason }` 계약을 기준으로 실패를 표준화합니다.
 *
 * - HTTP 에러(`response.ok === false`)와 비즈니스 에러(`payload.ok === false`)를 동일하게 처리합니다.
 * - 실패 시 `ApiRequestError`를 던지며, 가능하면 HTTP status를 포함합니다.
 */
export const requestJsonApiClient = async <T extends JsonApiLikeResponse>({
  body,
  fallbackReason = 'request failed',
  init,
  method,
  url,
}: RequestJsonApiClientParams): Promise<T> => {
  const headers: HeadersInit = body
    ? {
        'content-type': 'application/json',
      }
    : {};

  const response = await fetch(url, {
    ...init,
    body: body ? JSON.stringify(body) : undefined,
    headers,
    method,
  });

  let payload: JsonApiLikeResponse;
  try {
    payload = (await response.json()) as JsonApiLikeResponse;
  } catch {
    throw createApiRequestError(fallbackReason, response.status);
  }

  if (!response.ok || !payload.ok) {
    throw createApiRequestError(payload.reason ?? fallbackReason, response.status);
  }

  return payload as T;
};

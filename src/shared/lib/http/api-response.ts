import { NextResponse } from 'next/server';

export type ApiErrorResponse = {
  error: string;
};

/**
 * route handler에서 공통 에러 응답 형식을 생성합니다.
 */
export const createApiErrorResponse = (error: string, status: number) =>
  NextResponse.json<ApiErrorResponse>({ error }, { status });

'use client';

import type { GuestbookEntry } from '@/entities/guestbook/model/types';

type GuestbookMutationError = Error & {
  status?: number;
};

type GuestbookMutationResponse = {
  entry?: GuestbookEntry;
  ok: boolean;
  reason?: string;
};

type CreateGuestbookEntryInput = {
  authorBlogUrl?: string;
  authorName: string;
  content: string;
  isSecret: boolean;
  parentId?: string | null;
  password: string;
};

/**
 * API 응답 실패를 일관된 Error 객체로 변환합니다.
 */
const buildGuestbookError = (reason: string, status: number): GuestbookMutationError => {
  const error = new Error(reason) as GuestbookMutationError;
  error.status = status;

  return error;
};

/**
 * 공통 JSON API 요청을 수행하고 에러를 표준화합니다.
 */
const requestGuestbook = async <T>(
  url: string,
  method: 'DELETE' | 'PATCH' | 'POST',
  body: Record<string, unknown>,
): Promise<T> => {
  const response = await fetch(url, {
    body: JSON.stringify(body),
    headers: {
      'content-type': 'application/json',
    },
    method,
  });
  const payload = (await response.json()) as GuestbookMutationResponse & Record<string, unknown>;
  if (!response.ok || !payload.ok) {
    throw buildGuestbookError(payload.reason ?? 'request failed', response.status);
  }

  return payload as T;
};

/**
 * 신규 방명록 항목을 생성합니다.
 */
export const createGuestbookEntryClient = async (
  input: CreateGuestbookEntryInput,
): Promise<GuestbookEntry> => {
  const payload = await requestGuestbook<{ entry: GuestbookEntry; ok: true }>(
    '/api/guestbook/entries',
    'POST',
    input,
  );

  return payload.entry;
};

/**
 * 비밀글 본문을 비밀번호 검증 후 조회합니다.
 */
export const verifyGuestbookSecretClient = async (
  entryId: string,
  password: string,
): Promise<GuestbookEntry> => {
  const payload = await requestGuestbook<{ entry: GuestbookEntry; ok: true }>(
    `/api/guestbook/entries/${entryId}/verify-secret`,
    'POST',
    { password },
  );

  return payload.entry;
};

/**
 * 방명록 항목을 수정합니다.
 */
export const updateGuestbookEntryClient = async (
  entryId: string,
  content: string,
  password: string,
): Promise<GuestbookEntry> => {
  const payload = await requestGuestbook<{ entry: GuestbookEntry; ok: true }>(
    `/api/guestbook/entries/${entryId}`,
    'PATCH',
    { content, password },
  );

  return payload.entry;
};

/**
 * 방명록 항목을 삭제합니다.
 */
export const deleteGuestbookEntryClient = async (
  entryId: string,
  password: string,
): Promise<void> => {
  await requestGuestbook<{ deletedId: string; ok: true }>(
    `/api/guestbook/entries/${entryId}`,
    'DELETE',
    {
      password,
    },
  );
};

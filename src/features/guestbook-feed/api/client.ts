'use client';

import type { GuestbookEntry } from '@/entities/guestbook/model/types';
import { requestJsonApiClient } from '@/shared/lib/http/request-json-api-client';

type GuestbookMutationResponseLike = {
  entry?: GuestbookEntry;
  ok: boolean;
  reason?: string;
};

type CreateGuestbookEntryInput = {
  authorBlogUrl?: string;
  authorName: string;
  content: string;
  isAdminAuthor?: boolean;
  isSecret: boolean;
  parentId?: string | null;
  password: string;
};

/**
 * 공통 JSON API 요청을 수행하고 에러를 표준화합니다.
 */
const requestGuestbook = async <T>(
  url: string,
  method: 'DELETE' | 'PATCH' | 'POST',
  body: Record<string, unknown>,
): Promise<T> =>
  requestJsonApiClient<T & GuestbookMutationResponseLike>({
    body,
    method,
    url,
  });

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

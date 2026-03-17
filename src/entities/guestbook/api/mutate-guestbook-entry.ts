import {
  createGuestbookError,
  GUESTBOOK_ERROR_CODE,
} from '@/entities/guestbook/model/guestbook-error';
import {
  hashGuestbookPassword,
  verifyGuestbookPassword,
} from '@/entities/guestbook/model/password';
import type { GuestbookEntry, GuestbookEntryRow } from '@/entities/guestbook/model/types';
import { createOptionalServiceRoleSupabaseClient } from '@/shared/lib/supabase/service-role';

import 'server-only';

const isAdminAuthoredEntry = (entry: GuestbookEntryRow) => Boolean(entry.is_admin_author);
type CreateGuestbookEntryInput = {
  authorBlogUrl?: string | null;
  authorName: string;
  content: string;
  isAdminAuthor?: boolean;
  isSecret: boolean;
  parentId?: string | null;
  password?: string;
};

type UpdateGuestbookEntryInput = {
  content: string;
  entryId: string;
  isAdminActor?: boolean;
  password: string;
};

type DeleteGuestbookEntryInput = {
  entryId: string;
  isAdminActor?: boolean;
  password: string;
};

type VerifyGuestbookSecretInput = {
  entryId: string;
  password: string;
};

/**
 * API 응답에 노출 가능한 공개 타입으로 변환합니다.
 */
const toPublicEntry = (entry: GuestbookEntryRow, revealSecret: boolean): GuestbookEntry => {
  const { password_hash: _passwordHash, ...publicEntry } = entry;
  if (!entry.is_secret || revealSecret) {
    return {
      ...publicEntry,
      is_admin_author: isAdminAuthoredEntry(entry),
      is_content_masked: false,
    };
  }

  return {
    ...publicEntry,
    content: '',
    is_admin_author: isAdminAuthoredEntry(entry),
    is_content_masked: true,
  };
};

/**
 * 작성 payload를 최소 요구사항에 맞게 정규화합니다.
 */
const normalizeCreateInput = (input: CreateGuestbookEntryInput) => {
  const authorName = input.authorName.trim();
  const content = input.content.trim();
  const password = input.password?.trim() ?? '';
  const authorBlogUrl = input.authorBlogUrl?.trim() || null;
  const parentId = input.parentId?.trim() || null;
  const isAdminAuthor = Boolean(input.isAdminAuthor);
  if (!authorName) throw createGuestbookError(GUESTBOOK_ERROR_CODE.nameRequired);
  if (!content) throw createGuestbookError(GUESTBOOK_ERROR_CODE.contentRequired);
  if (content.length > 3000) throw createGuestbookError(GUESTBOOK_ERROR_CODE.contentTooLong);
  if (!isAdminAuthor && !password)
    throw createGuestbookError(GUESTBOOK_ERROR_CODE.passwordRequired);

  return {
    authorBlogUrl,
    authorName,
    content,
    isSecret: input.isSecret,
    isAdminAuthor,
    parentId,
    password,
  };
};

/**
 * 입력 비밀번호와 DB에 저장된 비밀번호 해시를 검증합니다.
 */
const assertPasswordMatches = (password: string, row: GuestbookEntryRow) => {
  const isValid = verifyGuestbookPassword(password.trim(), row.password_hash);
  if (!isValid) throw createGuestbookError(GUESTBOOK_ERROR_CODE.invalidPassword);
};

/**
 * 비밀번호 기반으로 단일 글을 수정합니다.
 */
export const updateGuestbookEntry = async ({
  content,
  entryId,
  isAdminActor = false,
  password,
}: UpdateGuestbookEntryInput): Promise<GuestbookEntry> => {
  const supabase = createOptionalServiceRoleSupabaseClient();
  if (!supabase) throw createGuestbookError(GUESTBOOK_ERROR_CODE.serviceRoleUnavailable);

  const normalizedEntryId = entryId.trim();
  const normalizedContent = content.trim();
  if (!normalizedEntryId) throw createGuestbookError(GUESTBOOK_ERROR_CODE.entryIdRequired);
  if (!normalizedContent) throw createGuestbookError(GUESTBOOK_ERROR_CODE.contentRequired);
  if (normalizedContent.length > 3000)
    throw createGuestbookError(GUESTBOOK_ERROR_CODE.contentTooLong);

  const { data: current, error: currentError } = await supabase
    .from('guestbook_entries')
    .select('*')
    .eq('id', normalizedEntryId)
    .is('deleted_at', null)
    .single();

  if (currentError || !current) throw createGuestbookError(GUESTBOOK_ERROR_CODE.entryNotFound);
  const currentRow = current as GuestbookEntryRow;
  if (isAdminAuthoredEntry(currentRow) && !isAdminActor) {
    throw createGuestbookError(GUESTBOOK_ERROR_CODE.adminAuthRequired);
  }
  if (!isAdminActor) {
    assertPasswordMatches(password, currentRow);
  }

  const { data, error } = await supabase
    .from('guestbook_entries')
    .update({
      content: normalizedContent,
    })
    .eq('id', normalizedEntryId)
    .select('*')
    .single();

  if (error || !data) {
    throw createGuestbookError(
      GUESTBOOK_ERROR_CODE.updateFailed,
      error?.message ?? 'unknown error',
    );
  }

  return toPublicEntry(data as GuestbookEntryRow, true);
};

/**
 * 비밀번호 기반으로 단일 글을 소프트 삭제합니다.
 */
export const deleteGuestbookEntry = async ({
  entryId,
  isAdminActor = false,
  password,
}: DeleteGuestbookEntryInput): Promise<{ id: string; parentId: string | null }> => {
  const supabase = createOptionalServiceRoleSupabaseClient();
  if (!supabase) throw createGuestbookError(GUESTBOOK_ERROR_CODE.serviceRoleUnavailable);

  const normalizedEntryId = entryId.trim();
  if (!normalizedEntryId) throw createGuestbookError(GUESTBOOK_ERROR_CODE.entryIdRequired);

  const { data: current, error: currentError } = await supabase
    .from('guestbook_entries')
    .select('*')
    .eq('id', normalizedEntryId)
    .is('deleted_at', null)
    .single();

  if (currentError || !current) throw createGuestbookError(GUESTBOOK_ERROR_CODE.entryNotFound);
  const currentRow = current as GuestbookEntryRow;
  if (isAdminAuthoredEntry(currentRow) && !isAdminActor) {
    throw createGuestbookError(GUESTBOOK_ERROR_CODE.adminAuthRequired);
  }
  if (!isAdminActor) {
    assertPasswordMatches(password, currentRow);
  }

  const { error } = await supabase
    .from('guestbook_entries')
    .update({
      deleted_at: new Date().toISOString(),
    })
    .eq('id', normalizedEntryId);

  if (error) throw createGuestbookError(GUESTBOOK_ERROR_CODE.deleteFailed, error.message);

  return { id: normalizedEntryId, parentId: currentRow.parent_id };
};

/**
 * 비밀글 본문 열람을 위한 비밀번호 검증을 수행합니다.
 */
export const verifyGuestbookSecret = async ({
  entryId,
  password,
}: VerifyGuestbookSecretInput): Promise<GuestbookEntry> => {
  const supabase = createOptionalServiceRoleSupabaseClient();
  if (!supabase) throw createGuestbookError(GUESTBOOK_ERROR_CODE.serviceRoleUnavailable);

  const normalizedEntryId = entryId.trim();
  if (!normalizedEntryId) throw createGuestbookError(GUESTBOOK_ERROR_CODE.entryIdRequired);

  const { data, error } = await supabase
    .from('guestbook_entries')
    .select('*')
    .eq('id', normalizedEntryId)
    .is('deleted_at', null)
    .single();

  if (error || !data) throw createGuestbookError(GUESTBOOK_ERROR_CODE.entryNotFound);
  const row = data as GuestbookEntryRow;
  assertPasswordMatches(password, row);

  return toPublicEntry(row, true);
};

/**
 * 신규 방명록(원댓글/대댓글)을 생성합니다.
 */
export const createGuestbookEntry = async (
  input: CreateGuestbookEntryInput,
): Promise<GuestbookEntry> => {
  const supabase = createOptionalServiceRoleSupabaseClient();
  if (!supabase) throw createGuestbookError(GUESTBOOK_ERROR_CODE.serviceRoleUnavailable);

  const normalized = normalizeCreateInput(input);
  let passwordHash: string | null = null;

  if (!normalized.isAdminAuthor && normalized.password) {
    passwordHash = hashGuestbookPassword(normalized.password);
  }

  if (normalized.parentId && normalized.isAdminAuthor && normalized.isSecret) {
    const { data: parent, error: parentError } = await supabase
      .from('guestbook_entries')
      .select('*')
      .eq('id', normalized.parentId)
      .is('deleted_at', null)
      .single();

    if (parentError || !parent)
      throw createGuestbookError(GUESTBOOK_ERROR_CODE.parentEntryNotFound);

    const parentRow = parent as GuestbookEntryRow;
    if (!parentRow.password_hash) {
      throw createGuestbookError(GUESTBOOK_ERROR_CODE.parentPasswordMissing);
    }

    passwordHash = parentRow.password_hash;
  }

  const { data, error } = await supabase
    .from('guestbook_entries')
    .insert({
      author_blog_url: normalized.authorBlogUrl,
      author_name: normalized.authorName,
      content: normalized.content,
      is_admin_author: normalized.isAdminAuthor,
      is_secret: normalized.isSecret,
      parent_id: normalized.parentId,
      password_hash: passwordHash,
    })
    .select('*')
    .single();

  if (error || !data) {
    throw createGuestbookError(
      GUESTBOOK_ERROR_CODE.createFailed,
      error?.message ?? 'unknown error',
    );
  }

  return toPublicEntry(data as GuestbookEntryRow, normalized.isAdminAuthor);
};

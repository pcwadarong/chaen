import type { GuestbookEntry } from '@/entities/guestbook/model/types';
import { createInitialActionResult } from '@/shared/lib/action/action-result';

type GuestbookSubmitActionData = {
  entry: GuestbookEntry;
};

type GuestbookVerifyActionData = {
  entry: GuestbookEntry;
};

/**
 * 방명록 작성 action의 초기 상태입니다.
 */
export const initialSubmitGuestbookEntryState =
  createInitialActionResult<GuestbookSubmitActionData>();

/**
 * 비밀글 확인 action의 초기 상태입니다.
 */
export const initialVerifyGuestbookSecretState =
  createInitialActionResult<GuestbookVerifyActionData>();

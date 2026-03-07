'use client';

import { useCallback } from 'react';

import type { GuestbookEntry, GuestbookThreadItem } from '@/entities/guestbook/model/types';
import {
  createGuestbookEntryClient,
  verifyGuestbookSecretClient,
} from '@/features/guestbook-feed/api/client';
import type { CommentComposeValues } from '@/shared/lib/comment-compose';
import type { ToastItem } from '@/shared/ui/toast/toast';

const createOptimisticId = () =>
  `local-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

type GuestbookTextMap = {
  toastCreateError: string;
  toastCreateSuccess: string;
  toastReplyError: string;
  toastReplySuccess: string;
  toastSecretVerifyError: string;
};

type GuestbookFeedMutations = {
  applyServerThreadEntry: (entry: GuestbookThreadItem | GuestbookEntry) => void;
  prependLocalThread: (thread: GuestbookThreadItem) => void;
  removeThreadById: (threadId: string) => void;
  updateThreadById: (
    threadId: string,
    updater: (thread: GuestbookThreadItem) => GuestbookThreadItem,
  ) => void;
};

type UseGuestbookComposeActionsParams = {
  feedMutations: GuestbookFeedMutations;
  isAdmin: boolean;
  pushToast: (message: string, tone: ToastItem['tone']) => void;
  replyTarget: GuestbookThreadItem | null;
  setReplyTarget: (replyTarget: GuestbookThreadItem | null) => void;
  text: GuestbookTextMap;
};

/**
 * 작성/답신/비밀글 확인 흐름을 묶어 위젯 컴포넌트의 책임을 줄입니다.
 * 화면 컴포넌트는 이 훅이 제공하는 핸들러만 사용합니다.
 */
export const useGuestbookComposeActions = ({
  feedMutations,
  isAdmin,
  pushToast,
  replyTarget,
  setReplyTarget,
  text,
}: UseGuestbookComposeActionsParams) => {
  const { applyServerThreadEntry, prependLocalThread, removeThreadById, updateThreadById } =
    feedMutations;

  const handleSubmit = useCallback(
    async (values: CommentComposeValues) => {
      const isReplySubmit = Boolean(isAdmin && replyTarget);
      if (isReplySubmit && !replyTarget) return;

      // 관리자 답신은 기존 스레드의 replies 배열에 낙관적으로 추가합니다.
      if (isReplySubmit && replyTarget) {
        try {
          const createdReply = await createGuestbookEntryClient({
            authorName: 'admin',
            content: values.content,
            isAdminAuthor: isAdmin,
            isSecret: values.isSecret,
            parentId: replyTarget.id,
            password: '',
          });

          updateThreadById(replyTarget.id, item => ({
            ...item,
            replies: [...item.replies, createdReply],
          }));
          setReplyTarget(null);
          pushToast(text.toastReplySuccess, 'success');
        } catch (error) {
          const message = error instanceof Error ? error.message : text.toastReplyError;
          pushToast(`${text.toastReplyError} (${message})`, 'error');
        }

        return;
      }

      const optimisticId = createOptimisticId();
      const now = new Date().toISOString();
      const optimisticThread: GuestbookThreadItem = {
        author_blog_url: values.authorBlogUrl.trim() || null,
        author_name: values.authorName,
        content: values.content,
        created_at: now,
        deleted_at: null,
        id: optimisticId,
        is_admin_author: isAdmin,
        is_content_masked: false,
        is_secret: values.isSecret,
        parent_id: null,
        replies: [],
        updated_at: now,
      };

      prependLocalThread(optimisticThread);
      setReplyTarget(null);

      try {
        const created = await createGuestbookEntryClient({
          authorBlogUrl: values.authorBlogUrl,
          authorName: values.authorName,
          content: values.content,
          isAdminAuthor: isAdmin,
          isSecret: values.isSecret,
          password: values.password,
        });

        removeThreadById(optimisticId);
        prependLocalThread({ ...created, replies: [] });
        pushToast(text.toastCreateSuccess, 'success');
      } catch (error) {
        removeThreadById(optimisticId);
        const message = error instanceof Error ? error.message : text.toastCreateError;
        pushToast(`${text.toastCreateError} (${message})`, 'error');
      }
    },
    [
      isAdmin,
      prependLocalThread,
      pushToast,
      removeThreadById,
      replyTarget,
      setReplyTarget,
      text.toastCreateError,
      text.toastCreateSuccess,
      text.toastReplyError,
      text.toastReplySuccess,
      updateThreadById,
    ],
  );

  const handleRevealSecret = useCallback(
    async (entry: GuestbookThreadItem, password: string) => {
      try {
        const revealed = await verifyGuestbookSecretClient(entry.id, password);
        applyServerThreadEntry(revealed);
      } catch {
        pushToast(text.toastSecretVerifyError, 'error');
        throw new Error('verify failed');
      }
    },
    [applyServerThreadEntry, pushToast, text.toastSecretVerifyError],
  );

  return {
    handleRevealSecret,
    handleSubmit,
  };
};

'use client';

import { useCallback, useMemo, useRef, useState } from 'react';

import { GUESTBOOK_ERROR_CODE } from '@/entities/guestbook/model/guestbook-error';
import type { GuestbookEntry, GuestbookThreadItem } from '@/entities/guestbook/model/types';
import { deleteGuestbookEntryAction } from '@/features/guestbook-entry/api/delete-guestbook-entry';
import { updateGuestbookEntryAction } from '@/features/guestbook-entry/api/update-guestbook-entry';
import type { ToastItem } from '@/shared/ui/toast/toast';

type ActionModalState =
  | {
      entry: GuestbookEntry | GuestbookThreadItem;
      mode: 'delete';
      parentThreadId: string | null;
    }
  | {
      entry: GuestbookEntry | GuestbookThreadItem;
      mode: 'edit';
      parentThreadId: string | null;
    }
  | null;

type GuestbookModalTextMap = {
  deleteModalTitle: string;
  editContentUnchanged: string;
  editModalTitle: string;
  requiredField: string;
  secretVerifyFailed: string;
  toastDeleteError: string;
  toastDeleteSuccess: string;
  toastEditError: string;
  toastEditSuccess: string;
  toastSecretUnlockRequired: string;
};

type UseManageGuestbookEntryModalParams = {
  applyServerThread: (entry: GuestbookThreadItem) => void;
  applyServerThreadEntry: (entry: GuestbookThreadItem | GuestbookEntry) => void;
  isAdmin: boolean;
  items: GuestbookThreadItem[];
  pushToast: (message: string, tone: ToastItem['tone']) => void;
  removeThreadById: (id: string) => void;
  text: GuestbookModalTextMap;
  updateThreadById: (
    id: string,
    updater: (entry: GuestbookThreadItem) => GuestbookThreadItem,
  ) => void;
  locale: string;
};

/**
 * 수정/삭제 모달의 상태와 confirm 비동기 로직을 캡슐화합니다.
 * 위젯은 open/close/confirm 호출과 렌더링 정보만 소비합니다.
 */
export const useManageGuestbookEntryModal = ({
  applyServerThread,
  applyServerThreadEntry,
  isAdmin,
  items,
  pushToast,
  removeThreadById,
  text,
  updateThreadById,
  locale,
}: UseManageGuestbookEntryModalParams) => {
  const [modalState, setModalState] = useState<ActionModalState>(null);
  const [modalPassword, setModalPassword] = useState('');
  const [modalContent, setModalContent] = useState('');
  const [modalError, setModalError] = useState<string | null>(null);
  const [isModalSubmitting, setIsModalSubmitting] = useState(false);
  const modalTextareaRef = useRef<HTMLTextAreaElement | null>(null);
  const modalPasswordInputRef = useRef<HTMLInputElement | null>(null);

  const closeModal = useCallback(() => {
    setModalState(null);
    setModalPassword('');
    setModalContent('');
    setModalError(null);
  }, []);

  const openEditModal = useCallback(
    (entry: GuestbookThreadItem) => {
      if (entry.is_admin_author && !isAdmin) return;

      if (entry.is_secret && entry.is_content_masked) {
        pushToast(text.toastSecretUnlockRequired, 'error');
        return;
      }

      setModalState({ mode: 'edit', entry, parentThreadId: null });
      setModalPassword('');
      setModalContent(entry.content);
      setModalError(null);
    },
    [isAdmin, pushToast, text.toastSecretUnlockRequired],
  );

  const openDeleteModal = useCallback(
    (entry: GuestbookThreadItem) => {
      if (entry.is_admin_author && !isAdmin) return;

      setModalState({ mode: 'delete', entry, parentThreadId: null });
      setModalPassword('');
      setModalContent('');
      setModalError(null);
    },
    [isAdmin],
  );

  const openEditReplyModal = useCallback(
    (entry: GuestbookEntry, parentEntry: GuestbookThreadItem) => {
      if (!isAdmin) return;

      if (entry.is_secret && entry.is_content_masked) {
        pushToast(text.toastSecretUnlockRequired, 'error');
        return;
      }

      setModalState({ mode: 'edit', entry, parentThreadId: parentEntry.id });
      setModalPassword('');
      setModalContent(entry.content);
      setModalError(null);
    },
    [isAdmin, pushToast, text.toastSecretUnlockRequired],
  );

  const openDeleteReplyModal = useCallback(
    (entry: GuestbookEntry, parentEntry: GuestbookThreadItem) => {
      if (!isAdmin) return;

      setModalState({ mode: 'delete', entry, parentThreadId: parentEntry.id });
      setModalPassword('');
      setModalContent('');
      setModalError(null);
    },
    [isAdmin],
  );

  /**
   * 수정 optimistic update를 이전 내용으로 되돌립니다.
   */
  const rollbackEditedEntry = useCallback(
    (
      target: GuestbookEntry | GuestbookThreadItem,
      parentThreadId: string | null,
      previousContent: string,
    ) => {
      if (parentThreadId) {
        updateThreadById(parentThreadId, item => ({
          ...item,
          replies: item.replies.map(reply =>
            reply.id === target.id ? { ...reply, content: previousContent } : reply,
          ),
        }));
        return;
      }

      updateThreadById(target.id, item => ({
        ...item,
        content: previousContent,
      }));
    },
    [updateThreadById],
  );

  /**
   * 삭제 optimistic update를 이전 reply 상태로 되돌립니다.
   */
  const rollbackDeletedReply = useCallback(
    (parentThreadId: string, deletedReply: GuestbookEntry, replyIndex: number) => {
      updateThreadById(parentThreadId, item => ({
        ...item,
        replies: [
          ...item.replies.slice(0, replyIndex),
          deletedReply,
          ...item.replies.slice(replyIndex),
        ],
      }));
    },
    [updateThreadById],
  );

  /**
   * 삭제 optimistic update를 이전 thread 상태로 되돌립니다.
   */
  const rollbackDeletedThread = useCallback(
    (deletedThread: GuestbookThreadItem) => {
      applyServerThread(deletedThread);
    },
    [applyServerThread],
  );

  const handleConfirmModal = useCallback(async () => {
    if (!modalState || isModalSubmitting) return;

    const target = modalState.entry;
    const shouldSkipPassword = Boolean(isAdmin || target.is_admin_author);
    const trimmedModalContent = modalContent.trim();
    const trimmedPassword = modalPassword.trim();

    if (modalState.mode === 'edit' && !trimmedModalContent) {
      setModalError(text.requiredField);
      return;
    }

    if (!shouldSkipPassword && !trimmedPassword) {
      setModalError(text.requiredField);
      return;
    }

    if (modalState.mode === 'edit' && trimmedModalContent === target.content.trim()) {
      setModalError(text.editContentUnchanged);
      return;
    }

    setModalError(null);
    setIsModalSubmitting(true);
    try {
      if (modalState.mode === 'edit') {
        const previousContent = target.content;

        // 수정 시에는 먼저 화면을 갱신해 반응성을 높이고, 실패하면 원복합니다.
        if (modalState.parentThreadId) {
          updateThreadById(modalState.parentThreadId, item => ({
            ...item,
            replies: item.replies.map(reply =>
              reply.id === target.id
                ? { ...reply, content: trimmedModalContent, is_content_masked: false }
                : reply,
            ),
          }));
        } else {
          updateThreadById(target.id, item => ({
            ...item,
            content: trimmedModalContent,
            is_content_masked: false,
          }));
        }

        try {
          const result = await updateGuestbookEntryAction({
            content: trimmedModalContent,
            entryId: target.id,
            locale,
            password: shouldSkipPassword ? '' : trimmedPassword,
          });
          if (!result.ok || !result.data) {
            rollbackEditedEntry(target, modalState.parentThreadId, previousContent);
            if (result.errorCode === GUESTBOOK_ERROR_CODE.invalidPassword) {
              setModalError(text.secretVerifyFailed);
            } else {
              pushToast(text.toastEditError, 'error');
            }

            return;
          }
          if (!modalState.parentThreadId) {
            applyServerThreadEntry(result.data);
          }
          pushToast(text.toastEditSuccess, 'success');
          closeModal();
        } catch (_error) {
          rollbackEditedEntry(target, modalState.parentThreadId, previousContent);
          pushToast(text.toastEditError, 'error');
        }
      }

      if (modalState.mode === 'delete') {
        if (modalState.parentThreadId) {
          const parentThread = items.find(item => item.id === modalState.parentThreadId);
          if (!parentThread) {
            closeModal();
            return;
          }

          const replyIndex = parentThread.replies.findIndex(reply => reply.id === target.id);
          if (replyIndex < 0) {
            closeModal();
            return;
          }

          const deletedReply = parentThread.replies[replyIndex];
          updateThreadById(modalState.parentThreadId, item => ({
            ...item,
            replies: item.replies.filter(reply => reply.id !== target.id),
          }));

          try {
            const result = await deleteGuestbookEntryAction({
              entryId: target.id,
              locale,
              password: shouldSkipPassword ? '' : trimmedPassword,
            });
            if (!result.ok) {
              rollbackDeletedReply(modalState.parentThreadId, deletedReply, replyIndex);
              if (result.errorCode === GUESTBOOK_ERROR_CODE.invalidPassword) {
                setModalError(text.secretVerifyFailed);
              } else {
                pushToast(text.toastDeleteError, 'error');
              }

              return;
            }
            pushToast(text.toastDeleteSuccess, 'success');
            closeModal();
          } catch (_error) {
            rollbackDeletedReply(modalState.parentThreadId, deletedReply, replyIndex);
            pushToast(text.toastDeleteError, 'error');
          }

          return;
        }

        const deletedThread = items.find(item => item.id === target.id);
        if (!deletedThread) {
          closeModal();
          return;
        }

        // 부모 글 삭제 시 답글 유무에 따라 soft-delete / hard-delete를 구분합니다.
        if (deletedThread.replies.length > 0) {
          const deletedAt = new Date().toISOString();
          updateThreadById(target.id, item => ({
            ...item,
            content: '',
            deleted_at: deletedAt,
            is_content_masked: false,
          }));
        } else {
          removeThreadById(target.id);
        }

        try {
          const result = await deleteGuestbookEntryAction({
            entryId: target.id,
            locale,
            password: shouldSkipPassword ? '' : trimmedPassword,
          });
          if (!result.ok) {
            rollbackDeletedThread(deletedThread);
            if (result.errorCode === GUESTBOOK_ERROR_CODE.invalidPassword) {
              setModalError(text.secretVerifyFailed);
            } else {
              pushToast(text.toastDeleteError, 'error');
            }

            return;
          }
          pushToast(text.toastDeleteSuccess, 'success');
          closeModal();
        } catch (_error) {
          rollbackDeletedThread(deletedThread);
          pushToast(text.toastDeleteError, 'error');
        }
      }
    } finally {
      setIsModalSubmitting(false);
    }
  }, [
    applyServerThreadEntry,
    closeModal,
    isAdmin,
    isModalSubmitting,
    items,
    locale,
    modalContent,
    modalPassword,
    modalState,
    pushToast,
    removeThreadById,
    rollbackDeletedReply,
    rollbackDeletedThread,
    rollbackEditedEntry,
    text.editContentUnchanged,
    text.requiredField,
    text.secretVerifyFailed,
    text.toastDeleteError,
    text.toastDeleteSuccess,
    text.toastEditError,
    text.toastEditSuccess,
    updateThreadById,
  ]);

  const modalTitle = useMemo(() => {
    if (!modalState) return '';
    return modalState.mode === 'edit' ? text.editModalTitle : text.deleteModalTitle;
  }, [modalState, text.deleteModalTitle, text.editModalTitle]);

  const shouldHideModalPassword = Boolean(modalState?.entry.is_admin_author && isAdmin);

  return {
    closeModal,
    handleConfirmModal,
    isModalSubmitting,
    modalContent,
    modalError,
    modalPassword,
    modalPasswordInputRef,
    modalState,
    modalTextareaRef,
    modalTitle,
    openDeleteModal,
    openDeleteReplyModal,
    openEditModal,
    openEditReplyModal,
    setModalContent,
    setModalError,
    setModalPassword,
    shouldHideModalPassword,
  };
};

export type { ActionModalState };

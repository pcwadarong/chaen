'use client';

import { useMemo, useRef, useState } from 'react';

import type { GuestbookEntry, GuestbookThreadItem } from '@/entities/guestbook/model/types';
import {
  deleteGuestbookEntryClient,
  updateGuestbookEntryClient,
} from '@/features/guestbook-feed/api/client';
import type { ToastItem } from '@/shared/ui/toast/toast';

const INVALID_PASSWORD_REASON = 'invalid password';

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

type UseGuestbookActionModalParams = {
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
};

const isInvalidPasswordError = (error: unknown) =>
  error instanceof Error && error.message === INVALID_PASSWORD_REASON;

/**
 * 수정/삭제 모달의 상태와 confirm 비동기 로직을 캡슐화합니다.
 * 위젯은 open/close/confirm 호출과 렌더링 정보만 소비합니다.
 */
export const useGuestbookActionModal = ({
  applyServerThread,
  applyServerThreadEntry,
  isAdmin,
  items,
  pushToast,
  removeThreadById,
  text,
  updateThreadById,
}: UseGuestbookActionModalParams) => {
  const [modalState, setModalState] = useState<ActionModalState>(null);
  const [modalPassword, setModalPassword] = useState('');
  const [modalContent, setModalContent] = useState('');
  const [modalError, setModalError] = useState<string | null>(null);
  const [isModalSubmitting, setIsModalSubmitting] = useState(false);
  const modalTextareaRef = useRef<HTMLTextAreaElement | null>(null);
  const modalPasswordInputRef = useRef<HTMLInputElement | null>(null);

  const closeModal = () => {
    setModalState(null);
    setModalPassword('');
    setModalContent('');
    setModalError(null);
  };

  const openEditModal = (entry: GuestbookThreadItem) => {
    if (entry.is_admin_author && !isAdmin) return;

    if (entry.is_secret && entry.is_content_masked) {
      pushToast(text.toastSecretUnlockRequired, 'error');
      return;
    }

    setModalState({ mode: 'edit', entry, parentThreadId: null });
    setModalPassword('');
    setModalContent(entry.content);
    setModalError(null);
  };

  const openDeleteModal = (entry: GuestbookThreadItem) => {
    if (entry.is_admin_author && !isAdmin) return;

    setModalState({ mode: 'delete', entry, parentThreadId: null });
    setModalPassword('');
    setModalContent('');
    setModalError(null);
  };

  const openEditReplyModal = (entry: GuestbookEntry, parentEntry: GuestbookThreadItem) => {
    if (!isAdmin) return;

    if (entry.is_secret && entry.is_content_masked) {
      pushToast(text.toastSecretUnlockRequired, 'error');
      return;
    }

    setModalState({ mode: 'edit', entry, parentThreadId: parentEntry.id });
    setModalPassword('');
    setModalContent(entry.content);
    setModalError(null);
  };

  const openDeleteReplyModal = (entry: GuestbookEntry, parentEntry: GuestbookThreadItem) => {
    if (!isAdmin) return;

    setModalState({ mode: 'delete', entry, parentThreadId: parentEntry.id });
    setModalPassword('');
    setModalContent('');
    setModalError(null);
  };

  const handleConfirmModal = async () => {
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
          const updated = await updateGuestbookEntryClient(
            target.id,
            trimmedModalContent,
            shouldSkipPassword ? '' : trimmedPassword,
          );
          if (!modalState.parentThreadId) {
            applyServerThreadEntry(updated);
          }
          pushToast(text.toastEditSuccess, 'success');
          closeModal();
        } catch (error) {
          if (modalState.parentThreadId) {
            updateThreadById(modalState.parentThreadId, item => ({
              ...item,
              replies: item.replies.map(reply =>
                reply.id === target.id ? { ...reply, content: previousContent } : reply,
              ),
            }));
          } else {
            updateThreadById(target.id, item => ({
              ...item,
              content: previousContent,
            }));
          }
          if (isInvalidPasswordError(error)) {
            setModalError(text.secretVerifyFailed);
          } else {
            pushToast(text.toastEditError, 'error');
          }
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
            await deleteGuestbookEntryClient(target.id, shouldSkipPassword ? '' : trimmedPassword);
            pushToast(text.toastDeleteSuccess, 'success');
            closeModal();
          } catch (error) {
            updateThreadById(modalState.parentThreadId, item => ({
              ...item,
              replies: [
                ...item.replies.slice(0, replyIndex),
                deletedReply,
                ...item.replies.slice(replyIndex),
              ],
            }));
            if (isInvalidPasswordError(error)) {
              setModalError(text.secretVerifyFailed);
            } else {
              pushToast(text.toastDeleteError, 'error');
            }
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
          await deleteGuestbookEntryClient(target.id, shouldSkipPassword ? '' : trimmedPassword);
          pushToast(text.toastDeleteSuccess, 'success');
          closeModal();
        } catch (error) {
          applyServerThread(deletedThread);
          if (isInvalidPasswordError(error)) {
            setModalError(text.secretVerifyFailed);
          } else {
            pushToast(text.toastDeleteError, 'error');
          }
        }
      }
    } finally {
      setIsModalSubmitting(false);
    }
  };

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

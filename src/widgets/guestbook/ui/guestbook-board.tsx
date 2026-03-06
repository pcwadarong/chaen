'use client';

import { css } from '@emotion/react';
import { useTranslations } from 'next-intl';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import type { GuestbookEntry, GuestbookThreadItem } from '@/entities/guestbook/model/types';
import type { GuestbookComposeValues } from '@/features/guestbook-compose/model/types';
import { GuestbookComposeForm } from '@/features/guestbook-compose/ui/guestbook-compose-form';
import {
  createGuestbookEntryClient,
  deleteGuestbookEntryClient,
  updateGuestbookEntryClient,
  verifyGuestbookSecretClient,
} from '@/features/guestbook-feed/api/client';
import { useGuestbookFeed } from '@/features/guestbook-feed/model/use-guestbook-feed';
import { GuestbookFeed } from '@/features/guestbook-feed/ui/guestbook-feed';
import { useAuth } from '@/shared/providers';
import { Modal } from '@/shared/ui/modal/modal';
import { type ToastItem, ToastViewport } from '@/shared/ui/toast/toast';

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

const createOptimisticId = () =>
  `local-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
const ACTION_MODAL_TITLE_ID = 'guestbook-action-modal-title';
const ACTION_MODAL_DESCRIPTION_ID = 'guestbook-action-modal-description';

type GuestbookBoardProps = {
  initialCursor?: string | null;
  initialItems?: GuestbookThreadItem[];
};

/**
 * 방명록 목록과 하단 고정 작성폼을 조합하는 위젯입니다.
 */
export const GuestbookBoard = ({
  initialCursor = null,
  initialItems = [],
}: GuestbookBoardProps) => {
  const t = useTranslations('Guest');
  const { isAdmin } = useAuth();
  const {
    applyServerThread,
    applyServerThreadEntry,
    errorMessage,
    hasMore,
    isInitialLoading,
    isLoadingMore,
    items,
    loadMore,
    prependLocalThread,
    removeThreadById,
    retryInitialLoad,
    updateThreadById,
  } = useGuestbookFeed({
    initialCursor,
    initialItems,
  });

  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [replyTarget, setReplyTarget] = useState<GuestbookThreadItem | null>(null);
  const [modalState, setModalState] = useState<ActionModalState>(null);
  const [modalPassword, setModalPassword] = useState('');
  const [modalContent, setModalContent] = useState('');
  const [isModalSubmitting, setIsModalSubmitting] = useState(false);
  const modalTextareaRef = useRef<HTMLTextAreaElement | null>(null);
  const modalPasswordInputRef = useRef<HTMLInputElement | null>(null);

  const pushToast = useCallback((message: string, tone: ToastItem['tone']) => {
    const id = createOptimisticId();
    setToasts(previous => [...previous, { id, message, tone }]);
  }, []);

  useEffect(() => {
    if (toasts.length === 0) return;

    const timers = toasts.map(item =>
      window.setTimeout(() => {
        setToasts(previous => previous.filter(toast => toast.id !== item.id));
      }, 2600),
    );

    return () => {
      timers.forEach(timer => window.clearTimeout(timer));
    };
  }, [toasts]);

  const closeModal = () => {
    setModalState(null);
    setModalPassword('');
    setModalContent('');
  };

  const handleSubmit = async (values: GuestbookComposeValues) => {
    const isAdminReply = Boolean(isAdmin && replyTarget);

    if (isAdminReply && !replyTarget) return;

    if (isAdminReply && replyTarget) {
      try {
        const createdReply = await createGuestbookEntryClient({
          authorName: 'admin',
          content: values.content,
          isAdminAuthor: isAdmin,
          isAdminReply: true,
          isSecret: values.isSecret,
          parentId: replyTarget.id,
          password: '',
        });

        updateThreadById(replyTarget.id, item => ({
          ...item,
          replies: [...item.replies, createdReply],
        }));
        setReplyTarget(null);
        pushToast(t('toastReplySuccess'), 'success');
      } catch (error) {
        const message = error instanceof Error ? error.message : t('toastReplyError');
        pushToast(`${t('toastReplyError')} (${message})`, 'error');
      }

      return;
    }

    const optimisticId = createOptimisticId();
    const optimisticThread: GuestbookThreadItem = {
      author_blog_url: values.authorBlogUrl.trim() || null,
      author_name: values.authorName,
      content: values.content,
      created_at: new Date().toISOString(),
      deleted_at: null,
      id: optimisticId,
      is_admin_reply: false,
      is_content_masked: false,
      is_secret: values.isSecret,
      parent_id: null,
      replies: [],
      updated_at: new Date().toISOString(),
    };

    prependLocalThread(optimisticThread);
    setReplyTarget(null);

    try {
      const entry = await createGuestbookEntryClient({
        authorBlogUrl: values.authorBlogUrl,
        authorName: values.authorName,
        content: values.content,
        isAdminAuthor: isAdmin,
        isAdminReply: false,
        isSecret: values.isSecret,
        password: values.password,
      });

      removeThreadById(optimisticId);
      prependLocalThread({
        ...entry,
        replies: [],
      });
      pushToast(t('toastCreateSuccess'), 'success');
    } catch (error) {
      removeThreadById(optimisticId);
      const message = error instanceof Error ? error.message : t('toastCreateError');
      pushToast(`${t('toastCreateError')} (${message})`, 'error');
    }
  };

  const handleRevealSecret = async (entry: GuestbookThreadItem, password: string) => {
    try {
      const revealed = await verifyGuestbookSecretClient(entry.id, password);
      applyServerThreadEntry(revealed);
    } catch {
      pushToast(t('toastSecretVerifyError'), 'error');
      throw new Error('verify failed');
    }
  };

  const openEditModal = (entry: GuestbookThreadItem) => {
    setModalState({
      mode: 'edit',
      entry,
      parentThreadId: null,
    });
    setModalPassword('');
    setModalContent(entry.content);
  };

  const openDeleteModal = (entry: GuestbookThreadItem) => {
    setModalState({
      mode: 'delete',
      entry,
      parentThreadId: null,
    });
    setModalPassword('');
    setModalContent('');
  };

  const openEditReplyModal = (entry: GuestbookEntry, parentEntry: GuestbookThreadItem) => {
    setModalState({
      mode: 'edit',
      entry,
      parentThreadId: parentEntry.id,
    });
    setModalPassword('');
    setModalContent(entry.content);
  };

  const openDeleteReplyModal = (entry: GuestbookEntry, parentEntry: GuestbookThreadItem) => {
    setModalState({
      mode: 'delete',
      entry,
      parentThreadId: parentEntry.id,
    });
    setModalPassword('');
    setModalContent('');
  };

  const handleConfirmModal = async () => {
    if (!modalState || isModalSubmitting) return;

    if (modalState.mode === 'edit' && !modalContent.trim()) {
      pushToast(t('toastEditError'), 'error');
      return;
    }

    const target = modalState.entry;
    const shouldSkipPassword = target.is_admin_reply;
    setIsModalSubmitting(true);
    try {
      if (modalState.mode === 'edit') {
        const previousContent = target.content;
        if (modalState.parentThreadId) {
          updateThreadById(modalState.parentThreadId, item => ({
            ...item,
            replies: item.replies.map(reply =>
              reply.id === target.id
                ? { ...reply, content: modalContent.trim(), is_content_masked: false }
                : reply,
            ),
          }));
        } else {
          updateThreadById(target.id, item => ({
            ...item,
            content: modalContent.trim(),
            is_content_masked: false,
          }));
        }

        try {
          const updated = await updateGuestbookEntryClient(
            target.id,
            modalContent,
            shouldSkipPassword ? '' : modalPassword,
          );
          if (!modalState.parentThreadId) {
            applyServerThreadEntry(updated);
          }
          pushToast(t('toastEditSuccess'), 'success');
          closeModal();
        } catch {
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
          pushToast(t('toastEditError'), 'error');
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
            await deleteGuestbookEntryClient(target.id, shouldSkipPassword ? '' : modalPassword);
            pushToast(t('toastDeleteSuccess'), 'success');
            closeModal();
          } catch {
            updateThreadById(modalState.parentThreadId, item => ({
              ...item,
              replies: [
                ...item.replies.slice(0, replyIndex),
                deletedReply,
                ...item.replies.slice(replyIndex),
              ],
            }));
            pushToast(t('toastDeleteError'), 'error');
          }

          return;
        }

        const deletedThread = items.find(item => item.id === target.id);
        if (!deletedThread) {
          closeModal();
          return;
        }

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
          await deleteGuestbookEntryClient(target.id, shouldSkipPassword ? '' : modalPassword);
          pushToast(t('toastDeleteSuccess'), 'success');
          closeModal();
        } catch {
          applyServerThread(deletedThread);
          pushToast(t('toastDeleteError'), 'error');
        }
      }
    } finally {
      setIsModalSubmitting(false);
    }
  };

  const modalTitle = useMemo(() => {
    if (!modalState) return '';
    if (modalState.mode === 'edit') return t('editModalTitle');

    return t('deleteModalTitle');
  }, [modalState, t]);

  const shouldHideModalPassword = Boolean(modalState?.entry.is_admin_reply);

  return (
    <div css={boardStyle}>
      <section css={feedWrapStyle}>
        <GuestbookFeed
          canReply={isAdmin}
          errorMessage={errorMessage}
          hasMore={hasMore}
          isInitialLoading={isInitialLoading}
          isLoadingMore={isLoadingMore}
          items={items}
          onDeleteReply={openDeleteReplyModal}
          onDelete={openDeleteModal}
          onEditReply={openEditReplyModal}
          onEdit={openEditModal}
          onLoadMore={loadMore}
          onReply={entry => setReplyTarget(entry)}
          onRetry={retryInitialLoad}
          onRevealSecret={handleRevealSecret}
        />
      </section>

      <GuestbookComposeForm
        authorBlogUrlLabel={t('composeAuthorBlogUrlLabel')}
        authorNameLabel={t('composeAuthorNameLabel')}
        characterCountLabel={t('composeCharacterCountLabel')}
        contentLabel={t('composeContentLabel')}
        contentShortcutHint={t('composeContentShortcutHint')}
        isAdmin={isAdmin}
        isReplyMode={Boolean(replyTarget && isAdmin)}
        onSubmit={handleSubmit}
        onReplyTargetReset={() => setReplyTarget(null)}
        passwordLabel={t('composePasswordLabel')}
        replyPreviewLabel={t('composeReplyPreviewLabel')}
        replyTargetContent={isAdmin ? (replyTarget?.content ?? null) : null}
        replyTargetResetLabel={t('replyTargetResetLabel')}
        secretLabel={t('secretLabel')}
        submitLabel={t('submit')}
        textPlaceholder={t('composePlaceholder')}
      />

      <Modal
        // 삭제 모드일 때만 '정말로 삭제하시겠습니까?' 문구 노출
        ariaDescribedBy={modalState?.mode === 'delete' ? ACTION_MODAL_DESCRIPTION_ID : undefined}
        // 모달이 열리자마자 스크린 리더가 '수정' 또는 '삭제'라는 제목을 읽음
        ariaLabelledBy={ACTION_MODAL_TITLE_ID}
        closeAriaLabel={t('modalCloseAriaLabel')}
        // 수정 모드라면 글을 바로 고칠 수 있게 'textarea'로,
        // 삭제 모드라면 '비밀번호 입력창'으로 포커스
        initialFocusRef={
          modalState?.mode === 'edit'
            ? modalTextareaRef
            : shouldHideModalPassword
              ? undefined
              : modalPasswordInputRef
        }
        // 상태가 null이 아니면 모달 오픈
        isOpen={Boolean(modalState)}
        onClose={closeModal}
      >
        <div css={modalBodyStyle}>
          <h2 id={ACTION_MODAL_TITLE_ID} css={modalLeadStyle}>
            {modalTitle}
          </h2>
          {modalState?.mode === 'edit' ? (
            <textarea
              aria-label={t('editModalTitle')}
              maxLength={3000}
              onChange={event => setModalContent(event.target.value)}
              ref={modalTextareaRef}
              rows={4}
              css={modalTextareaStyle}
              value={modalContent}
            />
          ) : (
            <p id={ACTION_MODAL_DESCRIPTION_ID} css={modalHintStyle}>
              {t('deleteModalHint')}
            </p>
          )}
          {!shouldHideModalPassword ? (
            <input
              aria-label={t('password')}
              onChange={event => setModalPassword(event.target.value)}
              placeholder={t('password')}
              ref={modalPasswordInputRef}
              css={modalInputStyle}
              type="password"
              value={modalPassword}
            />
          ) : null}
          <div css={modalActionsStyle}>
            <button onClick={closeModal} css={modalSecondaryButtonStyle} type="button">
              {t('cancel')}
            </button>
            <button
              disabled={isModalSubmitting}
              onClick={() => void handleConfirmModal()}
              css={modalPrimaryButtonStyle}
              type="button"
            >
              {modalState?.mode === 'edit' ? t('editConfirm') : t('deleteConfirm')}
            </button>
          </div>
        </div>
      </Modal>

      <ToastViewport
        closeLabel={t('close')}
        items={toasts}
        onClose={id => setToasts(previous => previous.filter(item => item.id !== id))}
      />
    </div>
  );
};

const boardStyle = css`
  width: 100%;
  display: grid;
`;

const feedWrapStyle = css`
  width: 100%;
  padding: var(--space-0) var(--space-0) var(--space-72);
  display: grid;
  gap: var(--space-4);
`;

const modalBodyStyle = css`
  width: min(26rem, 90vw);
  padding: var(--space-10) var(--space-4) var(--space-4);
  display: grid;
  gap: var(--space-3);
  background-color: rgb(var(--color-surface));
  border-radius: var(--radius-m);
  border: 1px solid rgb(var(--color-border) / 0.35);
`;

const modalLeadStyle = css`
  font-weight: var(--font-weight-bold);
`;

const modalHintStyle = css`
  color: rgb(var(--color-muted));
  font-size: var(--font-size-14);
`;

const modalTextareaStyle = css`
  width: 100%;
  border-radius: var(--radius-xs);
  border: 1px solid rgb(var(--color-border) / 0.35);
  padding: var(--space-3);
  background-color: rgb(var(--color-surface));
  color: rgb(var(--color-text));
  resize: vertical;
`;

const modalInputStyle = css`
  min-height: 2.5rem;
  border-radius: var(--radius-xs);
  border: 1px solid rgb(var(--color-border) / 0.35);
  padding: var(--space-0) var(--space-3);
  background-color: rgb(var(--color-surface));
  color: rgb(var(--color-text));
`;

const modalActionsStyle = css`
  display: flex;
  justify-content: flex-end;
  gap: var(--space-2);
`;

const modalSecondaryButtonStyle = css`
  min-height: 2.3rem;
  padding: var(--space-0) var(--space-3);
  border-radius: var(--radius-2xs);
  border: 1px solid rgb(var(--color-border) / 0.35);
  background-color: transparent;
  color: rgb(var(--color-text));
`;

const modalPrimaryButtonStyle = css`
  min-height: 2.3rem;
  padding: var(--space-0) var(--space-3);
  border-radius: var(--radius-2xs);
  border: 1px solid rgb(var(--color-border) / 0.35);
  background-color: rgb(var(--color-text) / 0.9);
  color: rgb(var(--color-surface));
`;

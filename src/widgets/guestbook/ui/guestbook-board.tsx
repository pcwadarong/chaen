'use client';

import { useTranslations } from 'next-intl';
import React, { type CSSProperties, useCallback, useEffect, useMemo, useState } from 'react';

import {
  createGuestbookEntryClient,
  deleteGuestbookEntryClient,
  updateGuestbookEntryClient,
  verifyGuestbookSecretClient,
} from '@/entities/guestbook/api/guestbook-client';
import type { GuestbookEntry, GuestbookThreadItem } from '@/entities/guestbook/model/types';
import type { GuestbookComposeValues } from '@/features/guestbook-compose/model/types';
import { GuestbookComposeForm } from '@/features/guestbook-compose/ui/guestbook-compose-form';
import { useGuestbookThreads } from '@/features/guestbook-feed/model/use-guestbook-threads';
import { GuestbookFeed } from '@/features/guestbook-feed/ui/guestbook-feed';
import { useAuth } from '@/shared/providers';
import { Modal } from '@/shared/ui/modal/modal';
import { type ToastItem, ToastViewport } from '@/shared/ui/toast';

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

/**
 * 방명록 목록과 하단 고정 작성폼을 조합하는 위젯입니다.
 */
export const GuestbookBoard = () => {
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
  } = useGuestbookThreads();

  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [replyTarget, setReplyTarget] = useState<GuestbookThreadItem | null>(null);
  const [modalState, setModalState] = useState<ActionModalState>(null);
  const [modalPassword, setModalPassword] = useState('');
  const [modalContent, setModalContent] = useState('');
  const [isModalSubmitting, setIsModalSubmitting] = useState(false);

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
    <div style={boardStyle}>
      <section style={feedWrapStyle}>
        <header style={headerStyle}>
          <h1 style={titleStyle}>{t('title')}</h1>
        </header>
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
        isAdmin={isAdmin}
        isReplyMode={Boolean(replyTarget && isAdmin)}
        onSubmit={handleSubmit}
        onReplyTargetReset={() => setReplyTarget(null)}
        replyTargetContent={isAdmin ? (replyTarget?.content ?? null) : null}
        replyTargetResetLabel={t('replyTargetResetLabel')}
        secretLabel={t('secretLabel')}
        submitLabel={t('submit')}
        textPlaceholder={t('composePlaceholder')}
      />

      <Modal
        closeAriaLabel={t('modalCloseAriaLabel')}
        isOpen={Boolean(modalState)}
        onClose={closeModal}
      >
        <div style={modalBodyStyle}>
          <p style={modalLeadStyle}>{modalTitle}</p>
          {modalState?.mode === 'edit' ? (
            <textarea
              maxLength={3000}
              onChange={event => setModalContent(event.target.value)}
              rows={4}
              style={modalTextareaStyle}
              value={modalContent}
            />
          ) : (
            <p style={modalHintStyle}>{t('deleteModalHint')}</p>
          )}
          {!shouldHideModalPassword ? (
            <input
              onChange={event => setModalPassword(event.target.value)}
              placeholder={t('password')}
              style={modalInputStyle}
              type="password"
              value={modalPassword}
            />
          ) : null}
          <div style={modalActionsStyle}>
            <button onClick={closeModal} style={modalSecondaryButtonStyle} type="button">
              {t('cancel')}
            </button>
            <button
              disabled={isModalSubmitting}
              onClick={() => void handleConfirmModal()}
              style={modalPrimaryButtonStyle}
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

const boardStyle: CSSProperties = {
  width: '100%',
  minHeight: '100dvh',
  display: 'grid',
  gridTemplateRows: '1fr',
};

const feedWrapStyle: CSSProperties = {
  width: 'min(1120px, 100%)',
  justifySelf: 'center',
  padding: '1.5rem 1rem 18rem',
  display: 'grid',
  gap: '1rem',
};

const headerStyle: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: '0.75rem',
  flexWrap: 'wrap',
};

const titleStyle: CSSProperties = {
  fontSize: 'clamp(2rem, 4vw, 3.25rem)',
  lineHeight: 1.02,
  letterSpacing: '-0.03em',
};

const modalBodyStyle: CSSProperties = {
  width: 'min(26rem, 90vw)',
  padding: '2.4rem 1rem 1rem',
  display: 'grid',
  gap: '0.7rem',
  backgroundColor: 'rgb(var(--color-surface))',
  borderRadius: '0.9rem',
  border: '1px solid rgb(var(--color-border) / 0.35)',
};

const modalLeadStyle: CSSProperties = {
  fontWeight: 700,
};

const modalHintStyle: CSSProperties = {
  color: 'rgb(var(--color-muted))',
  fontSize: '0.92rem',
};

const modalTextareaStyle: CSSProperties = {
  width: '100%',
  borderRadius: '0.65rem',
  border: '1px solid rgb(var(--color-border) / 0.35)',
  padding: '0.75rem',
  backgroundColor: 'rgb(var(--color-surface))',
  color: 'rgb(var(--color-text))',
  resize: 'vertical',
};

const modalInputStyle: CSSProperties = {
  minHeight: '2.5rem',
  borderRadius: '0.65rem',
  border: '1px solid rgb(var(--color-border) / 0.35)',
  padding: '0 0.75rem',
  backgroundColor: 'rgb(var(--color-surface))',
  color: 'rgb(var(--color-text))',
};

const modalActionsStyle: CSSProperties = {
  display: 'flex',
  justifyContent: 'flex-end',
  gap: '0.5rem',
};

const modalSecondaryButtonStyle: CSSProperties = {
  minHeight: '2.3rem',
  padding: '0 0.8rem',
  borderRadius: '0.6rem',
  border: '1px solid rgb(var(--color-border) / 0.35)',
  backgroundColor: 'transparent',
  color: 'rgb(var(--color-text))',
};

const modalPrimaryButtonStyle: CSSProperties = {
  minHeight: '2.3rem',
  padding: '0 0.8rem',
  borderRadius: '0.6rem',
  border: '1px solid rgb(var(--color-border) / 0.35)',
  backgroundColor: 'rgb(var(--color-text) / 0.9)',
  color: 'rgb(var(--color-surface))',
};

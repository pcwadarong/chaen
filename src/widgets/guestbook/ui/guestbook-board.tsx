'use client';

import { css } from '@emotion/react';
import { useTranslations } from 'next-intl';
import React, { useCallback, useEffect, useMemo, useState } from 'react';

import type { GuestbookThreadItem } from '@/entities/guestbook/model/types';
import { useGuestbookFeed } from '@/features/guestbook-feed/model/use-guestbook-feed';
import { GuestbookFeed } from '@/features/guestbook-feed/ui/guestbook-feed';
import { useAuth } from '@/shared/providers';
import { Button } from '@/shared/ui/button/button';
import { CommentComposeForm } from '@/shared/ui/comment-compose-form';
import { Input } from '@/shared/ui/input/input';
import { Modal } from '@/shared/ui/modal/modal';
import { Textarea } from '@/shared/ui/textarea/textarea';
import { type ToastItem, ToastViewport } from '@/shared/ui/toast/toast';
import { useGuestbookActionModal } from '@/widgets/guestbook/model/use-guestbook-action-modal';
import { useGuestbookComposeActions } from '@/widgets/guestbook/model/use-guestbook-compose-actions';

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

  const composeText = useMemo(
    () => ({
      toastCreateError: t('toastCreateError'),
      toastCreateSuccess: t('toastCreateSuccess'),
      toastReplyError: t('toastReplyError'),
      toastReplySuccess: t('toastReplySuccess'),
      toastSecretVerifyError: t('toastSecretVerifyError'),
    }),
    [t],
  );

  const { handleRevealSecret, handleSubmit } = useGuestbookComposeActions({
    feedMutations: {
      applyServerThreadEntry,
      prependLocalThread,
      removeThreadById,
      updateThreadById,
    },
    isAdmin,
    pushToast,
    replyTarget,
    setReplyTarget,
    text: composeText,
  });

  const modalText = useMemo(
    () => ({
      deleteModalTitle: t('deleteModalTitle'),
      editContentUnchanged: t('editContentUnchanged'),
      editModalTitle: t('editModalTitle'),
      requiredField: t('requiredField'),
      secretVerifyFailed: t('secretVerifyFailed'),
      toastDeleteError: t('toastDeleteError'),
      toastDeleteSuccess: t('toastDeleteSuccess'),
      toastEditError: t('toastEditError'),
      toastEditSuccess: t('toastEditSuccess'),
      toastSecretUnlockRequired: t('toastSecretUnlockRequired'),
    }),
    [t],
  );

  const {
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
  } = useGuestbookActionModal({
    applyServerThread,
    applyServerThreadEntry,
    items,
    pushToast,
    removeThreadById,
    text: modalText,
    updateThreadById,
  });

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

      <CommentComposeForm
        allowSecretToggle={!isAdmin}
        authorBlogUrlPlaceholder={t('composeAuthorBlogUrlPlaceholder')}
        authorBlogUrlLabel={t('composeAuthorBlogUrlLabel')}
        authorMode={isAdmin ? 'preset' : 'manual'}
        authorNamePlaceholder={t('composeAuthorNamePlaceholder')}
        authorNameLabel={t('composeAuthorNameLabel')}
        characterCountLabel={t('composeCharacterCountLabel')}
        contentLabel={t('composeContentLabel')}
        contentShortcutHint={t('composeContentShortcutHint')}
        isReplyMode={Boolean(replyTarget && isAdmin)}
        onSubmit={handleSubmit}
        onReplyTargetReset={() => setReplyTarget(null)}
        passwordPlaceholder={t('composePasswordPlaceholder')}
        passwordLabel={t('composePasswordLabel')}
        presetAuthorName="admin"
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
            <Textarea
              aria-label={t('editModalTitle')}
              maxLength={3000}
              onChange={event => {
                setModalContent(event.target.value);
                if (modalError) setModalError(null);
              }}
              ref={modalTextareaRef}
              rows={4}
              value={modalContent}
            />
          ) : (
            <p id={ACTION_MODAL_DESCRIPTION_ID} css={modalHintStyle}>
              {t('deleteModalHint')}
            </p>
          )}
          {!shouldHideModalPassword ? (
            <Input
              aria-label={t('password')}
              onChange={event => {
                setModalPassword(event.target.value);
                if (modalError) setModalError(null);
              }}
              placeholder={t('password')}
              ref={modalPasswordInputRef}
              required
              type="password"
              value={modalPassword}
            />
          ) : null}
          {modalError ? (
            <p role="alert" css={modalErrorStyle}>
              {modalError}
            </p>
          ) : null}
          <div css={modalActionsStyle}>
            <Button
              disabled={isModalSubmitting}
              onClick={() => void handleConfirmModal()}
              tone="black"
              type="button"
            >
              {modalState?.mode === 'edit' ? t('editConfirm') : t('deleteConfirm')}
            </Button>
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

const modalErrorStyle = css`
  color: rgb(var(--color-danger));
  font-size: var(--font-size-14);
`;

const modalActionsStyle = css`
  display: flex;
  justify-content: flex-end;
  gap: var(--space-2);
`;

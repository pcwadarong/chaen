'use client';

import { useLocale, useTranslations } from 'next-intl';
import React, { useActionState, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { css } from 'styled-system/css';

import type { GuestbookThreadItem } from '@/entities/guestbook/model/types';
import { initialSubmitGuestbookEntryState } from '@/features/guestbook-feed/api/guestbook-action-state';
import { submitGuestbookEntry } from '@/features/guestbook-feed/api/guestbook-actions';
import { useGuestbookFeed } from '@/features/guestbook-feed/model/use-guestbook-feed';
import { GuestbookFeed } from '@/features/guestbook-feed/ui/guestbook-feed';
import type { ActionResult } from '@/shared/lib/action/action-result';
import { useAuth } from '@/shared/providers';
import { Button } from '@/shared/ui/button/button';
import { CommentComposeForm } from '@/shared/ui/comment-compose-form';
import { Input } from '@/shared/ui/input/input';
import { Modal } from '@/shared/ui/modal/modal';
import { Textarea } from '@/shared/ui/textarea/textarea';
import { type ToastItem, ToastViewport } from '@/shared/ui/toast/toast';
import { useGuestbookActionModal } from '@/widgets/guestbook/model/use-guestbook-action-modal';

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
  const locale = useLocale();
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
    locale,
  });

  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [replyTarget, setReplyTarget] = useState<GuestbookThreadItem | null>(null);
  const [composeState, composeAction, isComposePending] = useActionState(
    submitGuestbookEntry,
    initialSubmitGuestbookEntryState,
  );
  const isInitialComposeRenderRef = useRef(true);
  const lastHandledComposeStateRef = useRef<ActionResult<{ entry: unknown }> | null>(null);

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

  useEffect(() => {
    if (isInitialComposeRenderRef.current) {
      isInitialComposeRenderRef.current = false;
      return;
    }
    if (lastHandledComposeStateRef.current === composeState) return;
    lastHandledComposeStateRef.current = composeState;

    if (!composeState.ok || !composeState.data) {
      if (!composeState.errorMessage) return;

      const errorText = replyTarget && isAdmin ? t('toastReplyError') : t('toastCreateError');
      pushToast(`${errorText} (${composeState.errorMessage})`, 'error');
      return;
    }

    const createdEntry = composeState.data.entry;
    if (createdEntry.parent_id) {
      updateThreadById(createdEntry.parent_id, item => ({
        ...item,
        replies: [...item.replies, createdEntry],
      }));
      pushToast(t('toastReplySuccess'), 'success');
    } else {
      prependLocalThread({
        ...createdEntry,
        replies: [],
      });
      pushToast(t('toastCreateSuccess'), 'success');
    }
    setReplyTarget(null);
  }, [composeState, isAdmin, prependLocalThread, pushToast, replyTarget, t, updateThreadById]);

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
    isAdmin,
    items,
    pushToast,
    removeThreadById,
    text: modalText,
    updateThreadById,
    locale,
  });

  const isAdminAuthoredActionModalVisible = Boolean(modalState?.entry.is_admin_author) && isAdmin;
  const isNonAdminAuthoredActionModalVisible =
    Boolean(modalState) && !modalState?.entry.is_admin_author;
  const isActionModalVisible =
    isNonAdminAuthoredActionModalVisible || isAdminAuthoredActionModalVisible;

  return (
    <div className={boardClass}>
      <section className={feedWrapClass}>
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
          onRevealSecretSuccess={applyServerThreadEntry}
          onReply={entry => setReplyTarget(entry)}
          onRetry={retryInitialLoad}
        />
      </section>

      <CommentComposeForm
        formAction={composeAction}
        allowSecretToggle={!isAdmin}
        authorBlogUrlLabel={t('composeAuthorBlogUrlLabel')}
        authorBlogUrlInvalidMessage={t('composeAuthorBlogUrlInvalid')}
        authorBlogUrlPlaceholder={t('composeAuthorBlogUrlPlaceholder')}
        authorMode={isAdmin ? 'preset' : 'manual'}
        authorNamePlaceholder={t('composeAuthorNamePlaceholder')}
        authorNameLabel={t('composeAuthorNameLabel')}
        characterCountLabel={t('composeCharacterCountLabel')}
        contentLabel={t('composeContentLabel')}
        contentShortcutHint={t('composeContentShortcutHint')}
        hiddenFields={{
          locale,
          parentId: isAdmin && replyTarget ? replyTarget.id : null,
        }}
        isSubmittingOverride={isComposePending}
        isReplyMode={Boolean(replyTarget && isAdmin)}
        onReplyTargetReset={() => setReplyTarget(null)}
        passwordPlaceholder={t('composePasswordPlaceholder')}
        passwordLabel={t('composePasswordLabel')}
        presetAuthorName="admin"
        replyPreviewLabel={t('composeReplyPreviewLabel')}
        replyTargetContent={isAdmin ? (replyTarget?.content ?? null) : null}
        replyTargetResetLabel={t('replyTargetResetLabel')}
        secretLabel={t('secretLabel')}
        submissionResult={composeState}
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
        isOpen={isActionModalVisible}
        onClose={closeModal}
      >
        <div className={modalBodyClass}>
          <h2 className={modalLeadClass} id={ACTION_MODAL_TITLE_ID}>
            {modalTitle}
          </h2>
          {modalState?.mode === 'edit' ? (
            <Textarea
              aria-label={t('editModalTitle')}
              defaultValue={modalContent}
              key={`${modalState.entry.id}-${modalState.entry.updated_at}-${modalState.mode}`}
              maxLength={3000}
              onChange={event => {
                setModalContent(event.target.value);
                if (modalError) setModalError(null);
              }}
              ref={modalTextareaRef}
              rows={4}
            />
          ) : (
            <p className={modalHintClass} id={ACTION_MODAL_DESCRIPTION_ID}>
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
            <p className={modalErrorClass} role="alert">
              {modalError}
            </p>
          ) : null}
          <div className={modalActionsClass}>
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

const boardClass = css({
  width: 'full',
  display: 'grid',
});

const feedWrapClass = css({
  width: 'full',
  pb: '72',
  display: 'grid',
  gap: '4',
});

const modalBodyClass = css({
  width: '[min(26rem, 90vw)]',
  px: '4',
  pt: '10',
  pb: '4',
  display: 'grid',
  gap: '3',
  backgroundColor: 'surface',
  borderRadius: 'sm',
});

const modalLeadClass = css({
  fontWeight: 'bold',
});

const modalHintClass = css({
  color: 'muted',
  fontSize: 'sm',
});

const modalErrorClass = css({
  color: 'error',
  fontSize: 'sm',
});

const modalActionsClass = css({
  display: 'flex',
  justifyContent: 'flex-end',
  gap: '2',
});

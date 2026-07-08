'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import React, {
  useActionState,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from 'react';
import { css } from 'styled-system/css';

import { ARTICLE_COMMENT_ERROR_CODE } from '@/entities/article/comment/error';
import type {
  ArticleComment,
  ArticleCommentPage,
  ArticleCommentsSort,
  ArticleCommentThreadItem,
} from '@/entities/article/comment/model';
import { deleteArticleCommentAction } from '@/features/article-comment/api/delete-article-comment';
import { getArticleCommentsPageAction } from '@/features/article-comment/api/get-article-comments-page';
import { submitArticleComment } from '@/features/article-comment/api/submit-article-comment';
import { updateArticleCommentAction } from '@/features/article-comment/api/update-article-comment';
import { initialSubmitArticleCommentState } from '@/features/article-comment/model/submit-article-comment.state';
import { useArticleCommentsPage } from '@/features/article-comment/model/use-article-comments-page';
import { articleComments } from '@/shared/lib/query/query-keys';
import { Button } from '@/shared/ui/button/button';
import { CommentComposeForm } from '@/shared/ui/comment-compose';
import { Input } from '@/shared/ui/input/input';
import { Modal } from '@/shared/ui/modal/modal';
import { SortOrderTabs } from '@/shared/ui/sort-order-tabs/sort-order-tabs';
import { Textarea } from '@/shared/ui/textarea/textarea';
import { type ToastItem, ToastViewport } from '@/shared/ui/toast/toast';
import { createArticleCommentsText } from '@/widgets/article-comments/ui/state/article-comments-text';
import type {
  CommentQueryState,
  ReplyTarget,
} from '@/widgets/article-comments/ui/state/article-comments-types';
import { CommentsThreadListPanel } from '@/widgets/article-comments/ui/thread/article-comments-thread-list-panel';

type ArticleCommentsSectionProps = {
  articleId: string;
  initialPage?: ArticleCommentPage;
  locale: string;
};

type ModalState = {
  entry: ArticleComment;
  mode: 'delete' | 'edit';
} | null;

const LOAD_LAST_PAGE = 9999;
const TOAST_DURATION_MS = 2600;

/**
 * 초기 페이지 데이터가 없을 때 사용하는 빈 댓글 페이지 기본값입니다.
 * (삭제된 브라우저 Map 캐시 모듈의 `DEFAULT_INITIAL_PAGE`를 대체합니다.)
 */
const DEFAULT_INITIAL_PAGE: ArticleCommentPage = {
  items: [],
  page: 1,
  pageSize: 10,
  sort: 'latest',
  totalCount: 0,
  totalPages: 0,
};

/**
 * 아티클 상세 하단 댓글 섹션 위젯입니다.
 */
export const ArticleCommentsSection = ({
  articleId,
  initialPage,
  locale,
}: ArticleCommentsSectionProps) => {
  const t = useTranslations('ArticleComments');
  const queryClient = useQueryClient();
  const titleId = useId();
  const modalTitleId = useId();
  const modalDescriptionId = useId();
  const modalTextareaRef = useRef<HTMLTextAreaElement | null>(null);
  const modalPasswordInputRef = useRef<HTMLInputElement | null>(null);
  const [rootSubmitState, submitRootCommentAction, isRootSubmitting] = useActionState(
    submitArticleComment,
    initialSubmitArticleCommentState,
  );
  const [replySubmitState, submitReplyCommentAction, isReplySubmitting] = useActionState(
    submitArticleComment,
    initialSubmitArticleCommentState,
  );
  const lastHandledRootSubmitStateRef = useRef(rootSubmitState);
  const lastHandledReplySubmitStateRef = useRef(replySubmitState);
  const resolvedInitialPage = initialPage ?? DEFAULT_INITIAL_PAGE;
  const [queryState, setQueryState] = useState<CommentQueryState>({
    page: resolvedInitialPage.page,
    sort: resolvedInitialPage.sort,
  });

  const {
    data,
    error,
    isPending,
    isPlaceholderData,
    refetch: refetchCommentsPage,
  } = useArticleCommentsPage({
    articleId,
    initialData: initialPage,
    locale,
    page: queryState.page,
    sort: queryState.sort,
  });

  const pageData = data ?? DEFAULT_INITIAL_PAGE;
  const isLoading = isPending && !isPlaceholderData;
  const errorMessage = error?.message ?? null;

  const [replyTarget, setReplyTarget] = useState<ReplyTarget | null>(null);
  const [modalState, setModalState] = useState<ModalState>(null);
  const [modalContent, setModalContent] = useState('');
  const [modalPassword, setModalPassword] = useState('');
  const [modalError, setModalError] = useState<string | null>(null);
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const updateCommentMutation = useMutation({
    mutationFn: (variables: { commentId: string; content: string; password: string }) =>
      updateArticleCommentAction({
        articleId,
        commentId: variables.commentId,
        content: variables.content,
        locale,
        password: variables.password,
      }),
  });
  const deleteCommentMutation = useMutation({
    mutationFn: (variables: { commentId: string; password: string }) =>
      deleteArticleCommentAction({
        articleId,
        commentId: variables.commentId,
        locale,
        password: variables.password,
      }),
  });
  const isModalSubmitting = updateCommentMutation.isPending || deleteCommentMutation.isPending;
  const text = useMemo(() => createArticleCommentsText(t), [t]);
  const activeReplyPlaceholder = useMemo(
    () =>
      replyTarget
        ? t('composeReplyPlaceholder', {
            authorName: replyTarget.authorName,
          })
        : null,
    [replyTarget, t],
  );

  useEffect(() => {
    if (toasts.length === 0) return;

    const timers = toasts.map(item =>
      window.setTimeout(() => {
        setToasts(previous => previous.filter(toast => toast.id !== item.id));
      }, TOAST_DURATION_MS),
    );

    return () => {
      timers.forEach(timer => window.clearTimeout(timer));
    };
  }, [toasts]);

  useEffect(() => {
    if (!replyTarget) return;

    const hasReplyThread = pageData.items.some(thread => thread.id === replyTarget.parentId);
    if (!hasReplyThread) {
      setReplyTarget(null);
    }
  }, [pageData.items, replyTarget]);

  const pushToast = useCallback((message: string, tone: ToastItem['tone']) => {
    const id = `toast-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
    setToasts(previous => [...previous, { id, message, tone }]);
  }, []);

  /**
   * 뮤테이션(작성/수정/삭제) 성공 후 대상 페이지를 결정적으로 재조회합니다.
   *
   * 낙관적 업데이트 대신 `fresh: true`로 서버 최신본을 받아 캐시에 심고
   * (`setQueryData`), 표시 상태(`queryState`)를 서버가 clamp한 페이지/정렬로
   * 맞춘 뒤, 형제 페이지들은 `refetchType: 'none'`으로 stale만 표시해 다음
   * 접근 시 새로 조회되도록 합니다.
   *
   * 재조회 자체가 실패하더라도 뮤테이션은 이미 서버에 반영된 상태이므로,
   * 활성 페이지를 포함해 즉시 refetch하는 무효화로 UI가 자동 복구되게 합니다.
   */
  const refreshCommentsPage = useCallback(
    async (nextPage: number, nextSort: ArticleCommentsSort) => {
      let refreshedPage: Awaited<ReturnType<typeof getArticleCommentsPageAction>>['data'] = null;

      try {
        const result = await getArticleCommentsPageAction({
          articleId,
          fresh: true,
          locale,
          page: nextPage,
          sort: nextSort,
        });
        if (result.ok) refreshedPage = result.data;
      } catch {
        // 아래 복구 무효화 경로로 넘어갑니다.
      }

      if (!refreshedPage) {
        await queryClient.invalidateQueries({
          queryKey: articleComments.scope(articleId),
        });
        return;
      }
      queryClient.setQueryData(
        articleComments.page(articleId, locale, refreshedPage.sort, refreshedPage.page),
        refreshedPage,
      );
      setQueryState({
        page: refreshedPage.page,
        sort: refreshedPage.sort,
      });
      queryClient.invalidateQueries({
        queryKey: articleComments.scope(articleId),
        refetchType: 'none',
      });
    },
    [articleId, locale, queryClient],
  );

  const closeModal = useCallback(() => {
    setModalState(null);
    setModalContent('');
    setModalPassword('');
    setModalError(null);
  }, []);

  useEffect(() => {
    if (!data || isPlaceholderData) return;
    if (data.page === queryState.page && data.sort === queryState.sort) return;

    setQueryState({
      page: data.page,
      sort: data.sort,
    });
  }, [data, isPlaceholderData, queryState.page, queryState.sort]);

  const handleChangeSort = useCallback((sort: ArticleCommentsSort) => {
    setQueryState(previous => (previous.sort === sort ? previous : { page: 1, sort }));
  }, []);

  const handleReply = useCallback((thread: ArticleCommentThreadItem, entry: ArticleComment) => {
    setReplyTarget({
      authorName: entry.author_name,
      commentId: entry.id,
      content: entry.content,
      parentId: thread.id,
    });
  }, []);

  const openEditModal = useCallback((entry: ArticleComment) => {
    setModalState({
      entry,
      mode: 'edit',
    });
    setModalContent(entry.content);
    setModalPassword('');
    setModalError(null);
  }, []);

  const openDeleteModal = useCallback((entry: ArticleComment) => {
    setModalState({
      entry,
      mode: 'delete',
    });
    setModalContent('');
    setModalPassword('');
    setModalError(null);
  }, []);

  const handleConfirmModal = useCallback(async () => {
    if (!modalState || isModalSubmitting) return;

    const trimmedPassword = modalPassword.trim();
    const trimmedContent = modalContent.trim();

    if (!trimmedPassword) {
      setModalError(text.requiredField);
      return;
    }

    if (modalState.mode === 'edit') {
      if (!trimmedContent) {
        setModalError(text.requiredField);
        return;
      }
      if (trimmedContent === modalState.entry.content.trim()) {
        setModalError(text.editContentUnchanged);
        return;
      }
    }

    setModalError(null);

    try {
      if (modalState.mode === 'edit') {
        const result = await updateCommentMutation.mutateAsync({
          commentId: modalState.entry.id,
          content: trimmedContent,
          password: trimmedPassword,
        });
        if (!result.ok || !result.data) {
          if (result.errorCode === ARTICLE_COMMENT_ERROR_CODE.invalidPassword) {
            setModalError(text.secretVerifyFailed);
            return;
          }

          pushToast(text.toastEditError, 'error');
          return;
        }

        closeModal();
        await refreshCommentsPage(pageData.page, pageData.sort);
        pushToast(text.toastEditSuccess, 'success');
        return;
      }

      const result = await deleteCommentMutation.mutateAsync({
        commentId: modalState.entry.id,
        password: trimmedPassword,
      });
      if (!result.ok || !result.data) {
        if (result.errorCode === ARTICLE_COMMENT_ERROR_CODE.invalidPassword) {
          setModalError(text.secretVerifyFailed);
          return;
        }

        pushToast(text.toastDeleteError, 'error');
        return;
      }

      closeModal();
      await refreshCommentsPage(pageData.page, pageData.sort);
      pushToast(text.toastDeleteSuccess, 'success');
    } catch (_error) {
      pushToast(modalState.mode === 'edit' ? text.toastEditError : text.toastDeleteError, 'error');
    }
  }, [
    closeModal,
    deleteCommentMutation,
    isModalSubmitting,
    modalContent,
    modalPassword,
    modalState,
    pageData.page,
    pageData.sort,
    pushToast,
    refreshCommentsPage,
    text.editContentUnchanged,
    text.requiredField,
    text.secretVerifyFailed,
    text.toastDeleteError,
    text.toastDeleteSuccess,
    text.toastEditError,
    text.toastEditSuccess,
    updateCommentMutation,
  ]);

  const modalTitle = useMemo(() => {
    if (!modalState) return '';

    return modalState.mode === 'edit' ? text.editModalTitle : text.deleteModalTitle;
  }, [modalState, text.deleteModalTitle, text.editModalTitle]);

  useEffect(() => {
    if (lastHandledRootSubmitStateRef.current === rootSubmitState) return;
    lastHandledRootSubmitStateRef.current = rootSubmitState;

    if (!rootSubmitState.ok) {
      if (rootSubmitState.errorMessage) {
        pushToast(text.toastCreateError, 'error');
      }
      return;
    }

    void refreshCommentsPage(pageData.sort === 'latest' ? 1 : LOAD_LAST_PAGE, pageData.sort);
    pushToast(text.toastCreateSuccess, 'success');
  }, [
    pageData.sort,
    pushToast,
    refreshCommentsPage,
    rootSubmitState,
    text.toastCreateError,
    text.toastCreateSuccess,
  ]);

  useEffect(() => {
    if (lastHandledReplySubmitStateRef.current === replySubmitState) return;
    lastHandledReplySubmitStateRef.current = replySubmitState;

    if (!replySubmitState.ok) {
      if (replySubmitState.errorMessage) {
        pushToast(text.toastReplyError, 'error');
      }
      return;
    }

    setReplyTarget(null);
    void refreshCommentsPage(pageData.page, pageData.sort);
    pushToast(text.toastReplySuccess, 'success');
  }, [
    pageData.page,
    pageData.sort,
    pushToast,
    refreshCommentsPage,
    replySubmitState,
    text.toastReplyError,
    text.toastReplySuccess,
  ]);

  const handleRetryLoad = useCallback(() => {
    void refetchCommentsPage();
  }, [refetchCommentsPage]);
  const handleReplyTargetReset = useCallback(() => {
    setReplyTarget(null);
  }, []);
  const handlePaginationChange = useCallback((page: number) => {
    setQueryState(previous => ({ page, sort: previous.sort }));
  }, []);
  const handleModalContentChange = useCallback((value: string) => {
    setModalContent(value);
    setModalError(previous => (previous ? null : previous));
  }, []);
  const handleModalPasswordChange = useCallback((value: string) => {
    setModalPassword(value);
    setModalError(previous => (previous ? null : previous));
  }, []);
  const handleModalConfirm = useCallback(() => {
    void handleConfirmModal();
  }, [handleConfirmModal]);
  const handleToastClose = useCallback((id: string) => {
    setToasts(previous => previous.filter(item => item.id !== id));
  }, []);
  const hasRenderableComments = pageData.totalCount > 0;
  const shouldRenderSortTabs = hasRenderableComments;
  const shouldRenderThreadPanel = hasRenderableComments || isLoading || Boolean(errorMessage);

  return (
    <section aria-labelledby={titleId} className={sectionClass}>
      <div className={headerClass}>
        <div className={headerTextClass}>
          <h2 className={titleClass} id={titleId}>
            {text.title}
          </h2>
          <p className={descriptionClass}>{text.description}</p>
        </div>
      </div>

      <CommentComposeForm
        allowSecretToggle={false}
        authorBlogUrlLabel={text.composeAuthorBlogUrlLabel}
        authorBlogUrlInvalidMessage={text.composeAuthorBlogUrlInvalidMessage}
        authorBlogUrlPlaceholder={text.composeAuthorBlogUrlPlaceholder}
        authorNameLabel={text.composeAuthorNameLabel}
        authorNamePlaceholder={text.composeAuthorNamePlaceholder}
        characterCountLabel={text.composeCharacterCountLabel}
        contentLabel={t('composeContentLabel')}
        contentShortcutHint={text.composeContentShortcutHint}
        formAction={submitRootCommentAction}
        hiddenFields={{ articleId, locale }}
        isReplyMode={false}
        isSubmittingOverride={isRootSubmitting}
        layout="embedded"
        onReplyTargetReset={handleReplyTargetReset}
        passwordLabel={text.composePasswordLabel}
        passwordPlaceholder={text.composePasswordPlaceholder}
        replyPreviewLabel={text.composeReplyPreviewLabel}
        replyTargetContent={null}
        secretLabel=""
        showReplyPreview={false}
        submitLabel={text.submit}
        submissionResult={rootSubmitState}
        textareaAutoResize={false}
        textareaRows={4}
        textPlaceholder={text.composePlaceholder}
      />

      {shouldRenderSortTabs ? (
        <SortOrderTabs
          currentSort={queryState.sort}
          labels={{
            group: text.sortLabel,
            latest: text.sortLatest,
            oldest: text.sortOldest,
          }}
          onChangeSort={handleChangeSort}
        />
      ) : null}

      {shouldRenderThreadPanel ? (
        <CommentsThreadListPanel
          activeReplyPlaceholder={activeReplyPlaceholder}
          articleId={articleId}
          errorMessage={errorMessage}
          isLoading={isLoading}
          isReplySubmitting={isReplySubmitting}
          locale={locale}
          onDelete={openDeleteModal}
          onEdit={openEditModal}
          onPageChange={handlePaginationChange}
          onReply={handleReply}
          onRetryLoad={handleRetryLoad}
          pageData={pageData}
          queryState={queryState}
          replySubmitState={replySubmitState}
          replyTarget={replyTarget}
          submitReplyCommentAction={submitReplyCommentAction}
          text={text}
        />
      ) : null}

      <Modal
        ariaDescribedBy={modalState?.mode === 'delete' ? modalDescriptionId : undefined}
        ariaLabelledBy={modalTitleId}
        closeAriaLabel={text.modalCloseAriaLabel}
        initialFocusRef={modalState?.mode === 'edit' ? modalTextareaRef : modalPasswordInputRef}
        isOpen={Boolean(modalState)}
        onClose={closeModal}
      >
        <div className={modalBodyClass}>
          <h3 className={modalTitleClass} id={modalTitleId}>
            {modalTitle}
          </h3>
          {modalState?.mode === 'edit' ? (
            <Textarea
              aria-label={text.editModalTitle}
              maxLength={3000}
              onChange={event => handleModalContentChange(event.target.value)}
              ref={modalTextareaRef}
              rows={4}
              value={modalContent}
            />
          ) : (
            <p className={modalDescriptionClass} id={modalDescriptionId}>
              {text.deleteModalHint}
            </p>
          )}
          <Input
            aria-label={text.password}
            onChange={event => handleModalPasswordChange(event.target.value)}
            placeholder={text.password}
            ref={modalPasswordInputRef}
            required
            type="password"
            value={modalPassword}
          />
          {modalError ? (
            <p className={modalErrorClass} role="alert">
              {modalError}
            </p>
          ) : null}
          <div className={modalActionsClass}>
            <Button
              disabled={isModalSubmitting}
              onClick={handleModalConfirm}
              tone="primary"
              type="button"
            >
              {modalState?.mode === 'edit' ? text.editConfirm : text.deleteConfirm}
            </Button>
          </div>
        </div>
      </Modal>

      <ToastViewport closeLabel={text.closeLabel} items={toasts} onClose={handleToastClose} />
    </section>
  );
};

const sectionClass = css({
  display: 'grid',
  gap: '6',
});

const headerClass = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '4',
  _desktopUp: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
});

const headerTextClass = css({
  display: 'grid',
  gap: '2',
  minWidth: '0',
  flexGrow: '1',
  flexShrink: '1',
  flexBasis: '[auto]',
});

const titleClass = css({
  fontSize: '2xl',
  fontWeight: 'semibold',
  letterSpacing: '[-0.03em]',
});

const descriptionClass = css({
  color: 'muted',
  lineHeight: 'relaxed',
  wordBreak: 'keep-all',
});

const modalBodyClass = css({
  width: '[min(26rem, 90vw)]',
  px: '4',
  pt: '10',
  pb: '4',
  display: 'grid',
  gap: '4',
  backgroundColor: 'surface',
  borderRadius: 'sm',
  boxShadow: 'floating',
});

const modalTitleClass = css({
  fontSize: '2xl',
  fontWeight: 'semibold',
});

const modalDescriptionClass = css({
  color: 'muted',
  lineHeight: 'normal',
});

const modalErrorClass = css({
  color: 'error',
  fontSize: 'md',
});

const modalActionsClass = css({
  display: 'flex',
  justifyContent: 'flex-end',
});

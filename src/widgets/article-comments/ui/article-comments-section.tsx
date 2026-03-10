'use client';

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
import { css, cx } from 'styled-system/css';

import { initialSubmitArticleCommentState } from '@/entities/article-comment/api/article-comment-action-state';
import {
  deleteArticleCommentAction,
  getArticleCommentsPageAction,
  submitArticleComment,
  updateArticleCommentAction,
} from '@/entities/article-comment/api/article-comment-actions';
import type {
  ArticleComment,
  ArticleCommentPage,
  ArticleCommentsSort,
  ArticleCommentThreadItem,
} from '@/entities/article-comment/model/types';
import { ActionMenuButton, ActionPopover } from '@/shared/ui/action-popover/action-popover';
import { Button } from '@/shared/ui/button/button';
import { CommentComposeForm } from '@/shared/ui/comment-compose-form';
import {
  ArrowCurveLeftRightIcon,
  EditIcon,
  LinkExternalIcon,
  ReportIcon,
  TrashIcon,
} from '@/shared/ui/icons/app-icons';
import { Input } from '@/shared/ui/input/input';
import { Modal } from '@/shared/ui/modal/modal';
import { Pagination } from '@/shared/ui/pagination/pagination';
import { Textarea } from '@/shared/ui/textarea/textarea';
import { type ToastItem, ToastViewport } from '@/shared/ui/toast/toast';

type ArticleCommentsSectionProps = {
  articleId: string;
  initialPage: ArticleCommentPage;
  locale: string;
};

type ReplyTarget = {
  authorName: string;
  commentId: string;
  content: string;
  parentId: string;
};

type ModalState = {
  entry: ArticleComment;
  mode: 'delete' | 'edit';
} | null;

type CommentQueryState = {
  page: number;
  sort: ArticleCommentsSort;
};

const LOAD_LAST_PAGE = 9999;
const INVALID_PASSWORD_REASON = 'invalid password';
const TOAST_DURATION_MS = 2600;

/**
 * 댓글 시각 문자열을 locale 기준으로 포맷합니다.
 */
const formatCommentDate = (timestamp: string, locale: string) =>
  new Intl.DateTimeFormat(locale, {
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(timestamp));

/**
 * action 에러가 비밀번호 오류인지 판별합니다.
 */
const isInvalidPasswordError = (error: unknown) =>
  error instanceof Error && error.message === INVALID_PASSWORD_REASON;

/**
 * 아티클 상세 하단 댓글 섹션 위젯입니다.
 */
export const ArticleCommentsSection = ({
  articleId,
  initialPage,
  locale,
}: ArticleCommentsSectionProps) => {
  const t = useTranslations('ArticleComments');
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
  const [pageData, setPageData] = useState(initialPage);
  const [queryState, setQueryState] = useState<CommentQueryState>({
    page: initialPage.page,
    sort: initialPage.sort,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [replyTarget, setReplyTarget] = useState<ReplyTarget | null>(null);
  const [modalState, setModalState] = useState<ModalState>(null);
  const [modalContent, setModalContent] = useState('');
  const [modalPassword, setModalPassword] = useState('');
  const [modalError, setModalError] = useState<string | null>(null);
  const [isModalSubmitting, setIsModalSubmitting] = useState(false);
  const [toasts, setToasts] = useState<ToastItem[]>([]);

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
   * 지정된 페이지/정렬 기준으로 댓글 페이지를 다시 조회합니다.
   */
  const loadPage = useCallback(
    async (
      nextPage: number,
      nextSort: ArticleCommentsSort,
      options?: {
        fresh?: boolean;
      },
    ) => {
      setQueryState({
        page: nextPage,
        sort: nextSort,
      });
      setIsLoading(true);
      setErrorMessage(null);

      try {
        const result = await getArticleCommentsPageAction({
          articleId,
          fresh: options?.fresh,
          locale,
          page: nextPage,
          sort: nextSort,
        });

        if (!result.ok || !result.data) {
          throw new Error(result.errorMessage ?? 'failed to load comments');
        }

        setPageData(result.data);
        setQueryState({
          page: result.data.page,
          sort: result.data.sort,
        });
      } catch (_error) {
        setErrorMessage(t('loadError'));
      } finally {
        setIsLoading(false);
      }
    },
    [articleId, locale, t],
  );

  const closeModal = () => {
    setModalState(null);
    setModalContent('');
    setModalPassword('');
    setModalError(null);
  };

  const handleChangeSort = (sort: ArticleCommentsSort) => {
    if (sort === queryState.sort) return;
    void loadPage(1, sort);
  };

  const handleReply = (thread: ArticleCommentThreadItem, entry: ArticleComment) => {
    setReplyTarget({
      authorName: entry.author_name,
      commentId: entry.id,
      content: entry.content,
      parentId: thread.id,
    });
  };

  const openEditModal = (entry: ArticleComment) => {
    setModalState({
      entry,
      mode: 'edit',
    });
    setModalContent(entry.content);
    setModalPassword('');
    setModalError(null);
  };

  const openDeleteModal = (entry: ArticleComment) => {
    setModalState({
      entry,
      mode: 'delete',
    });
    setModalContent('');
    setModalPassword('');
    setModalError(null);
  };

  const handleConfirmModal = async () => {
    if (!modalState || isModalSubmitting) return;

    const trimmedPassword = modalPassword.trim();
    const trimmedContent = modalContent.trim();

    if (!trimmedPassword) {
      setModalError(t('requiredField'));
      return;
    }

    if (modalState.mode === 'edit') {
      if (!trimmedContent) {
        setModalError(t('requiredField'));
        return;
      }
      if (trimmedContent === modalState.entry.content.trim()) {
        setModalError(t('editContentUnchanged'));
        return;
      }
    }

    setModalError(null);
    setIsModalSubmitting(true);

    try {
      if (modalState.mode === 'edit') {
        const result = await updateArticleCommentAction({
          articleId,
          commentId: modalState.entry.id,
          content: trimmedContent,
          locale,
          password: trimmedPassword,
        });
        if (!result.ok || !result.data) {
          throw new Error(result.errorMessage ?? 'failed to update comment');
        }
        pushToast(t('toastEditSuccess'), 'success');
      }

      if (modalState.mode === 'delete') {
        const result = await deleteArticleCommentAction({
          articleId,
          commentId: modalState.entry.id,
          locale,
          password: trimmedPassword,
        });
        if (!result.ok || !result.data) {
          throw new Error(result.errorMessage ?? 'failed to delete comment');
        }
        pushToast(t('toastDeleteSuccess'), 'success');
      }

      closeModal();
      await loadPage(pageData.page, pageData.sort, {
        fresh: true,
      });
    } catch (error) {
      if (isInvalidPasswordError(error)) {
        setModalError(t('secretVerifyFailed'));
      } else {
        pushToast(
          modalState.mode === 'edit' ? t('toastEditError') : t('toastDeleteError'),
          'error',
        );
      }
    } finally {
      setIsModalSubmitting(false);
    }
  };

  const modalTitle = useMemo(() => {
    if (!modalState) return '';

    return modalState.mode === 'edit' ? t('editModalTitle') : t('deleteModalTitle');
  }, [modalState, t]);

  useEffect(() => {
    if (lastHandledRootSubmitStateRef.current === rootSubmitState) return;
    lastHandledRootSubmitStateRef.current = rootSubmitState;

    if (!rootSubmitState.ok) {
      if (rootSubmitState.errorMessage) {
        pushToast(t('toastCreateError'), 'error');
      }
      return;
    }

    void loadPage(pageData.sort === 'latest' ? 1 : LOAD_LAST_PAGE, pageData.sort, {
      fresh: true,
    });
    pushToast(t('toastCreateSuccess'), 'success');
  }, [loadPage, pageData.sort, pushToast, rootSubmitState, t]);

  useEffect(() => {
    if (lastHandledReplySubmitStateRef.current === replySubmitState) return;
    lastHandledReplySubmitStateRef.current = replySubmitState;

    if (!replySubmitState.ok) {
      if (replySubmitState.errorMessage) {
        pushToast(t('toastReplyError'), 'error');
      }
      return;
    }

    setReplyTarget(null);
    void loadPage(pageData.page, pageData.sort, {
      fresh: true,
    });
    pushToast(t('toastReplySuccess'), 'success');
  }, [loadPage, pageData.page, pageData.sort, pushToast, replySubmitState, t]);

  return (
    <section aria-labelledby={titleId} className={sectionClass}>
      <div className={headerClass}>
        <div className={headerTextClass}>
          <h2 className={titleClass} id={titleId}>
            {t('title')}
          </h2>
          <p className={descriptionClass}>{t('description')}</p>
        </div>
      </div>

      <CommentComposeForm
        allowSecretToggle={false}
        authorBlogUrlLabel={t('composeAuthorBlogUrlLabel')}
        authorBlogUrlInvalidMessage={t('composeAuthorBlogUrlInvalid')}
        authorBlogUrlPlaceholder={t('composeAuthorBlogUrlPlaceholder')}
        authorNameLabel={t('composeAuthorNameLabel')}
        authorNamePlaceholder={t('composeAuthorNamePlaceholder')}
        characterCountLabel={t('composeCharacterCountLabel')}
        contentLabel={t('composeContentLabel')}
        contentShortcutHint={t('composeContentShortcutHint')}
        formAction={submitRootCommentAction}
        hiddenFields={{ articleId, locale }}
        isReplyMode={false}
        isSubmittingOverride={isRootSubmitting}
        layout="embedded"
        passwordLabel={t('composePasswordLabel')}
        passwordPlaceholder={t('composePasswordPlaceholder')}
        replyPreviewLabel={t('composeReplyPreviewLabel')}
        replyTargetContent={null}
        secretLabel=""
        showReplyPreview={false}
        submitLabel={t('submit')}
        submissionResult={rootSubmitState}
        textareaAutoResize={false}
        textareaRows={4}
        textPlaceholder={t('composePlaceholder')}
      />

      <div className={listToolbarClass}>
        <div aria-label={t('sortLabel')} className={sortGroupClass} role="tablist">
          <Button
            aria-selected={pageData.sort === 'latest'}
            className={cx(
              sortButtonClass,
              queryState.sort === 'latest' ? activeSortButtonClass : undefined,
            )}
            onClick={() => handleChangeSort('latest')}
            role="tab"
            size="sm"
            tone="white"
            type="button"
            variant={queryState.sort === 'latest' ? 'solid' : 'ghost'}
          >
            {t('sortLatest')}
          </Button>
          <Button
            aria-selected={queryState.sort === 'oldest'}
            className={cx(
              sortButtonClass,
              queryState.sort === 'oldest' ? activeSortButtonClass : undefined,
            )}
            onClick={() => handleChangeSort('oldest')}
            role="tab"
            size="sm"
            tone="white"
            type="button"
            variant={queryState.sort === 'oldest' ? 'solid' : 'ghost'}
          >
            {t('sortOldest')}
          </Button>
        </div>
      </div>

      {errorMessage && pageData.items.length === 0 ? (
        <div className={stateCardClass} role="alert">
          <p className={stateTextClass}>{errorMessage}</p>
          <Button
            onClick={() => void loadPage(pageData.page, pageData.sort)}
            tone="white"
            type="button"
          >
            {t('retry')}
          </Button>
        </div>
      ) : null}

      {!errorMessage && isLoading && pageData.items.length === 0 ? (
        <div className={stateCardClass}>
          <p className={stateTextClass}>{t('loading')}</p>
        </div>
      ) : null}

      {isLoading && pageData.items.length > 0 ? (
        <CommentsLoadingSkeleton loadingText={t('loading')} />
      ) : null}

      {!isLoading && !errorMessage && pageData.items.length === 0 ? (
        <div className={stateCardClass}>
          <p className={stateTextClass}>{t('emptyItems')}</p>
        </div>
      ) : null}

      {!isLoading && pageData.items.length > 0 ? (
        <ol className={threadListClass}>
          {pageData.items.map(thread => (
            <li key={thread.id}>
              <article className={threadCardClass}>
                <CommentEntryCard
                  actionDeleteLabel={t('delete')}
                  actionEditLabel={t('edit')}
                  actionMenuLabel={t('actionMenuLabel')}
                  actionMenuPanelLabel={t('actionMenuPanelLabel')}
                  actionReplyLabel={t('reply')}
                  dateText={formatCommentDate(thread.created_at, locale)}
                  deletedPlaceholder={t('deletedPlaceholder')}
                  entry={thread}
                  isReply={false}
                  onDelete={openDeleteModal}
                  onEdit={openEditModal}
                  onReply={entry => handleReply(thread, entry)}
                  reportLabel={t('report')}
                />

                {thread.replies.length > 0 ? (
                  <ol className={replyListClass}>
                    {thread.replies.map(reply => (
                      <li key={reply.id}>
                        <CommentEntryCard
                          actionDeleteLabel={t('delete')}
                          actionEditLabel={t('edit')}
                          actionMenuLabel={t('actionMenuLabel')}
                          actionMenuPanelLabel={t('actionMenuPanelLabel')}
                          actionReplyLabel={t('reply')}
                          dateText={formatCommentDate(reply.created_at, locale)}
                          deletedPlaceholder={t('deletedPlaceholder')}
                          entry={reply}
                          isReply
                          onDelete={openDeleteModal}
                          onEdit={openEditModal}
                          onReply={entry => handleReply(thread, entry)}
                          reportLabel={t('report')}
                        />
                      </li>
                    ))}
                  </ol>
                ) : null}

                {replyTarget?.parentId === thread.id ? (
                  <div className={replyComposeWrapClass}>
                    <CommentComposeForm
                      allowSecretToggle={false}
                      authorBlogUrlLabel={t('composeAuthorBlogUrlLabel')}
                      authorBlogUrlInvalidMessage={t('composeAuthorBlogUrlInvalid')}
                      authorBlogUrlPlaceholder={t('composeAuthorBlogUrlPlaceholder')}
                      authorNameLabel={t('composeAuthorNameLabel')}
                      authorNamePlaceholder={t('composeAuthorNamePlaceholder')}
                      characterCountLabel={t('composeCharacterCountLabel')}
                      contentLabel={t('composeReplyContentLabel')}
                      contentShortcutHint={t('composeContentShortcutHint')}
                      formAction={submitReplyCommentAction}
                      hiddenFields={{
                        articleId,
                        locale,
                        parentId: replyTarget.parentId,
                        replyToCommentId: replyTarget.commentId,
                      }}
                      isReplyMode
                      isSubmittingOverride={isReplySubmitting}
                      layout="embedded"
                      passwordLabel={t('composePasswordLabel')}
                      passwordPlaceholder={t('composePasswordPlaceholder')}
                      replyPreviewLabel={t('composeReplyPreviewLabel')}
                      replyTargetContent={replyTarget.content}
                      secretLabel=""
                      showReplyPreview={false}
                      submitLabel={t('submit')}
                      submissionResult={replySubmitState}
                      textareaAutoResize={false}
                      textareaRows={4}
                      textPlaceholder={t('composeReplyPlaceholder', {
                        authorName: replyTarget.authorName,
                      })}
                    />
                  </div>
                ) : null}
              </article>
            </li>
          ))}
        </ol>
      ) : null}

      {!isLoading && pageData.items.length > 0 && pageData.totalPages > 1 ? (
        <div className={footerPaginationWrapClass}>
          <Pagination
            ariaLabel={t('paginationLabel')}
            currentPage={queryState.page}
            onPageChange={page => {
              void loadPage(page, queryState.sort);
            }}
            totalPages={pageData.totalPages}
          />
        </div>
      ) : null}

      <Modal
        ariaDescribedBy={modalState?.mode === 'delete' ? modalDescriptionId : undefined}
        ariaLabelledBy={modalTitleId}
        closeAriaLabel={t('modalCloseAriaLabel')}
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
            <p className={modalDescriptionClass} id={modalDescriptionId}>
              {t('deleteModalHint')}
            </p>
          )}
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
          {modalError ? (
            <p className={modalErrorClass} role="alert">
              {modalError}
            </p>
          ) : null}
          <div className={modalActionsClass}>
            <Button
              disabled={isModalSubmitting}
              onClick={() => void handleConfirmModal()}
              tone="primary"
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
    </section>
  );
};

type CommentsLoadingSkeletonProps = {
  loadingText: string;
};

/**
 * 댓글 정렬/페이지 전환 중 목록 자리에 표시하는 스켈레톤입니다.
 */
const CommentsLoadingSkeleton = ({ loadingText }: CommentsLoadingSkeletonProps) => (
  <div aria-busy="true" aria-label={loadingText} className={commentsLoadingWrapClass} role="status">
    {Array.from({ length: 3 }).map((_, index) => (
      <div className={commentsLoadingCardClass} key={index}>
        <div className={commentsLoadingHeaderClass}>
          <div className={commentsLoadingAuthorClass} />
          <div className={commentsLoadingDateClass} />
        </div>
        <div className={commentsLoadingBodyClass}>
          <div className={commentsLoadingLineLongClass} />
          <div className={commentsLoadingLineShortClass} />
        </div>
        <div className={commentsLoadingReplyClass} />
      </div>
    ))}
  </div>
);

type CommentEntryCardProps = {
  actionDeleteLabel: string;
  actionEditLabel: string;
  actionMenuLabel: string;
  actionMenuPanelLabel: string;
  actionReplyLabel: string;
  dateText: string;
  deletedPlaceholder: string;
  entry: ArticleComment;
  isReply: boolean;
  onDelete: (entry: ArticleComment) => void;
  onEdit: (entry: ArticleComment) => void;
  onReply: (entry: ArticleComment) => void;
  reportLabel: string;
};

/**
 * 원댓글/대댓글 공통 카드 본문을 렌더링합니다.
 */
const CommentEntryCard = ({
  actionDeleteLabel,
  actionEditLabel,
  actionMenuLabel,
  actionMenuPanelLabel,
  actionReplyLabel,
  dateText,
  deletedPlaceholder,
  entry,
  isReply,
  onDelete,
  onEdit,
  onReply,
  reportLabel,
}: CommentEntryCardProps) => {
  const isDeleted = Boolean(entry.deleted_at);
  const [isActionMenuOpen, setIsActionMenuOpen] = useState(false);

  return (
    <div className={cx(entryCardClass, isReply ? replyEntryCardClass : undefined)}>
      <div className={entryHeaderClass}>
        <div className={authorMetaClass}>
          {entry.author_blog_url ? (
            <a
              className={authorLinkClass}
              href={entry.author_blog_url}
              rel="noreferrer noopener"
              target="_blank"
            >
              <strong className={authorNameClass}>{entry.author_name}</strong>
              <LinkExternalIcon aria-hidden color="primary" size="sm" />
            </a>
          ) : (
            <strong className={authorNameClass}>{entry.author_name}</strong>
          )}
          <time className={timeClass} dateTime={entry.created_at}>
            <span>{dateText}</span>
          </time>
        </div>
        {!isDeleted ? (
          <CommentActionPopover
            actionDeleteLabel={actionDeleteLabel}
            actionEditLabel={actionEditLabel}
            actionMenuLabel={actionMenuLabel}
            actionMenuPanelLabel={actionMenuPanelLabel}
            isOpen={isActionMenuOpen}
            onDelete={() => onDelete(entry)}
            onEdit={() => onEdit(entry)}
            onOpenChange={setIsActionMenuOpen}
            reportLabel={reportLabel}
          />
        ) : null}
      </div>

      <div className={entryBodyClass}>
        {isDeleted ? (
          <p className={placeholderTextClass}>{deletedPlaceholder}</p>
        ) : (
          <p className={contentTextClass}>
            {entry.reply_to_author_name ? (
              <span className={mentionTextClass}>@{entry.reply_to_author_name} </span>
            ) : null}
            {entry.content}
          </p>
        )}
      </div>

      {!isDeleted ? (
        <div className={entryFooterClass}>
          <button className={replyButtonClass} onClick={() => onReply(entry)} type="button">
            <span aria-hidden className={replyButtonIconMotionClass}>
              <ArrowCurveLeftRightIcon aria-hidden size="sm" />
            </span>
            <span>{actionReplyLabel}</span>
          </button>
        </div>
      ) : null}
    </div>
  );
};

type CommentActionPopoverProps = {
  actionDeleteLabel: string;
  actionEditLabel: string;
  actionMenuLabel: string;
  actionMenuPanelLabel: string;
  isOpen: boolean;
  onDelete: () => void;
  onEdit: () => void;
  onOpenChange: (nextOpen: boolean) => void;
  reportLabel: string;
};

/**
 * 댓글 버블 우측 kebab 버튼으로 여는 액션 팝오버입니다.
 */
const CommentActionPopover = ({
  actionDeleteLabel,
  actionEditLabel,
  actionMenuLabel,
  actionMenuPanelLabel,
  isOpen,
  onDelete,
  onEdit,
  onOpenChange,
  reportLabel,
}: CommentActionPopoverProps) => (
  <ActionPopover
    isOpen={isOpen}
    onOpenChange={onOpenChange}
    panelLabel={actionMenuPanelLabel}
    triggerLabel={actionMenuLabel}
  >
    {({ closePopover }) => (
      <>
        <ActionMenuButton
          icon={<EditIcon aria-hidden size="sm" />}
          label={actionEditLabel}
          onClick={() => {
            closePopover();
            onEdit();
          }}
        />
        <ActionMenuButton
          icon={<TrashIcon aria-hidden size="sm" />}
          label={actionDeleteLabel}
          onClick={() => {
            closePopover();
            onDelete();
          }}
        />
        <ActionMenuButton
          ariaDisabled
          icon={<ReportIcon aria-hidden size="sm" />}
          label={reportLabel}
        />
      </>
    )}
  </ActionPopover>
);

const sectionClass = css({
  display: 'grid',
  gap: '6',
});

const headerClass = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '4',
  '@media (min-width: 721px)': {
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

const listToolbarClass = css({
  display: 'flex',
  justifyContent: 'flex-end',
  paddingTop: '2',
  paddingBottom: '1',
  marginTop: '1',
});

const sortGroupClass = css({
  display: 'inline-flex',
  alignItems: 'center',
  gap: '1',
  width: '[fit-content]',
  maxWidth: 'full',
  p: '1',
  borderRadius: 'full',
  background: 'surfaceMuted',
  border: '[1px solid var(--colors-border)]',
});

const sortButtonClass = css({
  color: 'muted',
  fontSize: 'md',
  fontWeight: 'medium',
  _hover: {
    color: 'primary',
  },
  _focusVisible: {
    color: 'primary',
  },
});

const activeSortButtonClass = css({
  background: 'surface',
  color: 'text',
  borderColor: 'transparent',
  fontWeight: 'semibold',
});

const stateCardClass = css({
  display: 'grid',
  justifyItems: 'center',
  gap: '3',
  p: '6',
  borderRadius: 'xl',
  border: '[1px solid var(--colors-border)]',
  background: 'surfaceMuted',
});

const stateTextClass = css({
  color: 'muted',
  textAlign: 'center',
});

const commentsLoadingWrapClass = css({
  display: 'grid',
  marginTop: '2',
});

const commentsLoadingCardClass = css({
  display: 'grid',
  gap: '3',
  paddingY: '4',
  borderTop: '[1px solid var(--colors-border)]',
  _first: {
    borderTop: 'none',
  },
});

const commentsLoadingHeaderClass = css({
  display: 'flex',
  alignItems: 'center',
  gap: '3',
});

const commentsLoadingBodyClass = css({
  display: 'grid',
  gap: '2',
});

const commentsLoadingAuthorClass = css({
  width: '24',
  height: '7',
  borderRadius: 'md',
  background:
    '[linear-gradient(90deg, rgba(148,163,184,0.10) 0%, rgba(148,163,184,0.22) 48%, rgba(148,163,184,0.10) 100%)]',
  backgroundSize: '[200% 100%]',
  animation: '[route-skeleton-shimmer 1.4s ease-in-out infinite]',
});

const commentsLoadingDateClass = css({
  width: '36',
  height: '5',
  borderRadius: 'md',
  background:
    '[linear-gradient(90deg, rgba(148,163,184,0.10) 0%, rgba(148,163,184,0.22) 48%, rgba(148,163,184,0.10) 100%)]',
  backgroundSize: '[200% 100%]',
  animation: '[route-skeleton-shimmer 1.4s ease-in-out infinite]',
});

const commentsLoadingLineLongClass = css({
  width: '[72%]',
  height: '6',
  borderRadius: 'md',
  background:
    '[linear-gradient(90deg, rgba(148,163,184,0.10) 0%, rgba(148,163,184,0.22) 48%, rgba(148,163,184,0.10) 100%)]',
  backgroundSize: '[200% 100%]',
  animation: '[route-skeleton-shimmer 1.4s ease-in-out infinite]',
});

const commentsLoadingLineShortClass = css({
  width: '[52%]',
  height: '6',
  borderRadius: 'md',
  background:
    '[linear-gradient(90deg, rgba(148,163,184,0.10) 0%, rgba(148,163,184,0.22) 48%, rgba(148,163,184,0.10) 100%)]',
  backgroundSize: '[200% 100%]',
  animation: '[route-skeleton-shimmer 1.4s ease-in-out infinite]',
});

const commentsLoadingReplyClass = css({
  width: '20',
  height: '5',
  borderRadius: 'md',
  background:
    '[linear-gradient(90deg, rgba(148,163,184,0.10) 0%, rgba(148,163,184,0.22) 48%, rgba(148,163,184,0.10) 100%)]',
  backgroundSize: '[200% 100%]',
  animation: '[route-skeleton-shimmer 1.4s ease-in-out infinite]',
});

const threadListClass = css({
  display: 'grid',
  listStyle: 'none',
  p: '0',
  marginTop: '2',
});

const threadCardClass = css({
  display: 'grid',
  gap: '0',
});

const replyListClass = css({
  display: 'grid',
  listStyle: 'none',
  paddingTop: '0',
  paddingRight: '0',
  paddingBottom: '0',
  paddingLeft: '4',
  marginTop: '1',
  '@media (min-width: 721px)': {
    paddingLeft: '6',
  },
});

const replyComposeWrapClass = css({
  paddingLeft: '4',
  paddingBottom: '5',
  marginTop: '1',
  '@media (min-width: 721px)': {
    paddingLeft: '6',
    paddingBottom: '6',
  },
});

const entryCardClass = css({
  display: 'grid',
  gap: '3',
  paddingY: '4',
  borderTop: '[1px solid var(--colors-border)]',
});

const replyEntryCardClass = css({
  paddingLeft: '2',
});

const entryHeaderClass = css({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '3',
});

const authorMetaClass = css({
  display: 'flex',
  alignItems: 'center',
  gap: '2',
  flexWrap: 'wrap',
  minWidth: '0',
});

const authorLinkClass = css({
  display: 'inline-flex',
  alignItems: 'center',
  gap: '1',
  color: 'primary',
  textDecoration: 'none',
  _hover: {
    textDecoration: 'underline',
  },
  _focusVisible: {
    outline: '[2px solid var(--colors-focus-ring)]',
    outlineOffset: '[2px]',
    textDecoration: 'underline',
  },
});

const authorNameClass = css({
  fontSize: 'lg',
  fontWeight: 'semibold',
});

const entryBodyClass = css({
  display: 'grid',
  gap: '1',
});

const contentTextClass = css({
  whiteSpace: 'pre-wrap',
  lineHeight: 'relaxed',
  wordBreak: 'break-word',
});

const mentionTextClass = css({
  color: 'primary',
  fontWeight: 'medium',
});

const placeholderTextClass = css({
  color: 'muted',
});

const entryFooterClass = css({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'flex-start',
  gap: '3',
  flexWrap: 'wrap',
});

const replyButtonClass = css({
  border: 'none',
  background: 'transparent',
  display: 'inline-flex',
  alignItems: 'center',
  gap: '1',
  p: '0',
  color: 'muted',
  fontSize: 'md',
  lineHeight: 'snug',
  _hover: {
    color: 'primary',
  },
  _focusVisible: {
    outline: '[2px solid var(--colors-focus-ring)]',
    outlineOffset: '[2px]',
    color: 'primary',
  },
  '&:hover > span:first-of-type': {
    transform: 'translateX(2px)',
  },
  '&:focus-visible > span:first-of-type': {
    transform: 'translateX(2px)',
  },
});

const replyButtonIconMotionClass = css({
  display: 'inline-flex',
  transition: '[transform 180ms ease]',
});

const timeClass = css({
  display: 'inline-flex',
  alignItems: 'center',
  color: 'muted',
  fontSize: 'sm',
  lineHeight: 'tight',
});

const footerPaginationWrapClass = css({
  display: 'flex',
  justifyContent: 'center',
  paddingTop: '2',
});

const modalBodyClass = css({
  display: 'grid',
  gap: '4',
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

'use client';

import { css } from '@emotion/react';
import { useTranslations } from 'next-intl';
import React, { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';

import type {
  ArticleComment,
  ArticleCommentPage,
  ArticleCommentsSort,
  ArticleCommentThreadItem,
} from '@/entities/article-comment/model/types';
import type { CommentComposeValues } from '@/shared/lib/comment-compose';
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
import {
  createArticleCommentClient,
  deleteArticleCommentClient,
  getArticleCommentsPageClient,
  updateArticleCommentClient,
} from '@/widgets/article-comments/api/client';

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

const LOAD_LAST_PAGE = 9999;
const INVALID_PASSWORD_STATUS = 403;
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
 * API 에러가 비밀번호 오류인지 판별합니다.
 */
const isInvalidPasswordError = (error: unknown) =>
  error instanceof Error && 'status' in error && error.status === INVALID_PASSWORD_STATUS;

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
  const [pageData, setPageData] = useState(initialPage);
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
      setIsLoading(true);
      setErrorMessage(null);

      try {
        const payload = await getArticleCommentsPageClient(articleId, {
          fresh: options?.fresh,
          page: nextPage,
          sort: nextSort,
        });
        setPageData(payload);
      } catch (_error) {
        setErrorMessage(t('loadError'));
      } finally {
        setIsLoading(false);
      }
    },
    [articleId, t],
  );

  const closeModal = () => {
    setModalState(null);
    setModalContent('');
    setModalPassword('');
    setModalError(null);
  };

  const handleChangeSort = (sort: ArticleCommentsSort) => {
    if (sort === pageData.sort) return;
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

  const handleSubmitRootComment = async (values: CommentComposeValues) => {
    try {
      await createArticleCommentClient(articleId, values);
      pushToast(t('toastCreateSuccess'), 'success');
      await loadPage(pageData.sort === 'latest' ? 1 : LOAD_LAST_PAGE, pageData.sort, {
        fresh: true,
      });
    } catch {
      pushToast(t('toastCreateError'), 'error');
    }
  };

  const handleSubmitReply = async (values: CommentComposeValues) => {
    if (!replyTarget) return;

    try {
      await createArticleCommentClient(articleId, {
        ...values,
        parentId: replyTarget.parentId,
        replyToCommentId: replyTarget.commentId,
      });
      setReplyTarget(null);
      pushToast(t('toastReplySuccess'), 'success');
      await loadPage(pageData.page, pageData.sort, {
        fresh: true,
      });
    } catch {
      pushToast(t('toastReplyError'), 'error');
    }
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
        await updateArticleCommentClient(
          articleId,
          modalState.entry.id,
          trimmedContent,
          trimmedPassword,
        );
        pushToast(t('toastEditSuccess'), 'success');
      }

      if (modalState.mode === 'delete') {
        await deleteArticleCommentClient(articleId, modalState.entry.id, trimmedPassword);
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

  return (
    <section aria-labelledby={titleId} css={sectionStyle}>
      <div css={headerStyle}>
        <div css={headerTextStyle}>
          <h2 css={titleStyle} id={titleId}>
            {t('title')}
          </h2>
          <p css={descriptionStyle}>{t('description')}</p>
        </div>
        <div css={toolbarStyle}>
          <div aria-label={t('sortLabel')} css={sortGroupStyle} role="tablist">
            <button
              aria-selected={pageData.sort === 'latest'}
              css={[
                sortButtonStyle,
                pageData.sort === 'latest' ? activeSortButtonStyle : undefined,
              ]}
              onClick={() => handleChangeSort('latest')}
              role="tab"
              type="button"
            >
              {t('sortLatest')}
            </button>
            <button
              aria-selected={pageData.sort === 'oldest'}
              css={[
                sortButtonStyle,
                pageData.sort === 'oldest' ? activeSortButtonStyle : undefined,
              ]}
              onClick={() => handleChangeSort('oldest')}
              role="tab"
              type="button"
            >
              {t('sortOldest')}
            </button>
          </div>
          <Pagination
            ariaLabel={t('paginationLabel')}
            currentPage={pageData.page}
            onPageChange={page => {
              void loadPage(page, pageData.sort);
            }}
            totalPages={pageData.totalPages}
          />
        </div>
      </div>

      <CommentComposeForm
        allowSecretToggle={false}
        authorBlogUrlLabel={t('composeAuthorBlogUrlLabel')}
        authorBlogUrlPlaceholder={t('composeAuthorBlogUrlPlaceholder')}
        authorNameLabel={t('composeAuthorNameLabel')}
        authorNamePlaceholder={t('composeAuthorNamePlaceholder')}
        characterCountLabel={t('composeCharacterCountLabel')}
        contentLabel={t('composeContentLabel')}
        contentShortcutHint={t('composeContentShortcutHint')}
        isReplyMode={false}
        layout="embedded"
        onReplyTargetReset={() => undefined}
        onSubmit={handleSubmitRootComment}
        passwordLabel={t('composePasswordLabel')}
        passwordPlaceholder={t('composePasswordPlaceholder')}
        replyPreviewLabel={t('composeReplyPreviewLabel')}
        replyTargetContent={null}
        replyTargetResetLabel={t('replyTargetResetLabel')}
        secretLabel=""
        submitLabel={t('submit')}
        textareaAutoResize={false}
        textareaRows={4}
        textPlaceholder={t('composePlaceholder')}
      />

      {errorMessage && pageData.items.length === 0 ? (
        <div css={stateCardStyle} role="alert">
          <p css={stateTextStyle}>{errorMessage}</p>
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
        <div css={stateCardStyle}>
          <p css={stateTextStyle}>{t('loading')}</p>
        </div>
      ) : null}

      {!isLoading && !errorMessage && pageData.items.length === 0 ? (
        <div css={stateCardStyle}>
          <p css={stateTextStyle}>{t('emptyItems')}</p>
        </div>
      ) : null}

      {pageData.items.length > 0 ? (
        <ol css={threadListStyle}>
          {pageData.items.map(thread => (
            <li key={thread.id}>
              <article css={threadCardStyle}>
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
                  <ol css={replyListStyle}>
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
                  <div css={replyComposeWrapStyle}>
                    <CommentComposeForm
                      allowSecretToggle={false}
                      authorBlogUrlLabel={t('composeAuthorBlogUrlLabel')}
                      authorBlogUrlPlaceholder={t('composeAuthorBlogUrlPlaceholder')}
                      authorNameLabel={t('composeAuthorNameLabel')}
                      authorNamePlaceholder={t('composeAuthorNamePlaceholder')}
                      characterCountLabel={t('composeCharacterCountLabel')}
                      contentLabel={t('composeReplyContentLabel')}
                      contentShortcutHint={t('composeContentShortcutHint')}
                      isReplyMode
                      layout="embedded"
                      onReplyTargetReset={() => setReplyTarget(null)}
                      onSubmit={handleSubmitReply}
                      passwordLabel={t('composePasswordLabel')}
                      passwordPlaceholder={t('composePasswordPlaceholder')}
                      replyPreviewLabel={t('composeReplyPreviewLabel')}
                      replyTargetContent={replyTarget.content}
                      replyTargetResetLabel={t('replyTargetResetLabel')}
                      secretLabel=""
                      submitLabel={t('replySubmit')}
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

      {pageData.items.length > 0 && pageData.totalPages > 1 ? (
        <div css={footerPaginationWrapStyle}>
          <Pagination
            ariaLabel={t('paginationLabel')}
            currentPage={pageData.page}
            onPageChange={page => {
              void loadPage(page, pageData.sort);
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
        <div css={modalBodyStyle}>
          <h3 css={modalTitleStyle} id={modalTitleId}>
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
            <p css={modalDescriptionStyle} id={modalDescriptionId}>
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
            <p css={modalErrorStyle} role="alert">
              {modalError}
            </p>
          ) : null}
          <div css={modalActionsStyle}>
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
    <div css={[entryCardStyle, isReply ? replyEntryCardStyle : undefined]}>
      <div css={entryHeaderStyle}>
        <div css={authorMetaStyle}>
          {entry.author_blog_url ? (
            <a
              css={authorLinkStyle}
              href={entry.author_blog_url}
              rel="noreferrer noopener"
              target="_blank"
            >
              <strong css={authorNameStyle}>{entry.author_name}</strong>
              <LinkExternalIcon aria-hidden color="primary" size="sm" />
            </a>
          ) : (
            <strong css={authorNameStyle}>{entry.author_name}</strong>
          )}
          <time css={timeStyle} dateTime={entry.created_at}>
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

      <div css={entryBodyStyle}>
        {isDeleted ? (
          <p css={placeholderTextStyle}>{deletedPlaceholder}</p>
        ) : (
          <p css={contentTextStyle}>
            {entry.reply_to_author_name ? (
              <span css={mentionTextStyle}>@{entry.reply_to_author_name} </span>
            ) : null}
            {entry.content}
          </p>
        )}
      </div>

      {!isDeleted ? (
        <div css={entryFooterStyle}>
          <ActionMenuButton
            icon={<ArrowCurveLeftRightIcon aria-hidden size="sm" />}
            label={actionReplyLabel}
            onClick={() => onReply(entry)}
          />
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

const sectionStyle = css`
  display: grid;
  gap: var(--space-6);
`;

const headerStyle = css`
  display: flex;
  flex-direction: column;
  gap: var(--space-4);

  @media (min-width: 721px) {
    flex-direction: row;
    align-items: flex-start;
    justify-content: space-between;
  }
`;

const headerTextStyle = css`
  display: grid;
  gap: var(--space-2);
  min-width: 0;
  flex: 1 1 auto;
`;

const titleStyle = css`
  font-size: var(--font-size-28);
  font-weight: var(--font-weight-semibold);
  letter-spacing: -0.03em;
`;

const descriptionStyle = css`
  color: rgb(var(--color-muted));
  line-height: var(--line-height-160);
  word-break: keep-all;
`;

const toolbarStyle = css`
  display: grid;
  gap: var(--space-3);
  flex: 0 0 auto;

  @media (min-width: 721px) {
    display: flex;
    align-items: flex-start;
    justify-content: flex-end;
  }
`;

const sortGroupStyle = css`
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  padding: var(--space-1);
  border-radius: var(--radius-pill);
  background: rgb(var(--color-surface-muted) / 0.72);
`;

const sortButtonStyle = css`
  border: 0;
  border-radius: var(--radius-pill);
  background: transparent;
  color: rgb(var(--color-muted));
  padding: var(--space-2) var(--space-3);
  font-size: var(--font-size-14);
  font-weight: var(--font-weight-medium);
  transition:
    background-color 160ms ease,
    color 160ms ease,
    box-shadow 160ms ease;

  &:hover,
  &:focus-visible {
    outline: none;
    color: rgb(var(--color-primary));
    box-shadow: 0 0 0 3px rgb(var(--color-primary) / 0.12);
  }
`;

const activeSortButtonStyle = css`
  background: rgb(var(--color-surface));
  color: rgb(var(--color-text));
`;

const stateCardStyle = css`
  display: grid;
  justify-items: center;
  gap: var(--space-3);
  padding: var(--space-6);
  border-radius: var(--radius-xl);
  border: 1px solid rgb(var(--color-border) / 0.18);
  background: rgb(var(--color-surface-muted) / 0.4);
`;

const stateTextStyle = css`
  color: rgb(var(--color-muted));
  text-align: center;
`;

const threadListStyle = css`
  display: grid;
  gap: var(--space-4);
  list-style: none;
  padding: 0;
  margin: 0;
`;

const threadCardStyle = css`
  display: grid;
  gap: var(--space-3);
`;

const replyListStyle = css`
  display: grid;
  gap: var(--space-3);
  list-style: none;
  padding: 0 0 0 var(--space-4);
  margin: 0;
  border-left: 1px solid rgb(var(--color-border) / 0.2);

  @media (min-width: 721px) {
    padding-left: var(--space-6);
  }
`;

const replyComposeWrapStyle = css`
  padding-left: var(--space-4);

  @media (min-width: 721px) {
    padding-left: var(--space-6);
  }
`;

const entryCardStyle = css`
  display: grid;
  gap: var(--space-4);
  padding: var(--space-5);
  border-radius: var(--radius-xl);
  border: 1px solid rgb(var(--color-border) / 0.18);
  background:
    linear-gradient(
      180deg,
      rgb(var(--color-surface) / 0.96),
      rgb(var(--color-surface-muted) / 0.68)
    ),
    rgb(var(--color-surface));
`;

const replyEntryCardStyle = css`
  background:
    linear-gradient(
      180deg,
      rgb(var(--color-surface-muted) / 0.62),
      rgb(var(--color-surface) / 0.96)
    ),
    rgb(var(--color-surface));
`;

const entryHeaderStyle = css`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-3);
`;

const authorMetaStyle = css`
  display: flex;
  align-items: center;
  gap: var(--space-2);
  flex-wrap: wrap;
  min-width: 0;
`;

const authorLinkStyle = css`
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  color: rgb(var(--color-primary));
  text-decoration: none;

  &:hover,
  &:focus-visible {
    text-decoration: underline;
    outline: none;
  }
`;

const authorNameStyle = css`
  font-size: var(--font-size-18);
  font-weight: var(--font-weight-semibold);
`;

const entryBodyStyle = css`
  display: grid;
  gap: var(--space-2);
`;

const contentTextStyle = css`
  white-space: pre-wrap;
  line-height: var(--line-height-160);
  word-break: break-word;
`;

const mentionTextStyle = css`
  color: rgb(var(--color-primary));
  font-weight: var(--font-weight-medium);
`;

const placeholderTextStyle = css`
  color: rgb(var(--color-muted));
`;

const entryFooterStyle = css`
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: var(--space-3);
  flex-wrap: wrap;
`;

const timeStyle = css`
  display: inline-flex;
  align-items: center;
  color: rgb(var(--color-muted));
  font-size: var(--font-size-13);
`;

const footerPaginationWrapStyle = css`
  display: flex;
  justify-content: center;
`;

const modalBodyStyle = css`
  display: grid;
  gap: var(--space-4);
`;

const modalTitleStyle = css`
  font-size: var(--font-size-18);
  font-weight: var(--font-weight-semibold);
`;

const modalDescriptionStyle = css`
  color: rgb(var(--color-muted));
  line-height: var(--line-height-155);
`;

const modalErrorStyle = css`
  color: rgb(var(--color-danger));
  font-size: var(--font-size-14);
`;

const modalActionsStyle = css`
  display: flex;
  justify-content: flex-end;
`;

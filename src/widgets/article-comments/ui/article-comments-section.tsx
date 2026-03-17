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

import { initialSubmitArticleCommentState } from '@/entities/article/comment/api/article-comment-action-state';
import {
  deleteArticleCommentAction,
  getArticleCommentsPageAction,
  submitArticleComment,
  updateArticleCommentAction,
} from '@/entities/article/comment/api/article-comment-actions';
import { ARTICLE_COMMENT_ERROR_CODE } from '@/entities/article/comment/error';
import type {
  ArticleComment,
  ArticleCommentPage,
  ArticleCommentsSort,
  ArticleCommentThreadItem,
} from '@/entities/article/comment/model';
import type { ActionResult } from '@/shared/lib/action/action-result';
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
  initialPage?: ArticleCommentPage;
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

type SubmitArticleCommentActionData = {
  comment: ArticleComment;
};

type ArticleCommentsTranslator = (key: string, values?: Record<string, string>) => string;

const createArticleCommentsText = (t: ArticleCommentsTranslator) => ({
  actionDeleteLabel: t('delete'),
  actionEditLabel: t('edit'),
  actionMenuLabel: t('actionMenuLabel'),
  actionMenuPanelLabel: t('actionMenuPanelLabel'),
  actionReplyLabel: t('reply'),
  closeLabel: t('close'),
  composeAuthorBlogUrlInvalidMessage: t('composeAuthorBlogUrlInvalid'),
  composeAuthorBlogUrlLabel: t('composeAuthorBlogUrlLabel'),
  composeAuthorBlogUrlPlaceholder: t('composeAuthorBlogUrlPlaceholder'),
  composeAuthorNameLabel: t('composeAuthorNameLabel'),
  composeAuthorNamePlaceholder: t('composeAuthorNamePlaceholder'),
  composeCharacterCountLabel: t('composeCharacterCountLabel'),
  composeContentShortcutHint: t('composeContentShortcutHint'),
  composePasswordLabel: t('composePasswordLabel'),
  composePasswordPlaceholder: t('composePasswordPlaceholder'),
  composePlaceholder: t('composePlaceholder'),
  composeReplyContentLabel: t('composeReplyContentLabel'),
  composeReplyPreviewLabel: t('composeReplyPreviewLabel'),
  delete: t('delete'),
  deleteConfirm: t('deleteConfirm'),
  deleteModalHint: t('deleteModalHint'),
  deleteModalTitle: t('deleteModalTitle'),
  deletedPlaceholder: t('deletedPlaceholder'),
  description: t('description'),
  edit: t('edit'),
  editConfirm: t('editConfirm'),
  editContentUnchanged: t('editContentUnchanged'),
  editModalTitle: t('editModalTitle'),
  emptyItems: t('emptyItems'),
  loading: t('loading'),
  modalCloseAriaLabel: t('modalCloseAriaLabel'),
  paginationLabel: t('paginationLabel'),
  password: t('password'),
  reply: t('reply'),
  report: t('report'),
  requiredField: t('requiredField'),
  retry: t('retry'),
  secretVerifyFailed: t('secretVerifyFailed'),
  sortLabel: t('sortLabel'),
  sortLatest: t('sortLatest'),
  sortOldest: t('sortOldest'),
  submit: t('submit'),
  title: t('title'),
  toastCreateError: t('toastCreateError'),
  toastCreateSuccess: t('toastCreateSuccess'),
  toastDeleteError: t('toastDeleteError'),
  toastDeleteSuccess: t('toastDeleteSuccess'),
  toastEditError: t('toastEditError'),
  toastEditSuccess: t('toastEditSuccess'),
  toastReplyError: t('toastReplyError'),
  toastReplySuccess: t('toastReplySuccess'),
});

type ArticleCommentsText = ReturnType<typeof createArticleCommentsText>;

const LOAD_LAST_PAGE = 9999;
const TOAST_DURATION_MS = 2600;
const articleCommentsPageCache = new Map<string, ArticleCommentPage>();
const DEFAULT_INITIAL_PAGE: ArticleCommentPage = {
  items: [],
  page: 1,
  pageSize: 10,
  sort: 'latest',
  totalCount: 0,
  totalPages: 0,
};

/**
 * 댓글 페이지 캐시 키를 생성합니다.
 */
const createArticleCommentsPageCacheKey = ({
  articleId,
  page,
  sort,
}: {
  articleId: string;
  page: number;
  sort: ArticleCommentsSort;
}) => `${articleId}:${sort}:${page}`;

/**
 * 브라우저 세션 메모리에서 댓글 페이지 캐시를 조회합니다.
 */
const getCachedArticleCommentsPage = ({
  articleId,
  page,
  sort,
}: {
  articleId: string;
  page: number;
  sort: ArticleCommentsSort;
}) => {
  if (typeof window === 'undefined') return null;

  return (
    articleCommentsPageCache.get(
      createArticleCommentsPageCacheKey({
        articleId,
        page,
        sort,
      }),
    ) ?? null
  );
};

/**
 * 브라우저 세션 메모리에 댓글 페이지를 저장합니다.
 */
const cacheArticleCommentsPage = (pageData: ArticleCommentPage, articleId: string) => {
  if (typeof window === 'undefined') return;

  articleCommentsPageCache.set(
    createArticleCommentsPageCacheKey({
      articleId,
      page: pageData.page,
      sort: pageData.sort,
    }),
    pageData,
  );
};

/**
 * 테스트에서 댓글 페이지 메모리 캐시를 초기화합니다.
 */
export const resetArticleCommentsPageCacheForTest = () => {
  articleCommentsPageCache.clear();
};

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

type CommentsLoadingSkeletonProps = {
  loadingText: string;
};

/**
 * 댓글 정렬/페이지 전환 중 목록 자리에 표시하는 스켈레톤입니다.
 */
const CommentsLoadingSkeletonBase = ({ loadingText }: CommentsLoadingSkeletonProps) => (
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

CommentsLoadingSkeletonBase.displayName = 'CommentsLoadingSkeleton';

const CommentsLoadingSkeleton = React.memo(CommentsLoadingSkeletonBase);

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
const CommentActionPopoverBase = ({
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

CommentActionPopoverBase.displayName = 'CommentActionPopover';

const CommentActionPopover = React.memo(CommentActionPopoverBase);

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
const CommentEntryCardBase = ({
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
  const handleDelete = useCallback(() => {
    onDelete(entry);
  }, [entry, onDelete]);
  const handleEdit = useCallback(() => {
    onEdit(entry);
  }, [entry, onEdit]);
  const handleReply = useCallback(() => {
    onReply(entry);
  }, [entry, onReply]);

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
            onDelete={handleDelete}
            onEdit={handleEdit}
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
          <button className={replyButtonClass} onClick={handleReply} type="button">
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

CommentEntryCardBase.displayName = 'CommentEntryCard';

const CommentEntryCard = React.memo(CommentEntryCardBase);

type CommentThreadItemViewProps = {
  articleId: string;
  isReplySubmitting: boolean;
  locale: string;
  onDelete: (entry: ArticleComment) => void;
  onEdit: (entry: ArticleComment) => void;
  onReply: (thread: ArticleCommentThreadItem, entry: ArticleComment) => void;
  replyPlaceholder: string | null;
  replySubmitState: ActionResult<SubmitArticleCommentActionData>;
  replyTarget: ReplyTarget | null;
  submitReplyCommentAction: React.FormHTMLAttributes<HTMLFormElement>['action'];
  text: ArticleCommentsText;
  thread: ArticleCommentThreadItem;
};

/**
 * 댓글 스레드 1개와 해당 답글 목록/답글 폼을 묶어 렌더링합니다.
 */
const CommentThreadItemViewBase = ({
  articleId,
  isReplySubmitting,
  locale,
  onDelete,
  onEdit,
  onReply,
  replyPlaceholder,
  replySubmitState,
  replyTarget,
  submitReplyCommentAction,
  text,
  thread,
}: CommentThreadItemViewProps) => {
  const handleReply = useCallback(
    (entry: ArticleComment) => {
      onReply(thread, entry);
    },
    [onReply, thread],
  );
  const isReplyComposeOpen = replyTarget?.parentId === thread.id;

  return (
    <article className={threadCardClass}>
      <CommentEntryCard
        actionDeleteLabel={text.actionDeleteLabel}
        actionEditLabel={text.actionEditLabel}
        actionMenuLabel={text.actionMenuLabel}
        actionMenuPanelLabel={text.actionMenuPanelLabel}
        actionReplyLabel={text.actionReplyLabel}
        dateText={formatCommentDate(thread.created_at, locale)}
        deletedPlaceholder={text.deletedPlaceholder}
        entry={thread}
        isReply={false}
        onDelete={onDelete}
        onEdit={onEdit}
        onReply={handleReply}
        reportLabel={text.report}
      />

      {thread.replies.length > 0 ? (
        <ol className={replyListClass}>
          {thread.replies.map(reply => (
            <li key={reply.id}>
              <CommentEntryCard
                actionDeleteLabel={text.actionDeleteLabel}
                actionEditLabel={text.actionEditLabel}
                actionMenuLabel={text.actionMenuLabel}
                actionMenuPanelLabel={text.actionMenuPanelLabel}
                actionReplyLabel={text.actionReplyLabel}
                dateText={formatCommentDate(reply.created_at, locale)}
                deletedPlaceholder={text.deletedPlaceholder}
                entry={reply}
                isReply
                onDelete={onDelete}
                onEdit={onEdit}
                onReply={handleReply}
                reportLabel={text.report}
              />
            </li>
          ))}
        </ol>
      ) : null}

      {isReplyComposeOpen && replyTarget ? (
        <div className={replyComposeWrapClass}>
          <CommentComposeForm
            allowSecretToggle={false}
            authorBlogUrlLabel={text.composeAuthorBlogUrlLabel}
            authorBlogUrlInvalidMessage={text.composeAuthorBlogUrlInvalidMessage}
            authorBlogUrlPlaceholder={text.composeAuthorBlogUrlPlaceholder}
            authorNameLabel={text.composeAuthorNameLabel}
            authorNamePlaceholder={text.composeAuthorNamePlaceholder}
            characterCountLabel={text.composeCharacterCountLabel}
            contentLabel={text.composeReplyContentLabel}
            contentShortcutHint={text.composeContentShortcutHint}
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
            passwordLabel={text.composePasswordLabel}
            passwordPlaceholder={text.composePasswordPlaceholder}
            replyPreviewLabel={text.composeReplyPreviewLabel}
            replyTargetContent={replyTarget.content}
            secretLabel=""
            showReplyPreview={false}
            submitLabel={text.submit}
            submissionResult={replySubmitState}
            textareaAutoResize={false}
            textareaRows={4}
            textPlaceholder={replyPlaceholder ?? ''}
          />
        </div>
      ) : null}
    </article>
  );
};

CommentThreadItemViewBase.displayName = 'CommentThreadItemView';

const CommentThreadItemView = React.memo(CommentThreadItemViewBase);

type CommentsSortToolbarProps = {
  currentSort: ArticleCommentsSort;
  onChangeSort: (sort: ArticleCommentsSort) => void;
  text: ArticleCommentsText;
};

/**
 * 댓글 정렬 탭 영역만 분리해 작성 폼 입력과 무관한 리렌더를 줄입니다.
 */
const CommentsSortToolbarBase = ({ currentSort, onChangeSort, text }: CommentsSortToolbarProps) => (
  <div className={listToolbarClass}>
    <div aria-label={text.sortLabel} className={sortGroupClass} role="tablist">
      <Button
        aria-selected={currentSort === 'latest'}
        className={cx(
          sortButtonClass,
          currentSort === 'latest' ? activeSortButtonClass : undefined,
        )}
        onClick={() => onChangeSort('latest')}
        role="tab"
        size="sm"
        tone="white"
        type="button"
        variant={currentSort === 'latest' ? 'solid' : 'ghost'}
      >
        {text.sortLatest}
      </Button>
      <Button
        aria-selected={currentSort === 'oldest'}
        className={cx(
          sortButtonClass,
          currentSort === 'oldest' ? activeSortButtonClass : undefined,
        )}
        onClick={() => onChangeSort('oldest')}
        role="tab"
        size="sm"
        tone="white"
        type="button"
        variant={currentSort === 'oldest' ? 'solid' : 'ghost'}
      >
        {text.sortOldest}
      </Button>
    </div>
  </div>
);

CommentsSortToolbarBase.displayName = 'CommentsSortToolbar';

const CommentsSortToolbar = React.memo(CommentsSortToolbarBase);

type CommentsThreadListPanelProps = {
  activeReplyPlaceholder: string | null;
  articleId: string;
  errorMessage: string | null;
  isLoading: boolean;
  isReplySubmitting: boolean;
  locale: string;
  onDelete: (entry: ArticleComment) => void;
  onEdit: (entry: ArticleComment) => void;
  onPageChange: (page: number) => void;
  onReply: (thread: ArticleCommentThreadItem, entry: ArticleComment) => void;
  onRetryLoad: () => void;
  pageData: ArticleCommentPage;
  queryState: CommentQueryState;
  replySubmitState: ActionResult<SubmitArticleCommentActionData>;
  replyTarget: ReplyTarget | null;
  submitReplyCommentAction: React.FormHTMLAttributes<HTMLFormElement>['action'];
  text: ArticleCommentsText;
};

/**
 * 댓글 상태 카드, 목록, 페이지네이션을 묶어 작성 폼 입력과 렌더 경계를 분리합니다.
 */
const CommentsThreadListPanelBase = ({
  activeReplyPlaceholder,
  articleId,
  errorMessage,
  isLoading,
  isReplySubmitting,
  locale,
  onDelete,
  onEdit,
  onPageChange,
  onReply,
  onRetryLoad,
  pageData,
  queryState,
  replySubmitState,
  replyTarget,
  submitReplyCommentAction,
  text,
}: CommentsThreadListPanelProps) => (
  <>
    {errorMessage && pageData.items.length === 0 ? (
      <div className={stateCardClass} role="alert">
        <p className={stateTextClass}>{errorMessage}</p>
        <Button onClick={onRetryLoad} tone="white" type="button">
          {text.retry}
        </Button>
      </div>
    ) : null}

    {!errorMessage && isLoading && pageData.items.length === 0 ? (
      <div className={stateCardClass}>
        <p className={stateTextClass}>{text.loading}</p>
      </div>
    ) : null}

    {isLoading && pageData.items.length > 0 ? (
      <CommentsLoadingSkeleton loadingText={text.loading} />
    ) : null}

    {!isLoading && !errorMessage && pageData.items.length === 0 ? (
      <div className={stateCardClass}>
        <p className={stateTextClass}>{text.emptyItems}</p>
      </div>
    ) : null}

    {!isLoading && pageData.items.length > 0 ? (
      <ol className={threadListClass}>
        {pageData.items.map(thread => (
          <li key={thread.id}>
            <CommentThreadItemView
              articleId={articleId}
              isReplySubmitting={isReplySubmitting}
              locale={locale}
              onDelete={onDelete}
              onEdit={onEdit}
              onReply={onReply}
              replyPlaceholder={replyTarget?.parentId === thread.id ? activeReplyPlaceholder : null}
              replySubmitState={replySubmitState}
              replyTarget={replyTarget}
              submitReplyCommentAction={submitReplyCommentAction}
              text={text}
              thread={thread}
            />
          </li>
        ))}
      </ol>
    ) : null}

    {!isLoading && pageData.items.length > 0 && pageData.totalPages > 1 ? (
      <div className={footerPaginationWrapClass}>
        <Pagination
          ariaLabel={text.paginationLabel}
          currentPage={queryState.page}
          onPageChange={onPageChange}
          totalPages={pageData.totalPages}
        />
      </div>
    ) : null}
  </>
);

CommentsThreadListPanelBase.displayName = 'CommentsThreadListPanel';

const CommentsThreadListPanel = React.memo(CommentsThreadListPanelBase);

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
  const cachedInitialPage = initialPage
    ? null
    : getCachedArticleCommentsPage({
        articleId,
        page: DEFAULT_INITIAL_PAGE.page,
        sort: DEFAULT_INITIAL_PAGE.sort,
      });
  const resolvedInitialPage = initialPage ?? cachedInitialPage ?? DEFAULT_INITIAL_PAGE;
  const [pageData, setPageData] = useState(resolvedInitialPage);
  const [queryState, setQueryState] = useState<CommentQueryState>({
    page: resolvedInitialPage.page,
    sort: resolvedInitialPage.sort,
  });
  const [isLoading, setIsLoading] = useState(!initialPage && !cachedInitialPage);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [replyTarget, setReplyTarget] = useState<ReplyTarget | null>(null);
  const [modalState, setModalState] = useState<ModalState>(null);
  const [modalContent, setModalContent] = useState('');
  const [modalPassword, setModalPassword] = useState('');
  const [modalError, setModalError] = useState<string | null>(null);
  const [isModalSubmitting, setIsModalSubmitting] = useState(false);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
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
          setErrorMessage(result.errorMessage ?? 'article-comments-load-failed');
          return;
        }

        setPageData(result.data);
        cacheArticleCommentsPage(result.data, articleId);
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

  const closeModal = useCallback(() => {
    setModalState(null);
    setModalContent('');
    setModalPassword('');
    setModalError(null);
  }, []);

  useEffect(() => {
    if (initialPage) {
      cacheArticleCommentsPage(initialPage, articleId);
      return;
    }
    if (cachedInitialPage) return;

    void loadPage(DEFAULT_INITIAL_PAGE.page, DEFAULT_INITIAL_PAGE.sort);
  }, [articleId, cachedInitialPage, initialPage, loadPage]);

  const handleChangeSort = useCallback(
    (sort: ArticleCommentsSort) => {
      if (sort === queryState.sort) return;
      void loadPage(1, sort);
    },
    [loadPage, queryState.sort],
  );

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
          if (result.errorCode === ARTICLE_COMMENT_ERROR_CODE.invalidPassword) {
            setModalError(text.secretVerifyFailed);
            return;
          }

          pushToast(text.toastEditError, 'error');
          return;
        }
        pushToast(text.toastEditSuccess, 'success');
      }

      if (modalState.mode === 'delete') {
        const result = await deleteArticleCommentAction({
          articleId,
          commentId: modalState.entry.id,
          locale,
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
        pushToast(text.toastDeleteSuccess, 'success');
      }

      closeModal();
      await loadPage(pageData.page, pageData.sort, {
        fresh: true,
      });
    } catch (_error) {
      pushToast(modalState.mode === 'edit' ? text.toastEditError : text.toastDeleteError, 'error');
    } finally {
      setIsModalSubmitting(false);
    }
  }, [
    articleId,
    closeModal,
    isModalSubmitting,
    loadPage,
    locale,
    modalContent,
    modalPassword,
    modalState,
    pageData.page,
    pageData.sort,
    pushToast,
    text.editContentUnchanged,
    text.requiredField,
    text.secretVerifyFailed,
    text.toastDeleteError,
    text.toastDeleteSuccess,
    text.toastEditError,
    text.toastEditSuccess,
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

    void loadPage(pageData.sort === 'latest' ? 1 : LOAD_LAST_PAGE, pageData.sort, {
      fresh: true,
    });
    pushToast(text.toastCreateSuccess, 'success');
  }, [
    loadPage,
    pageData.sort,
    pushToast,
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
    void loadPage(pageData.page, pageData.sort, {
      fresh: true,
    });
    pushToast(text.toastReplySuccess, 'success');
  }, [
    loadPage,
    pageData.page,
    pageData.sort,
    pushToast,
    replySubmitState,
    text.toastReplyError,
    text.toastReplySuccess,
  ]);

  const handleRetryLoad = useCallback(() => {
    void loadPage(pageData.page, pageData.sort);
  }, [loadPage, pageData.page, pageData.sort]);
  const handleReplyTargetReset = useCallback(() => {
    setReplyTarget(null);
  }, []);
  const handlePaginationChange = useCallback(
    (page: number) => {
      void loadPage(page, queryState.sort);
    },
    [loadPage, queryState.sort],
  );
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

      <CommentsSortToolbar
        currentSort={queryState.sort}
        onChangeSort={handleChangeSort}
        text={text}
      />

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

'use client';

import React from 'react';
import { css } from 'styled-system/css';

import type {
  ArticleComment,
  ArticleCommentPage,
  ArticleCommentThreadItem,
} from '@/entities/article/comment/model';
import type { ActionResult } from '@/shared/lib/action/action-result';
import { Button } from '@/shared/ui/button/button';
import { Pagination } from '@/shared/ui/pagination/pagination';
import type { ArticleCommentsText } from '@/widgets/article-comments/ui/state/article-comments-text';
import type {
  CommentQueryState,
  ReplyTarget,
  SubmitArticleCommentActionData,
} from '@/widgets/article-comments/ui/state/article-comments-types';
import { CommentThreadItemView } from '@/widgets/article-comments/ui/thread/article-comments-thread-item-view';
import { CommentsLoadingSkeleton } from '@/widgets/article-comments/ui/thread/article-comments-thread-list-skeleton';

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
}: CommentsThreadListPanelProps) => {
  const hasItems = pageData.items.length > 0;
  const isInitialLoading = !errorMessage && isLoading && !hasItems;
  const isRefreshingList = isLoading && hasItems;
  const shouldShowEmptyState = !isLoading && !errorMessage && !hasItems;
  const shouldShowErrorState = Boolean(errorMessage) && !hasItems;
  const shouldShowThreadList = !isLoading && hasItems;
  const shouldShowPagination = shouldShowThreadList && pageData.totalPages > 1;

  return (
    <>
      {shouldShowErrorState ? (
        <div className={stateCardClass} role="alert">
          <p className={stateTextClass}>{errorMessage}</p>
          <Button onClick={onRetryLoad} tone="white" type="button">
            {text.retry}
          </Button>
        </div>
      ) : null}

      {isInitialLoading ? <CommentsLoadingSkeleton loadingText={text.loading} /> : null}

      {isRefreshingList ? <CommentsLoadingSkeleton loadingText={text.loading} /> : null}

      {shouldShowEmptyState ? (
        <div className={stateCardClass}>
          <p className={stateTextClass}>{text.emptyItems}</p>
        </div>
      ) : null}

      {shouldShowThreadList ? (
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
                replyPlaceholder={
                  replyTarget?.parentId === thread.id ? activeReplyPlaceholder : null
                }
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

      {shouldShowPagination ? (
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
};

CommentsThreadListPanelBase.displayName = 'CommentsThreadListPanel';

export const CommentsThreadListPanel = React.memo(CommentsThreadListPanelBase);

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

const threadListClass = css({
  display: 'grid',
  listStyle: 'none',
  p: '0',
  marginTop: '2',
});

const footerPaginationWrapClass = css({
  display: 'flex',
  justifyContent: 'center',
  paddingTop: '2',
});

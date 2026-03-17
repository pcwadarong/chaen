'use client';

import React, { useCallback } from 'react';
import { css } from 'styled-system/css';

import type { ArticleComment, ArticleCommentThreadItem } from '@/entities/article/comment/model';
import { CommentEntryCard } from '@/entities/article/comment/ui/comment-entry-card';
import type { ActionResult } from '@/shared/lib/action/action-result';
import { CommentComposeForm } from '@/shared/ui/comment-compose';
import type { ArticleCommentsText } from '@/widgets/article-comments/ui/state/article-comments-text';
import type {
  ReplyTarget,
  SubmitArticleCommentActionData,
} from '@/widgets/article-comments/ui/state/article-comments-types';

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

export const CommentThreadItemView = React.memo(CommentThreadItemViewBase);

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

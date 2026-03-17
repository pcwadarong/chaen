'use client';

import React, { useCallback, useState } from 'react';
import { css, cx } from 'styled-system/css';

import type { ArticleComment } from '@/entities/article/comment/model';
import { ActionMenuButton, ActionPopover } from '@/shared/ui/action-popover/action-popover';
import {
  ArrowCurveLeftRightIcon,
  EditIcon,
  LinkExternalIcon,
  ReportIcon,
  TrashIcon,
} from '@/shared/ui/icons/app-icons';

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

export const CommentEntryCard = React.memo(CommentEntryCardBase);

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

'use client';

import React, {
  type KeyboardEvent,
  type SyntheticEvent,
  useEffect,
  useId,
  useMemo,
  useState,
} from 'react';
import { css, cx } from 'styled-system/css';

import type { CommentComposeValues } from '@/shared/lib/comment-compose';
import {
  hasMinCommentComposePasswordLength,
  isValidCommentComposeAuthorBlogUrl,
  isValidCommentComposeAuthorName,
  normalizeCommentComposePassword,
} from '@/shared/lib/comment-compose';
import { CommentComposeActions } from '@/shared/ui/comment-compose-form/comment-compose-actions';
import { CommentComposeContentField } from '@/shared/ui/comment-compose-form/comment-compose-content-field';
import { CommentComposeProfileFields } from '@/shared/ui/comment-compose-form/comment-compose-profile-fields';
import { CommentComposeReplyPreview } from '@/shared/ui/comment-compose-form/comment-compose-reply-preview';

type CommentComposeFormLayout = 'embedded' | 'fixed';
type CommentComposeAuthorMode = 'manual' | 'preset';

type CommentComposeFormProps = {
  allowSecretToggle?: boolean;
  authorBlogUrlLabel: string;
  authorBlogUrlInvalidMessage: string;
  authorBlogUrlPlaceholder: string;
  authorMode?: CommentComposeAuthorMode;
  authorNamePlaceholder: string;
  authorNameLabel: string;
  characterCountLabel: string;
  contentLabel: string;
  contentShortcutHint: string;
  isReplyMode: boolean;
  layout?: CommentComposeFormLayout;
  onSubmit: (values: CommentComposeValues) => Promise<void> | void;
  onReplyTargetReset: () => void;
  passwordPlaceholder: string;
  passwordLabel: string;
  presetAuthorName?: string;
  replyPreviewLabel: string;
  replyTargetContent: string | null;
  replyTargetResetLabel: string;
  secretLabel: string;
  submitLabel: string;
  textareaAutoResize?: boolean;
  textareaRows?: number;
  textPlaceholder: string;
};

const LOCAL_STORAGE_KEY = 'guestbook_profile_v1';

/**
 * 댓글/방명록 작성 폼입니다.
 * 이름/블로그 필드는 로컬스토리지에 저장해 다음 작성 시 재사용합니다.
 */
export const CommentComposeForm = ({
  allowSecretToggle = true,
  authorBlogUrlLabel,
  authorBlogUrlInvalidMessage,
  authorBlogUrlPlaceholder,
  authorMode = 'manual',
  authorNamePlaceholder,
  authorNameLabel,
  characterCountLabel,
  contentLabel,
  contentShortcutHint,
  isReplyMode,
  layout = 'fixed',
  onSubmit,
  onReplyTargetReset,
  passwordPlaceholder,
  passwordLabel,
  presetAuthorName = '',
  replyPreviewLabel,
  replyTargetContent,
  replyTargetResetLabel,
  secretLabel,
  submitLabel,
  textareaAutoResize = true,
  textareaRows = 1,
  textPlaceholder,
}: CommentComposeFormProps) => {
  const [authorName, setAuthorName] = useState('');
  const [password, setPassword] = useState('');
  const [authorBlogUrl, setAuthorBlogUrl] = useState('');
  const [authorBlogUrlError, setAuthorBlogUrlError] = useState<string | null>(null);
  const [content, setContent] = useState('');
  const [isSecret, setIsSecret] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isPresetAuthorMode = authorMode === 'preset';
  const authorNameId = useId();
  const passwordId = useId();
  const authorBlogUrlId = useId();
  const authorBlogUrlErrorId = useId();
  const contentId = useId();
  const characterCountId = useId();
  const contentShortcutHintId = useId();
  const secretCheckboxId = useId();

  useEffect(() => {
    const stored = window.localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!stored) return;

    try {
      const parsed = JSON.parse(stored) as { authorBlogUrl?: string; authorName?: string };
      if (parsed.authorName) setAuthorName(parsed.authorName);
      if (parsed.authorBlogUrl) setAuthorBlogUrl(parsed.authorBlogUrl);
    } catch {
      // 파싱 실패 시 저장값을 무시합니다.
    }
  }, []);

  // 이름과 블로그 URL이 변경될 때마다 로컬스토리지에 저장
  useEffect(() => {
    window.localStorage.setItem(
      LOCAL_STORAGE_KEY,
      JSON.stringify({
        authorName,
        authorBlogUrl,
      }),
    );
  }, [authorBlogUrl, authorName]);

  const charCountText = useMemo(() => `${content.length}/3000`, [content.length]);

  const submit = async () => {
    if (!content.trim()) return;
    if (
      !isPresetAuthorMode &&
      (!isValidCommentComposeAuthorName(authorName) ||
        !hasMinCommentComposePasswordLength(password))
    ) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        authorName: isPresetAuthorMode ? presetAuthorName : authorName.trim(),
        password: isPresetAuthorMode ? '' : normalizeCommentComposePassword(password),
        authorBlogUrl: isPresetAuthorMode ? '' : authorBlogUrl.trim(),
        isSecret,
        content: content.trim(),
      });
      setContent('');
      setPassword('');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = (event: SyntheticEvent<HTMLFormElement, SubmitEvent>) => {
    event.preventDefault();
    if (!isValidCommentComposeAuthorBlogUrl(authorBlogUrl)) {
      setAuthorBlogUrlError(authorBlogUrlInvalidMessage);
      return;
    }

    setAuthorBlogUrlError(null);
    if (!event.currentTarget.reportValidity()) return;
    void submit();
  };

  // Ctrl+Enter 또는 Cmd+Enter로 폼 제출
  const handleTextareaKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key !== 'Enter' || (!event.ctrlKey && !event.metaKey)) return;
    event.preventDefault();
    event.currentTarget.form?.requestSubmit();
  };

  const handlePasswordChange = (value: string) => {
    setPassword(normalizeCommentComposePassword(value));
  };

  const handleAuthorBlogUrlChange = (value: string) => {
    setAuthorBlogUrl(value);

    if (!authorBlogUrlError) return;
    if (isValidCommentComposeAuthorBlogUrl(value)) {
      setAuthorBlogUrlError(null);
    }
  };

  return (
    <form className={cx(formBaseClass, layoutClassMap[layout])} onSubmit={handleSubmit}>
      <div className={cx(topRowBaseClass, topRowLayoutClassMap[layout])}>
        {!isPresetAuthorMode ? (
          <CommentComposeProfileFields
            authorBlogUrlDescribedBy={authorBlogUrlError ? authorBlogUrlErrorId : undefined}
            authorBlogUrlErrorMessage={authorBlogUrlError}
            authorBlogUrlId={authorBlogUrlId}
            authorBlogUrlLabel={authorBlogUrlLabel}
            authorBlogUrlPlaceholder={authorBlogUrlPlaceholder}
            authorBlogUrlValue={authorBlogUrl}
            authorNameId={authorNameId}
            authorNameLabel={authorNameLabel}
            authorNamePlaceholder={authorNamePlaceholder}
            authorNameValue={authorName}
            onAuthorBlogUrlChange={handleAuthorBlogUrlChange}
            onAuthorNameChange={setAuthorName}
            onPasswordChange={handlePasswordChange}
            passwordId={passwordId}
            passwordLabel={passwordLabel}
            passwordPlaceholder={passwordPlaceholder}
            passwordValue={password}
          />
        ) : null}
        {isReplyMode ? (
          <CommentComposeReplyPreview
            onReset={onReplyTargetReset}
            replyPreviewLabel={replyPreviewLabel}
            replyTargetContent={replyTargetContent}
            replyTargetResetLabel={replyTargetResetLabel}
          />
        ) : null}
        <CommentComposeActions
          allowSecretToggle={allowSecretToggle}
          isSecret={isSecret}
          isSubmitting={isSubmitting}
          onSecretChange={setIsSecret}
          secretCheckboxId={secretCheckboxId}
          secretLabel={secretLabel}
          submitLabel={submitLabel}
        />
      </div>
      <CommentComposeContentField
        characterCountId={characterCountId}
        characterCountLabel={characterCountLabel}
        charCountText={charCountText}
        contentId={contentId}
        contentLabel={contentLabel}
        contentShortcutHint={contentShortcutHint}
        contentShortcutHintId={contentShortcutHintId}
        onChange={setContent}
        onKeyDown={handleTextareaKeyDown}
        textareaAutoResize={textareaAutoResize}
        textareaRows={textareaRows}
        textPlaceholder={textPlaceholder}
        value={content}
      />
    </form>
  );
};

const formBaseClass = css({
  display: 'grid',
  gap: '3',
});

const fixedFormClass = css({
  position: 'fixed',
  left: '0',
  right: '0',
  bottom: '0',
  zIndex: '20',
  borderTop: '[1px solid var(--colors-border)]',
  boxShadow: '[0 -4px 16px rgb(15 23 42 / 0.14)]',
  backgroundColor: 'surfaceMuted',
  backdropFilter: '[blur(18px) saturate(140%)]',
  px: '4',
  pt: '3',
  pb: '[calc(var(--spacing-4) + env(safe-area-inset-bottom))]',
  display: 'grid',
  gap: '3',
  '@media (min-width: 961px)': {
    left: '[50%]',
    right: '[auto]',
    width:
      '[calc(var(--app-frame-width, min(1280px, calc(100vw - 2.5rem))) - var(--app-scrollbar-size, 10px))]',
    transform: '[translateX(calc(-50% - (var(--app-scrollbar-size, 10px) / 2)))]',
    borderBottomLeftRadius: '[var(--app-frame-radius, 2rem)]',
    borderBottomRightRadius: '[var(--app-frame-radius, 2rem)]',
  },
});

const embeddedFormClass = css({
  position: 'static',
  width: 'full',
});

const topRowBaseClass = css({
  display: 'flex',
  gap: '3',
  justifyContent: 'space-between',
});

const fixedTopRowClass = css({
  alignItems: 'center',
});

const embeddedTopRowClass = css({
  alignItems: 'flex-start',
});

const layoutClassMap: Record<CommentComposeFormLayout, string> = {
  embedded: embeddedFormClass,
  fixed: fixedFormClass,
};

const topRowLayoutClassMap: Record<CommentComposeFormLayout, string> = {
  embedded: embeddedTopRowClass,
  fixed: fixedTopRowClass,
};

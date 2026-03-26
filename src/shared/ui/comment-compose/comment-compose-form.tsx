'use client';

import React, {
  type FormHTMLAttributes,
  type KeyboardEvent,
  type SyntheticEvent,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useState,
} from 'react';
import { css, cx } from 'styled-system/css';

import type { ActionResult } from '@/shared/lib/action/action-result';
import type { CommentComposeValues } from '@/shared/lib/comment-compose';
import {
  hasMinCommentComposePasswordLength,
  isValidCommentComposeAuthorBlogUrl,
  isValidCommentComposeAuthorName,
  normalizeCommentComposePassword,
} from '@/shared/lib/comment-compose';
import { CommentComposeActions } from '@/shared/ui/comment-compose/comment-compose-actions';
import { CommentComposeContentField } from '@/shared/ui/comment-compose/comment-compose-content-field';
import { CommentComposeProfileFields } from '@/shared/ui/comment-compose/comment-compose-profile-fields';
import { CommentComposeReplyPreview } from '@/shared/ui/comment-compose/comment-compose-reply-preview';

type CommentComposeFormLayout = 'embedded' | 'fixed';
type CommentComposeAuthorMode = 'manual' | 'preset';

type CommentComposeFormProps = {
  formAction?: FormHTMLAttributes<HTMLFormElement>['action'];
  hiddenFields?: Record<string, string | null | undefined>;
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
  isSubmittingOverride?: boolean;
  layout?: CommentComposeFormLayout;
  onSubmit?: (values: CommentComposeValues) => Promise<void> | void;
  onReplyTargetReset?: () => void;
  passwordPlaceholder: string;
  passwordLabel: string;
  presetAuthorName?: string;
  replyPreviewLabel: string;
  replyTargetContent: string | null;
  replyTargetResetLabel?: string;
  secretLabel: string;
  showReplyPreview?: boolean;
  submitLabel: string;
  submissionResult?: ActionResult<unknown> | null;
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
  formAction,
  hiddenFields,
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
  isSubmittingOverride,
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
  showReplyPreview = true,
  submitLabel,
  submissionResult,
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
  const isServerActionMode = Boolean(formAction);
  const resolvedIsSubmitting = isSubmittingOverride ?? isSubmitting;

  const submit = useCallback(async () => {
    if (!onSubmit) return;
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
  }, [
    authorBlogUrl,
    authorName,
    content,
    isPresetAuthorMode,
    isSecret,
    onSubmit,
    password,
    presetAuthorName,
  ]);

  const handleSubmit = (event: SyntheticEvent<HTMLFormElement, SubmitEvent>) => {
    if (!isValidCommentComposeAuthorBlogUrl(authorBlogUrl)) {
      event.preventDefault();
      setAuthorBlogUrlError(authorBlogUrlInvalidMessage);
      return;
    }

    setAuthorBlogUrlError(null);
    if (!event.currentTarget.reportValidity()) {
      event.preventDefault();
      return;
    }
    if (isServerActionMode) return;

    event.preventDefault();
    void submit();
  };

  // Ctrl+Enter 또는 Cmd+Enter로 폼 제출
  const handleTextareaKeyDown = useCallback((event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key !== 'Enter' || (!event.ctrlKey && !event.metaKey)) return;
    event.preventDefault();
    event.currentTarget.form?.requestSubmit();
  }, []);

  const handlePasswordChange = useCallback((value: string) => {
    setPassword(normalizeCommentComposePassword(value));
  }, []);

  const handleAuthorBlogUrlChange = useCallback(
    (value: string) => {
      setAuthorBlogUrl(value);

      if (!authorBlogUrlError) return;
      if (isValidCommentComposeAuthorBlogUrl(value)) {
        setAuthorBlogUrlError(null);
      }
    },
    [authorBlogUrlError],
  );

  useEffect(() => {
    if (!submissionResult?.ok) return;

    setContent('');
    setPassword('');
    setIsSecret(false);
  }, [submissionResult]);

  return (
    <form
      action={formAction}
      className={cx(formBaseClass, layoutClassMap[layout])}
      onSubmit={handleSubmit}
    >
      {Object.entries(hiddenFields ?? {}).map(([name, value]) =>
        value ? <input key={name} name={name} type="hidden" value={value} /> : null,
      )}
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
        {isReplyMode && showReplyPreview ? (
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
          isSubmitting={resolvedIsSubmitting}
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
      {submissionResult?.errorMessage ? (
        <p className={submitErrorClass} role="alert">
          {submissionResult.errorMessage}
        </p>
      ) : null}
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
  boxShadow: 'floating',
  backgroundColor: 'surfaceMuted',
  backdropFilter: '[blur(18px) saturate(140%)]',
  px: '4',
  pt: '3',
  pb: '[calc(var(--spacing-4) + env(safe-area-inset-bottom))]',
  display: 'grid',
  gap: '3',
  _desktopUp: {
    left: '[50%]',
    right: '[auto]',
    width: '[calc(100vw - 2.5rem - var(--app-scrollbar-size, 10px))]',
    maxWidth: '[calc(var(--sizes-app-frame-max) - var(--app-scrollbar-size, 10px))]',
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

const submitErrorClass = css({
  m: '0',
  color: 'error',
  fontSize: 'sm',
});

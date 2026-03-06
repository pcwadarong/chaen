'use client';

import { css } from '@emotion/react';
import React, {
  type KeyboardEvent,
  type SyntheticEvent,
  useEffect,
  useId,
  useMemo,
  useState,
} from 'react';

import type { GuestbookComposeValues } from '@/features/guestbook-compose/model/types';
import { normalizeComposePassword } from '@/features/guestbook-compose/model/validation';
import { GuestbookComposeActions } from '@/features/guestbook-compose/ui/guestbook-compose-actions';
import { GuestbookComposeContentField } from '@/features/guestbook-compose/ui/guestbook-compose-content-field';
import { GuestbookComposeProfileFields } from '@/features/guestbook-compose/ui/guestbook-compose-profile-fields';
import { GuestbookComposeReplyPreview } from '@/features/guestbook-compose/ui/guestbook-compose-reply-preview';

type GuestbookComposeFormProps = {
  authorBlogUrlPlaceholder: string;
  authorBlogUrlLabel: string;
  authorNamePlaceholder: string;
  authorNameLabel: string;
  characterCountLabel: string;
  contentLabel: string;
  contentShortcutHint: string;
  isAdmin: boolean;
  isReplyMode: boolean;
  onSubmit: (values: GuestbookComposeValues) => Promise<void> | void;
  onReplyTargetReset: () => void;
  passwordPlaceholder: string;
  passwordLabel: string;
  replyPreviewLabel: string;
  replyTargetContent: string | null;
  replyTargetResetLabel: string;
  secretLabel: string;
  submitLabel: string;
  textPlaceholder: string;
};

const LOCAL_STORAGE_KEY = 'guestbook_profile_v1';

/**
 * 하단 고정 방명록 작성 폼입니다.
 * 이름/블로그 필드는 로컬스토리지에 저장해 다음 작성 시 재사용합니다.
 */
export const GuestbookComposeForm = ({
  authorBlogUrlPlaceholder,
  authorBlogUrlLabel,
  authorNamePlaceholder,
  authorNameLabel,
  characterCountLabel,
  contentLabel,
  contentShortcutHint,
  isAdmin,
  isReplyMode,
  onSubmit,
  onReplyTargetReset,
  passwordPlaceholder,
  passwordLabel,
  replyPreviewLabel,
  replyTargetContent,
  replyTargetResetLabel,
  secretLabel,
  submitLabel,
  textPlaceholder,
}: GuestbookComposeFormProps) => {
  const [authorName, setAuthorName] = useState('');
  const [password, setPassword] = useState('');
  const [authorBlogUrl, setAuthorBlogUrl] = useState('');
  const [content, setContent] = useState('');
  const [isSecret, setIsSecret] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const authorNameId = useId();
  const passwordId = useId();
  const authorBlogUrlId = useId();
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
    if (!isAdmin && (!authorName.trim() || normalizeComposePassword(password).length < 4)) return;

    setIsSubmitting(true);
    try {
      await onSubmit({
        authorName: isAdmin ? 'admin' : authorName.trim(),
        password: isAdmin ? '' : normalizeComposePassword(password),
        authorBlogUrl: isAdmin ? '' : authorBlogUrl.trim(),
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
    setPassword(normalizeComposePassword(value));
  };

  return (
    <form onSubmit={handleSubmit} css={formStyle}>
      <div css={topRowStyle}>
        {!isAdmin ? (
          <GuestbookComposeProfileFields
            authorBlogUrlId={authorBlogUrlId}
            authorBlogUrlLabel={authorBlogUrlLabel}
            authorBlogUrlPlaceholder={authorBlogUrlPlaceholder}
            authorBlogUrlValue={authorBlogUrl}
            authorNameId={authorNameId}
            authorNameLabel={authorNameLabel}
            authorNamePlaceholder={authorNamePlaceholder}
            authorNameValue={authorName}
            onAuthorBlogUrlChange={setAuthorBlogUrl}
            onAuthorNameChange={setAuthorName}
            onPasswordChange={handlePasswordChange}
            passwordId={passwordId}
            passwordLabel={passwordLabel}
            passwordPlaceholder={passwordPlaceholder}
            passwordValue={password}
          />
        ) : null}
        {isReplyMode ? (
          <GuestbookComposeReplyPreview
            onReset={onReplyTargetReset}
            replyPreviewLabel={replyPreviewLabel}
            replyTargetContent={replyTargetContent}
            replyTargetResetLabel={replyTargetResetLabel}
          />
        ) : null}
        <GuestbookComposeActions
          isAdmin={isAdmin}
          isSecret={isSecret}
          isSubmitting={isSubmitting}
          onSecretChange={setIsSecret}
          secretCheckboxId={secretCheckboxId}
          secretLabel={secretLabel}
          submitLabel={submitLabel}
        />
      </div>
      <GuestbookComposeContentField
        characterCountId={characterCountId}
        characterCountLabel={characterCountLabel}
        charCountText={charCountText}
        contentId={contentId}
        contentLabel={contentLabel}
        contentShortcutHint={contentShortcutHint}
        contentShortcutHintId={contentShortcutHintId}
        onChange={setContent}
        onKeyDown={handleTextareaKeyDown}
        textPlaceholder={textPlaceholder}
        value={content}
      />
    </form>
  );
};

const formStyle = css`
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 20;
  border-top: 1px solid rgb(var(--color-border) / 0.18);
  box-shadow: 0 -4px 16px rgb(var(--color-black) / 0.14);
  background-color: rgb(var(--color-surface) / 0.82);
  backdrop-filter: blur(18px) saturate(140%);
  -webkit-backdrop-filter: blur(18px) saturate(140%);
  padding: var(--space-3) var(--space-4) calc(var(--space-4) + env(safe-area-inset-bottom));
  display: grid;
  gap: var(--space-3);

  @media (min-width: 961px) {
    left: 50%;
    right: auto;
    width: calc(
      var(--app-frame-width, min(1280px, calc(100vw - 2.5rem))) - var(--app-scrollbar-size, 10px)
    );
    transform: translateX(calc(-50% - (var(--app-scrollbar-size, 10px) / 2)));
    border-bottom-left-radius: var(--app-frame-radius, 2rem);
    border-bottom-right-radius: var(--app-frame-radius, 2rem);
  }
`;

const topRowStyle = css`
  display: flex;
  gap: var(--space-3);
  align-items: center;
  justify-content: space-between;
`;

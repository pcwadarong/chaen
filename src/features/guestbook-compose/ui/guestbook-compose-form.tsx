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
import { srOnlyStyle } from '@/shared/ui/styles/sr-only-style';

type GuestbookComposeFormProps = {
  authorBlogUrlLabel: string;
  authorNameLabel: string;
  characterCountLabel: string;
  contentLabel: string;
  contentShortcutHint: string;
  isAdmin: boolean;
  isReplyMode: boolean;
  onSubmit: (values: GuestbookComposeValues) => Promise<void> | void;
  onReplyTargetReset: () => void;
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
  authorBlogUrlLabel,
  authorNameLabel,
  characterCountLabel,
  contentLabel,
  contentShortcutHint,
  isAdmin,
  isReplyMode,
  onSubmit,
  onReplyTargetReset,
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
    if (!isAdmin && (!authorName.trim() || !password.trim())) return;

    setIsSubmitting(true);
    try {
      await onSubmit({
        authorName: isAdmin ? 'admin' : authorName.trim(),
        password: isAdmin ? '' : password.trim(),
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
    void submit();
  };

  const handleTextareaKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key !== 'Enter' || (!event.ctrlKey && !event.metaKey)) return;
    event.preventDefault();
    event.currentTarget.form?.requestSubmit();
  };

  return (
    <form onSubmit={handleSubmit} css={formStyle}>
      <div css={topRowStyle}>
        {!isAdmin ? (
          <div css={leftFieldsStyle}>
            <label css={fieldWrapStyle} htmlFor={authorNameId}>
              <span css={srOnlyStyle}>{authorNameLabel}</span>
              <input
                id={authorNameId}
                aria-label={authorNameLabel}
                onChange={event => setAuthorName(event.target.value)}
                placeholder={authorNameLabel}
                required
                css={inputStyle}
                value={authorName}
              />
            </label>
            <label css={fieldWrapStyle} htmlFor={passwordId}>
              <span css={srOnlyStyle}>{passwordLabel}</span>
              <input
                id={passwordId}
                aria-label={passwordLabel}
                onChange={event => setPassword(event.target.value)}
                placeholder={passwordLabel}
                required
                css={inputStyle}
                type="password"
                value={password}
              />
            </label>
            <label css={fieldWrapStyle} htmlFor={authorBlogUrlId}>
              <span css={srOnlyStyle}>{authorBlogUrlLabel}</span>
              <input
                id={authorBlogUrlId}
                aria-label={authorBlogUrlLabel}
                onChange={event => setAuthorBlogUrl(event.target.value)}
                placeholder={authorBlogUrlLabel}
                css={inputStyle}
                value={authorBlogUrl}
              />
            </label>
          </div>
        ) : null}
        {isReplyMode ? (
          <aside aria-label={replyPreviewLabel} css={replyPreviewStyle}>
            <span aria-hidden css={replyPreviewIconStyle}>
              ↪
            </span>
            <p css={replyPreviewTextStyle}>{replyTargetContent}</p>
            <button onClick={onReplyTargetReset} css={replyPreviewCloseStyle} type="button">
              {replyTargetResetLabel}
            </button>
          </aside>
        ) : null}
        <div css={rightActionsStyle}>
          {!isAdmin ? (
            <label css={secretToggleStyle}>
              <input
                checked={isSecret}
                onChange={event => setIsSecret(event.target.checked)}
                type="checkbox"
              />
              <span>{secretLabel}</span>
            </label>
          ) : null}
          <button disabled={isSubmitting} css={submitButtonStyle} type="submit">
            {submitLabel}
          </button>
        </div>
      </div>

      <div css={textareaWrapStyle}>
        <label css={fieldWrapStyle} htmlFor={contentId}>
          <span css={srOnlyStyle}>{contentLabel}</span>
          <textarea
            aria-describedby={`${contentShortcutHintId} ${characterCountId}`}
            aria-label={contentLabel}
            id={contentId}
            maxLength={3000}
            onChange={event => setContent(event.target.value)}
            onKeyDown={handleTextareaKeyDown}
            placeholder={textPlaceholder}
            rows={5}
            css={textareaStyle}
            value={content}
          />
        </label>
        <div css={textareaMetaStyle}>
          <p id={contentShortcutHintId} css={helperTextStyle}>
            {contentShortcutHint}
          </p>
          <p aria-live="polite" id={characterCountId} role="status" css={countStyle}>
            {characterCountLabel}: {charCountText}
          </p>
        </div>
      </div>
    </form>
  );
};

const formStyle = css`
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 20;
  border-top: 1px solid rgb(var(--color-border) / 0.24);
  background: linear-gradient(
    180deg,
    rgb(var(--color-surface) / 0.94),
    rgb(var(--color-surface) / 0.98)
  );
  backdrop-filter: blur(10px);
  padding: var(--space-3) var(--space-4) calc(var(--space-4) + env(safe-area-inset-bottom));
  display: grid;
  gap: var(--space-3);
`;

const topRowStyle = css`
  display: flex;
  gap: var(--space-3);
  align-items: center;
`;

const leftFieldsStyle = css`
  display: flex;
  gap: var(--space-2);
  flex-wrap: wrap;
  flex: 1;
`;

const replyPreviewStyle = css`
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: var(--space-2);
  min-height: 2.7rem;
  padding: var(--space-2) var(--space-3);
`;

const replyPreviewIconStyle = css`
  color: rgb(var(--color-muted));
  font-size: var(--font-size-16);
`;

const replyPreviewTextStyle = css`
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: rgb(var(--color-muted));
`;

const replyPreviewCloseStyle = css`
  border: none;
  background: transparent;
  color: rgb(var(--color-text));
  text-decoration: underline;
  padding: var(--space-0);
`;

const inputStyle = css`
  width: 100%;
  min-height: 2.5rem;
  border-radius: var(--radius-2xs);
  border: 1px solid rgb(var(--color-border) / 0.34);
  background-color: rgb(var(--color-surface));
  color: rgb(var(--color-text));
  padding: var(--space-0) var(--space-3);
`;

const fieldWrapStyle = css`
  display: flex;
  flex: 0 1 9rem;
`;

const rightActionsStyle = css`
  margin-left: auto;
  display: inline-flex;
  align-items: center;
  gap: var(--space-3);
  flex: 0 0 auto;
  justify-content: flex-end;
  align-self: flex-end;
`;

const secretToggleStyle = css`
  flex: 0 0 auto;
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  color: rgb(var(--color-text));
  white-space: nowrap;
`;

const submitButtonStyle = css`
  flex: 0 0 auto;
  min-height: 2.5rem;
  border-radius: var(--radius-s);
  border: 1px solid rgb(var(--color-border) / 0.35);
  background-color: rgb(var(--color-text) / 0.85);
  color: rgb(var(--color-surface));
  min-width: 5rem;
  font-weight: var(--font-weight-bold);
`;

const textareaWrapStyle = css`
  display: grid;
  gap: var(--space-2);
`;

const textareaMetaStyle = css`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--space-3);
  flex-wrap: wrap;
`;

const textareaStyle = css`
  width: 100%;
  min-height: 8.5rem;
  border-radius: var(--radius-s);
  border: 1px solid rgb(var(--color-border) / 0.34);
  background-color: rgb(var(--color-surface));
  color: rgb(var(--color-text));
  padding: var(--space-3);
  resize: vertical;
`;

const countStyle = css`
  justify-self: end;
  color: rgb(var(--color-muted));
  font-size: var(--font-size-14);
`;

const helperTextStyle = css`
  color: rgb(var(--color-muted));
  font-size: var(--font-size-14);
`;

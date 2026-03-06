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
import { Button } from '@/shared/ui/button/button';
import {
  ArrowCurveLeftRightIcon,
  LockIcon,
  LockOpenIcon,
  SendIcon,
} from '@/shared/ui/icons/app-icons';
import { Input } from '@/shared/ui/input/input';
import { srOnlyStyle } from '@/shared/ui/styles/sr-only-style';
import { Textarea } from '@/shared/ui/textarea/textarea';

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
              <Input
                id={authorNameId}
                aria-label={authorNameLabel}
                minLength={1}
                onChange={event => setAuthorName(event.target.value)}
                placeholder={authorNamePlaceholder}
                required
                value={authorName}
              />
            </label>
            <label css={fieldWrapStyle} htmlFor={passwordId}>
              <span css={srOnlyStyle}>{passwordLabel}</span>
              <Input
                id={passwordId}
                aria-label={passwordLabel}
                minLength={4}
                onChange={event => {
                  const value = normalizeComposePassword(event.target.value);
                  setPassword(value);
                }}
                placeholder={passwordPlaceholder}
                required
                type="password"
                value={password}
              />
            </label>
            <label css={fieldWrapStyle} htmlFor={authorBlogUrlId}>
              <span css={srOnlyStyle}>{authorBlogUrlLabel}</span>
              <Input
                id={authorBlogUrlId}
                aria-label={authorBlogUrlLabel}
                onChange={event => setAuthorBlogUrl(event.target.value)}
                placeholder={authorBlogUrlPlaceholder}
                value={authorBlogUrl}
              />
            </label>
          </div>
        ) : null}
        {isReplyMode ? (
          <aside aria-label={replyPreviewLabel} css={replyPreviewStyle}>
            <ArrowCurveLeftRightIcon aria-hidden size="sm" />
            <p css={replyPreviewTextStyle}>{replyTargetContent}</p>
            <Button
              onClick={onReplyTargetReset}
              css={replyPreviewCloseStyle}
              tone="black"
              variant="underline"
            >
              {replyTargetResetLabel}
            </Button>
          </aside>
        ) : null}
        <div css={rightActionsStyle}>
          {!isAdmin ? (
            <div css={secretControlGroupStyle}>
              <input
                id={secretCheckboxId}
                aria-label={secretLabel}
                checked={isSecret}
                css={secretCheckboxStyle}
                onChange={event => setIsSecret(event.target.checked)}
                type="checkbox"
              />
              <label
                aria-label={secretLabel}
                css={secretToggleLabelStyle}
                data-checked={isSecret ? 'true' : 'false'}
                htmlFor={secretCheckboxId}
              >
                <span
                  aria-hidden
                  css={secretIconStackStyle}
                  data-checked={isSecret ? 'true' : 'false'}
                >
                  <LockOpenIcon css={secretIconOpenStyle} size="lg" />
                  <LockIcon css={secretIconClosedStyle} size="lg" />
                </span>
              </label>
            </div>
          ) : null}
          <Button
            disabled={isSubmitting}
            leadingVisual={<SendIcon aria-hidden size="md" />}
            tone="black"
            type="submit"
            css={submitButtonStyle}
          >
            {submitLabel}
          </Button>
        </div>
      </div>

      <div css={textareaWrapStyle}>
        <label css={fieldWrapStyle} htmlFor={contentId}>
          <span css={srOnlyStyle}>{contentLabel}</span>
          <Textarea
            aria-describedby={`${contentShortcutHintId} ${characterCountId}`}
            aria-label={contentLabel}
            id={contentId}
            maxLength={3000}
            onChange={event => setContent(event.target.value)}
            onKeyDown={handleTextareaKeyDown}
            placeholder={textPlaceholder}
            required
            rows={1}
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
  border-top: 1px solid rgb(var(--color-border) / 0.18);
  box-shadow: 0 -4px 16px rgb(var(--color-black) / 0.14);
  background-color: rgb(var(--color-surface) / 0.82);
  backdrop-filter: blur(18px) saturate(140%);
  -webkit-backdrop-filter: blur(18px) saturate(140%);
  padding: var(--space-3) var(--space-4) calc(var(--space-4) + env(safe-area-inset-bottom));
  display: grid;
  gap: var(--space-3);
`;

const topRowStyle = css`
  display: flex;
  gap: var(--space-3);
  align-items: center;
  justify-content: space-between;
`;

const leftFieldsStyle = css`
  display: grid;
  grid-template-columns: minmax(9rem, 0.85fr) minmax(9rem, 0.85fr) minmax(12rem, 1.3fr);
  gap: var(--space-2);
  flex: 0 1 44rem;
  justify-content: start;

  @media (max-width: 920px) {
    grid-template-columns: repeat(2, minmax(9rem, 1fr));
  }

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
`;

const replyPreviewStyle = css`
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: var(--space-2);
  min-height: 2.7rem;
  padding: var(--space-2) var(--space-3);
`;

const replyPreviewTextStyle = css`
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: rgb(var(--color-muted));
`;

const replyPreviewCloseStyle = css`
  justify-self: end;
`;

const fieldWrapStyle = css`
  display: flex;
  min-width: 0;
`;

const secretControlGroupStyle = css`
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
`;

const rightActionsStyle = css`
  display: inline-flex;
  gap: var(--space-2);
  flex: 0 0 auto;
  margin-left: var(--space-4);
  align-self: flex-end;
`;

const secretToggleLabelStyle = css`
  padding: var(--space-0);
  width: 2.25rem;
  height: 2.25rem;
  border-radius: var(--radius-pill);
  background: transparent;
  color: rgb(var(--color-muted));
  border: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  line-height: 0;
  cursor: pointer;
  transition: color 180ms ease;

  &:hover {
    background: transparent;
    color: rgb(var(--color-text));
  }
`;

const secretIconStackStyle = css`
  position: relative;
  width: 1.125rem;
  height: 1.125rem;
  display: inline-block;
  transform: translateY(-1px);
`;

const secretIconOpenStyle = css`
  position: absolute;
  inset: 0;
  opacity: 0.8;
  transition: opacity 180ms ease;

  [data-checked='true'] & {
    opacity: 0;
  }

  label:hover & {
    opacity: 0;
  }
`;

const secretIconClosedStyle = css`
  position: absolute;
  inset: 0;
  opacity: 0;
  transition: opacity 180ms ease;

  [data-checked='true'] & {
    opacity: 0.8;
  }

  label:hover & {
    opacity: 0.8;
  }
`;

const secretCheckboxStyle = css`
  width: 1rem;
  height: 1rem;
  margin: 0;
  display: block;
  accent-color: rgb(var(--color-primary));
`;

const submitButtonStyle = css`
  font-size: var(--font-size-16);
  font-weight: var(--font-weight-semibold);
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

const countStyle = css`
  justify-self: end;
  color: rgb(var(--color-muted) / 0.82);
  font-size: var(--font-size-14);
`;

const helperTextStyle = css`
  color: rgb(var(--color-muted) / 0.76);
  font-size: var(--font-size-14);
`;

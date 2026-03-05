'use client';

import { css } from '@emotion/react';
import styled from '@emotion/styled';
import { type KeyboardEvent, type SyntheticEvent, useEffect, useMemo, useState } from 'react';

import type { GuestbookComposeValues } from '@/features/guestbook-compose/model/types';

type GuestbookComposeFormProps = {
  isAdmin: boolean;
  isReplyMode: boolean;
  onSubmit: (values: GuestbookComposeValues) => Promise<void> | void;
  onReplyTargetReset: () => void;
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
  isAdmin,
  isReplyMode,
  onSubmit,
  onReplyTargetReset,
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
    if (!isAdmin && !authorName.trim()) return;

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
    if (event.key !== 'Enter' || event.shiftKey) return;
    event.preventDefault();
    void submit();
  };

  return (
    <form onSubmit={handleSubmit} css={formStyle}>
      {isReplyMode ? (
        <aside css={replyPreviewStyle}>
          <span aria-hidden css={replyPreviewIconStyle}>
            ↪
          </span>
          <p css={replyPreviewTextStyle}>{replyTargetContent}</p>
          <button onClick={onReplyTargetReset} css={replyPreviewCloseStyle} type="button">
            {replyTargetResetLabel}
          </button>
        </aside>
      ) : null}
      <TopRow>
        {!isAdmin ? (
          <LeftFields>
            <input
              onChange={event => setAuthorName(event.target.value)}
              placeholder="이름"
              required
              css={inputStyle}
              value={authorName}
            />
            <input
              onChange={event => setPassword(event.target.value)}
              placeholder="비밀번호"
              required
              css={inputStyle}
              type="password"
              value={password}
            />
            <input
              onChange={event => setAuthorBlogUrl(event.target.value)}
              placeholder="블로그 홈페이지(선택)"
              css={inputStyle}
              value={authorBlogUrl}
            />
          </LeftFields>
        ) : null}
        <RightActions>
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
        </RightActions>
      </TopRow>

      <div css={textareaWrapStyle}>
        <textarea
          maxLength={3000}
          onChange={event => setContent(event.target.value)}
          onKeyDown={handleTextareaKeyDown}
          placeholder={textPlaceholder}
          rows={5}
          css={textareaStyle}
          value={content}
        />
        <p css={countStyle}>{charCountText}</p>
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

const TopRow = styled.div`
  display: flex;
  gap: var(--space-3);
  align-items: center;
`;

const LeftFields = styled.div`
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
  flex: 0 1 5rem;
  min-height: 2.5rem;
  border-radius: var(--radius-2xs);
  border: 1px solid rgb(var(--color-border) / 0.34);
  background-color: rgb(var(--color-surface));
  color: rgb(var(--color-text));
  padding: var(--space-0) var(--space-3);
`;

const RightActions = styled.div`
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

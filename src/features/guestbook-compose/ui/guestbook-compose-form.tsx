'use client';

import styled from '@emotion/styled';
import {
  type CSSProperties,
  type KeyboardEvent,
  type SyntheticEvent,
  useEffect,
  useMemo,
  useState,
} from 'react';

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

  const shouldHideIdentityFields = isAdmin && isReplyMode;

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
    if (!shouldHideIdentityFields && !authorName.trim()) return;

    setIsSubmitting(true);
    try {
      await onSubmit({
        authorName: shouldHideIdentityFields ? 'admin' : authorName.trim(),
        password: shouldHideIdentityFields ? '' : password.trim(),
        authorBlogUrl: shouldHideIdentityFields ? '' : authorBlogUrl.trim(),
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
    <form onSubmit={handleSubmit} style={formStyle}>
      {replyTargetContent ? (
        <aside style={replyPreviewStyle}>
          <span aria-hidden style={replyPreviewIconStyle}>
            ↪
          </span>
          <p style={replyPreviewTextStyle}>{replyTargetContent}</p>
          <button onClick={onReplyTargetReset} style={replyPreviewCloseStyle} type="button">
            {replyTargetResetLabel}
          </button>
        </aside>
      ) : null}
      <TopRow>
        {!shouldHideIdentityFields ? (
          <LeftFields>
            <input
              onChange={event => setAuthorName(event.target.value)}
              placeholder="이름"
              required
              style={inputStyle}
              value={authorName}
            />
            <input
              onChange={event => setPassword(event.target.value)}
              placeholder="비밀번호"
              style={inputStyle}
              type="password"
              value={password}
            />
            <input
              onChange={event => setAuthorBlogUrl(event.target.value)}
              placeholder="블로그 홈페이지(선택)"
              style={inputStyle}
              value={authorBlogUrl}
            />
          </LeftFields>
        ) : null}
        <RightActions>
          <label style={secretToggleStyle}>
            <input
              checked={isSecret}
              onChange={event => setIsSecret(event.target.checked)}
              type="checkbox"
            />
            <span>{secretLabel}</span>
          </label>
          <button disabled={isSubmitting} style={submitButtonStyle} type="submit">
            {submitLabel}
          </button>
        </RightActions>
      </TopRow>

      <div style={textareaWrapStyle}>
        <textarea
          maxLength={3000}
          onChange={event => setContent(event.target.value)}
          onKeyDown={handleTextareaKeyDown}
          placeholder={textPlaceholder}
          rows={5}
          style={textareaStyle}
          value={content}
        />
        <p style={countStyle}>{charCountText}</p>
      </div>
    </form>
  );
};

const formStyle: CSSProperties = {
  position: 'fixed',
  left: 0,
  right: 0,
  bottom: 0,
  zIndex: 20,
  borderTop: '1px solid rgb(var(--color-border) / 0.24)',
  background:
    'linear-gradient(180deg, rgb(var(--color-surface) / 0.94), rgb(var(--color-surface) / 0.98))',
  backdropFilter: 'blur(10px)',
  padding: '0.85rem 1rem calc(0.9rem + env(safe-area-inset-bottom))',
  display: 'grid',
  gap: '0.7rem',
};

const TopRow = styled.div`
  display: flex;
  gap: 0.65rem;
  align-items: center;
`;

const LeftFields = styled.div`
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  flex: 1;
`;

const replyPreviewStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'auto 1fr auto',
  alignItems: 'center',
  gap: '0.6rem',
  minHeight: '2.7rem',
  padding: '0.55rem 0.8rem',
};

const replyPreviewIconStyle: CSSProperties = {
  color: 'rgb(var(--color-muted))',
  fontSize: '1rem',
};

const replyPreviewTextStyle: CSSProperties = {
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  color: 'rgb(var(--color-muted))',
};

const replyPreviewCloseStyle: CSSProperties = {
  border: 'none',
  background: 'transparent',
  color: 'rgb(var(--color-text))',
  textDecoration: 'underline',
  padding: 0,
};

const inputStyle: CSSProperties = {
  flex: '0 1 5rem',
  minHeight: '2.5rem',
  borderRadius: '0.6rem',
  border: '1px solid rgb(var(--color-border) / 0.34)',
  backgroundColor: 'rgb(var(--color-surface))',
  color: 'rgb(var(--color-text))',
  padding: '0 0.75rem',
};

const RightActions = styled.div`
  margin-left: auto;
  display: inline-flex;
  align-items: center;
  gap: 0.65rem;
  flex: 0 0 auto;
  justify-content: flex-end;
  align-self: flex-end;
`;

const secretToggleStyle: CSSProperties = {
  flex: '0 0 auto',
  display: 'inline-flex',
  alignItems: 'center',
  gap: '0.45rem',
  color: 'rgb(var(--color-text))',
  whiteSpace: 'nowrap',
};

const submitButtonStyle: CSSProperties = {
  flex: '0 0 auto',
  minHeight: '2.5rem',
  borderRadius: '0.7rem',
  border: '1px solid rgb(var(--color-border) / 0.35)',
  backgroundColor: 'rgb(var(--color-text) / 0.85)',
  color: 'rgb(var(--color-surface))',
  minWidth: '5rem',
  fontWeight: 700,
};

const textareaWrapStyle: CSSProperties = {
  display: 'grid',
  gap: '0.45rem',
};

const textareaStyle: CSSProperties = {
  width: '100%',
  minHeight: '8.5rem',
  borderRadius: '0.75rem',
  border: '1px solid rgb(var(--color-border) / 0.34)',
  backgroundColor: 'rgb(var(--color-surface))',
  color: 'rgb(var(--color-text))',
  padding: '0.85rem',
  resize: 'vertical',
};

const countStyle: CSSProperties = {
  justifySelf: 'end',
  color: 'rgb(var(--color-muted))',
  fontSize: '0.86rem',
};

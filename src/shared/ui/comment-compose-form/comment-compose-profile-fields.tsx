'use client';

import { css } from '@emotion/react';
import React from 'react';

import { Input } from '@/shared/ui/input/input';
import { srOnlyStyle } from '@/shared/ui/styles/sr-only-style';

type CommentComposeProfileFieldsProps = {
  authorBlogUrlDescribedBy?: string;
  authorBlogUrlErrorMessage?: string | null;
  authorBlogUrlId: string;
  authorBlogUrlLabel: string;
  authorBlogUrlPlaceholder: string;
  authorBlogUrlValue: string;
  authorNameId: string;
  authorNameLabel: string;
  authorNamePlaceholder: string;
  authorNameValue: string;
  onAuthorBlogUrlChange: (value: string) => void;
  onAuthorNameChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  passwordId: string;
  passwordLabel: string;
  passwordPlaceholder: string;
  passwordValue: string;
};

/** 작성자 프로필(닉네임/비밀번호/홈페이지) 입력 필드를 렌더링합니다. */
export const CommentComposeProfileFields = ({
  authorBlogUrlDescribedBy,
  authorBlogUrlErrorMessage,
  authorBlogUrlId,
  authorBlogUrlLabel,
  authorBlogUrlPlaceholder,
  authorBlogUrlValue,
  authorNameId,
  authorNameLabel,
  authorNamePlaceholder,
  authorNameValue,
  onAuthorBlogUrlChange,
  onAuthorNameChange,
  onPasswordChange,
  passwordId,
  passwordLabel,
  passwordPlaceholder,
  passwordValue,
}: CommentComposeProfileFieldsProps) => (
  <div css={leftFieldsStyle}>
    <label css={fieldWrapStyle} htmlFor={authorNameId}>
      <span css={srOnlyStyle}>{authorNameLabel}</span>
      <Input
        id={authorNameId}
        aria-label={authorNameLabel}
        minLength={1}
        onChange={event => onAuthorNameChange(event.target.value)}
        placeholder={authorNamePlaceholder}
        required
        value={authorNameValue}
      />
    </label>
    <label css={fieldWrapStyle} htmlFor={passwordId}>
      <span css={srOnlyStyle}>{passwordLabel}</span>
      <Input
        id={passwordId}
        aria-label={passwordLabel}
        minLength={4}
        onChange={event => onPasswordChange(event.target.value)}
        placeholder={passwordPlaceholder}
        required
        type="password"
        value={passwordValue}
      />
    </label>
    <label css={fieldWrapStyle} htmlFor={authorBlogUrlId}>
      <span css={srOnlyStyle}>{authorBlogUrlLabel}</span>
      <Input
        aria-describedby={authorBlogUrlDescribedBy}
        aria-invalid={authorBlogUrlErrorMessage ? 'true' : 'false'}
        id={authorBlogUrlId}
        aria-label={authorBlogUrlLabel}
        onChange={event => onAuthorBlogUrlChange(event.target.value)}
        placeholder={authorBlogUrlPlaceholder}
        value={authorBlogUrlValue}
      />
      {authorBlogUrlErrorMessage ? (
        <p css={fieldErrorTextStyle} id={authorBlogUrlDescribedBy} role="alert">
          {authorBlogUrlErrorMessage}
        </p>
      ) : null}
    </label>
  </div>
);

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

const fieldWrapStyle = css`
  display: grid;
  gap: var(--space-1);
  min-width: 0;
`;

const fieldErrorTextStyle = css`
  margin: 0;
  color: rgb(var(--color-danger, 208 61 61));
  font-size: 0.8125rem;
  line-height: 1.4;
`;

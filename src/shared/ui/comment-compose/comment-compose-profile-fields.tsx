import React from 'react';
import { css } from 'styled-system/css';

import { Input } from '@/shared/ui/input/input';
import { srOnlyClass } from '@/shared/ui/styles/sr-only-style';

type CommentComposeProfileFieldsProps = {
  authorBlogUrlDescribedBy?: string;
  authorBlogUrlErrorMessage?: string | null;
  authorBlogUrlId: string;
  authorBlogUrlLabel: string;
  authorBlogUrlPlaceholder: string;
  authorBlogUrlValue: string;
  authorNameId: string;
  authorNameLabel: string;
  authorNameName?: string;
  authorNamePlaceholder: string;
  authorNameValue: string;
  onAuthorBlogUrlChange: (value: string) => void;
  onAuthorNameChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  passwordId: string;
  passwordLabel: string;
  passwordName?: string;
  passwordPlaceholder: string;
  passwordValue: string;
  authorBlogUrlName?: string;
};

/** 작성자 프로필(닉네임/비밀번호/홈페이지) 입력 필드를 렌더링합니다. */
const CommentComposeProfileFieldsBase = ({
  authorBlogUrlDescribedBy,
  authorBlogUrlErrorMessage,
  authorBlogUrlId,
  authorBlogUrlLabel,
  authorBlogUrlPlaceholder,
  authorBlogUrlValue,
  authorNameId,
  authorNameLabel,
  authorNameName = 'authorName',
  authorNamePlaceholder,
  authorNameValue,
  onAuthorBlogUrlChange,
  onAuthorNameChange,
  onPasswordChange,
  passwordId,
  passwordLabel,
  passwordName = 'password',
  passwordPlaceholder,
  passwordValue,
  authorBlogUrlName = 'authorBlogUrl',
}: CommentComposeProfileFieldsProps) => (
  <div className={leftFieldsClass}>
    <label className={fieldWrapClass} htmlFor={authorNameId}>
      <span className={srOnlyClass}>{authorNameLabel}</span>
      <Input
        id={authorNameId}
        aria-label={authorNameLabel}
        minLength={1}
        name={authorNameName}
        onChange={event => onAuthorNameChange(event.target.value)}
        placeholder={authorNamePlaceholder}
        required
        value={authorNameValue}
      />
    </label>
    <label className={fieldWrapClass} htmlFor={passwordId}>
      <span className={srOnlyClass}>{passwordLabel}</span>
      <Input
        id={passwordId}
        aria-label={passwordLabel}
        minLength={4}
        name={passwordName}
        onChange={event => onPasswordChange(event.target.value)}
        placeholder={passwordPlaceholder}
        required
        type="password"
        value={passwordValue}
      />
    </label>
    <label className={fieldWrapClass} htmlFor={authorBlogUrlId}>
      <span className={srOnlyClass}>{authorBlogUrlLabel}</span>
      <Input
        aria-describedby={authorBlogUrlDescribedBy}
        aria-invalid={authorBlogUrlErrorMessage ? 'true' : 'false'}
        id={authorBlogUrlId}
        aria-label={authorBlogUrlLabel}
        name={authorBlogUrlName}
        onChange={event => onAuthorBlogUrlChange(event.target.value)}
        placeholder={authorBlogUrlPlaceholder}
        value={authorBlogUrlValue}
      />
      {authorBlogUrlErrorMessage ? (
        <p className={fieldErrorTextClass} id={authorBlogUrlDescribedBy} role="alert">
          {authorBlogUrlErrorMessage}
        </p>
      ) : null}
    </label>
  </div>
);

CommentComposeProfileFieldsBase.displayName = 'CommentComposeProfileFields';

export const CommentComposeProfileFields = React.memo(CommentComposeProfileFieldsBase);

const leftFieldsClass = css({
  display: 'grid',
  gridTemplateColumns: '[minmax(9rem, 0.85fr) minmax(9rem, 0.85fr) minmax(12rem, 1.3fr)]',
  gap: '2',
  flex: '[0 1 44rem]',
  justifyContent: 'start',
  _tabletDown: {
    gridTemplateColumns: '[repeat(2, minmax(9rem, 1fr))]',
  },
  _mobileLargeDown: {
    gridTemplateColumns: '1fr',
  },
});

const fieldWrapClass = css({
  display: 'grid',
  gap: '1',
  minWidth: '0',
});

const fieldErrorTextClass = css({
  m: '0',
  color: '[var(--colors-error)]',
  fontSize: '[0.8125rem]',
  lineHeight: 'snug',
});

'use client';

import { css } from '@emotion/react';
import type { KeyboardEvent } from 'react';
import React from 'react';

import { srOnlyStyle } from '@/shared/ui/styles/sr-only-style';
import { Textarea } from '@/shared/ui/textarea/textarea';

type CommentComposeContentFieldProps = {
  characterCountId: string;
  characterCountLabel: string;
  charCountText: string;
  contentId: string;
  contentLabel: string;
  contentShortcutHint: string;
  contentShortcutHintId: string;
  onChange: (value: string) => void;
  onKeyDown: (event: KeyboardEvent<HTMLTextAreaElement>) => void;
  textareaAutoResize?: boolean;
  textareaRows?: number;
  textPlaceholder: string;
  value: string;
};

/** 본문 입력과 보조 메타(단축키/글자 수)를 렌더링합니다. */
export const CommentComposeContentField = ({
  characterCountId,
  characterCountLabel,
  charCountText,
  contentId,
  contentLabel,
  contentShortcutHint,
  contentShortcutHintId,
  onChange,
  onKeyDown,
  textareaAutoResize = true,
  textareaRows = 1,
  textPlaceholder,
  value,
}: CommentComposeContentFieldProps) => (
  <div css={textareaWrapStyle}>
    <label css={fieldWrapStyle} htmlFor={contentId}>
      <span css={srOnlyStyle}>{contentLabel}</span>
      <Textarea
        aria-describedby={`${contentShortcutHintId} ${characterCountId}`}
        aria-label={contentLabel}
        autoResize={textareaAutoResize}
        id={contentId}
        maxLength={3000}
        onChange={event => onChange(event.target.value)}
        onKeyDown={onKeyDown}
        placeholder={textPlaceholder}
        required
        rows={textareaRows}
        value={value}
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
);

const textareaWrapStyle = css`
  display: grid;
  gap: var(--space-2);
`;

const fieldWrapStyle = css`
  display: flex;
  min-width: 0;
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

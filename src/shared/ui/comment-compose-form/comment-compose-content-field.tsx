import type { KeyboardEvent } from 'react';
import React from 'react';
import { css } from 'styled-system/css';

import { srOnlyClass } from '@/shared/ui/styles/sr-only-style';
import { Textarea } from '@/shared/ui/textarea/textarea';

type CommentComposeContentFieldProps = {
  characterCountId: string;
  characterCountLabel: string;
  charCountText: string;
  contentId: string;
  contentLabel: string;
  contentName?: string;
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
  contentName = 'content',
  contentShortcutHint,
  contentShortcutHintId,
  onChange,
  onKeyDown,
  textareaAutoResize = true,
  textareaRows = 1,
  textPlaceholder,
  value,
}: CommentComposeContentFieldProps) => (
  <div className={textareaWrapClass}>
    <label className={fieldWrapClass} htmlFor={contentId}>
      <span className={srOnlyClass}>{contentLabel}</span>
      <Textarea
        aria-describedby={`${contentShortcutHintId} ${characterCountId}`}
        aria-label={contentLabel}
        autoResize={textareaAutoResize}
        id={contentId}
        maxLength={3000}
        name={contentName}
        onChange={event => onChange(event.target.value)}
        onKeyDown={onKeyDown}
        placeholder={textPlaceholder}
        required
        rows={textareaRows}
        value={value}
      />
    </label>
    <div className={textareaMetaClass}>
      <p className={helperTextClass} id={contentShortcutHintId}>
        {contentShortcutHint}
      </p>
      <p aria-live="polite" className={countClass} id={characterCountId} role="status">
        {characterCountLabel}: {charCountText}
      </p>
    </div>
  </div>
);

const textareaWrapClass = css({
  display: 'grid',
  gap: '2',
});

const fieldWrapClass = css({
  display: 'flex',
  minWidth: '0',
});

const textareaMetaClass = css({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: '3',
  flexWrap: 'wrap',
});

const countClass = css({
  justifySelf: 'end',
  color: 'muted',
  fontSize: 'sm',
});

const helperTextClass = css({
  color: 'muted',
  fontSize: 'sm',
});

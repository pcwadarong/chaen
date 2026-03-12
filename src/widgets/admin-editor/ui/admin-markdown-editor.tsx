'use client';

import React, { useRef } from 'react';
import { css } from 'styled-system/css';

import { MarkdownToolbar } from '@/features/markdown-toolbar/ui/markdown-toolbar';
import { buildEditorLinkInsertion } from '@/shared/lib/editor/markdown-link';
import { applyTextareaTransform, insertTemplate } from '@/shared/lib/editor/selection-utils';
import { Textarea } from '@/shared/ui/textarea/textarea';

type AdminMarkdownEditorProps = {
  onChange: (value: string) => void;
  value: string;
};

/**
 * 관리자 에디터의 markdown 입력 위젯입니다.
 * toolbar, textarea, paste 자동 링크 변환을 한 블록으로 묶어 view/shell에서 분리합니다.
 */
export const AdminMarkdownEditor = ({ onChange, value }: AdminMarkdownEditorProps) => {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  /**
   * URL 붙여넣기와 "텍스트 + URL" 붙여넣기를 markdown 링크/임베드 문법으로 자동 변환합니다.
   */
  const handleTextareaPaste: React.ClipboardEventHandler<HTMLTextAreaElement> = event => {
    const selectedText = value.slice(
      event.currentTarget.selectionStart,
      event.currentTarget.selectionEnd,
    );
    const insertion = buildEditorLinkInsertion({
      clipboardText: event.clipboardData.getData('text'),
      selectedText,
    });

    if (!insertion) return;

    event.preventDefault();
    applyTextareaTransform(event.currentTarget, onChange, textarea =>
      insertTemplate(textarea, insertion.text, insertion.text.length),
    );
  };

  return (
    <>
      <MarkdownToolbar onChange={onChange} textareaRef={textareaRef} value={value} />
      <Textarea
        aria-label="본문 입력"
        autoResize={false}
        className={editorTextareaClass}
        onChange={event => onChange(event.target.value)}
        onPaste={handleTextareaPaste}
        placeholder="마크다운 본문을 입력하세요"
        ref={textareaRef}
        rows={18}
        value={value}
      />
    </>
  );
};

const editorTextareaClass = css({
  minHeight: '[28rem]',
  height: 'full',
  resize: 'none',
  fontFamily: 'mono',
});

'use client';

import React, { useRef, useState } from 'react';
import { MarkdownHooks } from 'react-markdown';
import { css } from 'styled-system/css';

import {
  buildEditorLinkInsertion,
  createMarkdownLinkByMode,
} from '@/shared/lib/editor/markdown-link';
import { getMarkdownOptions, markdownBodyClass } from '@/shared/lib/markdown/markdown-config';
import { Button } from '@/shared/ui/button/button';
import { SlugInput } from '@/shared/ui/editor/slug-input';
import { TagSelector } from '@/shared/ui/editor/tag-selector';
import { LinkIcon } from '@/shared/ui/icons/app-icons';
import { Input } from '@/shared/ui/input/input';
import { Popover } from '@/shared/ui/popover/popover';
import { Textarea } from '@/shared/ui/textarea/textarea';

type AdminEditorShellProps = {
  availableTags: {
    id: string;
    label: string;
    slug: string;
  }[];
};

/**
 * 관리자 에디터의 좌우 1:1 입력/미리보기 셸입니다.
 * 아직 저장 연동은 하지 않고, slug/tag/본문 preview 흐름만 검증합니다.
 */
export const AdminEditorShell = ({ availableTags }: AdminEditorShellProps) => {
  const [slug, setSlug] = useState('');
  const [selectedTagSlugs, setSelectedTagSlugs] = useState<string[]>([]);
  const [markdown, setMarkdown] = useState('');
  const [linkInput, setLinkInput] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const markdownOptions = getMarkdownOptions();

  /**
   * 관리자 전용 slug 중복 확인 API를 호출합니다.
   */
  const handleSlugDuplicateCheck = async (nextSlug: string) => {
    const response = await fetch(`/api/admin/slug-check?slug=${encodeURIComponent(nextSlug)}`);

    if (!response.ok) {
      throw new Error(`Slug check failed: ${response.status}`);
    }

    const body = (await response.json()) as { duplicate: boolean };

    return body.duplicate;
  };

  /**
   * 현재 선택 영역 또는 커서 위치에 markdown 문자열을 삽입합니다.
   */
  const applyInsertion = (text: string) => {
    const textarea = textareaRef.current;
    const selectionStart = textarea?.selectionStart ?? markdown.length;
    const selectionEnd = textarea?.selectionEnd ?? markdown.length;
    const nextValue = `${markdown.slice(0, selectionStart)}${text}${markdown.slice(selectionEnd)}`;
    const nextCaret = selectionStart + text.length;

    setMarkdown(nextValue);

    queueMicrotask(() => {
      textareaRef.current?.focus();
      textareaRef.current?.setSelectionRange(nextCaret, nextCaret);
    });
  };

  /**
   * 링크 팝오버 입력값을 선택한 렌더링 방식에 맞는 markdown 문법으로 삽입합니다.
   */
  const handleLinkApply = (mode: 'card' | 'link' | 'preview', closePopover?: () => void) => {
    const textarea = textareaRef.current;
    const normalizedInput = linkInput.trim();
    const selectedText = textarea
      ? markdown.slice(textarea.selectionStart, textarea.selectionEnd)
      : '';
    const normalizedSelectedText = selectedText.trim();

    if (!normalizedInput) return;

    const insertion = createMarkdownLinkByMode({
      label: normalizedSelectedText || normalizedInput,
      mode,
      url: normalizedInput,
    });

    applyInsertion(insertion);
    setLinkInput('');
    closePopover?.();
  };

  /**
   * URL 붙여넣기와 "텍스트 + URL" 붙여넣기를 markdown 링크/임베드 문법으로 자동 변환합니다.
   */
  const handleTextareaPaste: React.ClipboardEventHandler<HTMLTextAreaElement> = event => {
    const selectedText = markdown.slice(
      event.currentTarget.selectionStart,
      event.currentTarget.selectionEnd,
    );
    const insertion = buildEditorLinkInsertion({
      clipboardText: event.clipboardData.getData('text'),
      selectedText,
    });

    if (!insertion) return;

    event.preventDefault();
    applyInsertion(insertion.text);
  };

  return (
    <main className={pageClass}>
      <section aria-labelledby="admin-editor-title" className={panelClass}>
        <div className={headerClass}>
          <p className={eyebrowClass}>ADMIN EDITOR</p>
          <h1 className={titleClass} id="admin-editor-title">
            공용 에디터 초안
          </h1>
        </div>

        <div className={metaGridClass}>
          <SlugInput onChange={setSlug} onCheckDuplicate={handleSlugDuplicateCheck} value={slug} />
        </div>

        <TagSelector
          availableTags={availableTags}
          onChange={setSelectedTagSlugs}
          selectedTagSlugs={selectedTagSlugs}
        />

        <div className={editorGridClass}>
          <section aria-labelledby="admin-editor-write-title" className={editorPaneClass}>
            <div className={paneHeaderClass}>
              <h2 className={paneTitleClass} id="admin-editor-write-title">
                입력
              </h2>
              <div className={paneHeaderActionsClass}>
                <Popover
                  label="링크"
                  panelLabel="링크 삽입"
                  triggerContent={<LinkIcon aria-hidden color="text" size="md" />}
                >
                  {({ closePopover }) => (
                    <div className={linkPopoverContentClass}>
                      <Input
                        aria-label="링크 URL"
                        onChange={event => setLinkInput(event.target.value)}
                        placeholder="https://example.com"
                        type="url"
                        value={linkInput}
                      />
                      <div className={linkModeGridClass}>
                        <Button onClick={() => handleLinkApply('preview', closePopover)}>
                          제목 링크
                        </Button>
                        <Button onClick={() => handleLinkApply('link', closePopover)}>
                          하이퍼링크
                        </Button>
                        <Button onClick={() => handleLinkApply('card', closePopover)}>
                          OG 카드
                        </Button>
                      </div>
                    </div>
                  )}
                </Popover>
              </div>
            </div>
            <Textarea
              aria-label="본문 입력"
              autoResize={false}
              className={editorTextareaClass}
              onChange={event => setMarkdown(event.target.value)}
              onPaste={handleTextareaPaste}
              placeholder="마크다운 본문을 입력하세요"
              ref={textareaRef}
              rows={18}
              value={markdown}
            />
          </section>

          <section aria-labelledby="admin-editor-preview-title" className={editorPaneClass}>
            <h2 className={paneTitleClass} id="admin-editor-preview-title">
              미리보기
            </h2>
            <div className={previewClass}>
              {markdown.trim().length > 0 ? (
                <div className={markdownBodyClass}>
                  <MarkdownHooks {...markdownOptions}>{markdown}</MarkdownHooks>
                </div>
              ) : (
                <p className={emptyPreviewClass}>
                  오른쪽 미리보기는 입력한 markdown을 바로 렌더링합니다.
                </p>
              )}
            </div>
          </section>
        </div>
      </section>
    </main>
  );
};

const pageClass = css({
  width: 'full',
  px: '4',
  py: '8',
});

const panelClass = css({
  width: 'full',
  maxWidth: '[72rem]',
  display: 'grid',
  gap: '6',
  mx: 'auto',
});

const headerClass = css({
  display: 'grid',
  gap: '1',
});

const eyebrowClass = css({
  fontSize: 'xs',
  fontWeight: 'bold',
  letterSpacing: '[0.22em]',
  color: 'primary',
});

const titleClass = css({
  fontSize: '[clamp(2rem,4vw,3rem)]',
  lineHeight: 'tight',
  letterSpacing: '[-0.04em]',
});

const metaGridClass = css({
  display: 'grid',
  gap: '4',
  gridTemplateColumns: 'minmax(0, 1fr)',
});

const linkModeGridClass = css({
  display: 'flex',
  gap: '2',
  textWrap: 'nowrap',
});

const editorGridClass = css({
  display: 'grid',
  gap: '4',
  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
  '@media (max-width: 960px)': {
    gridTemplateColumns: '1fr',
  },
});

const editorPaneClass = css({
  display: 'grid',
  gap: '3',
  minHeight: '[32rem]',
  p: '4',
  borderRadius: 'xl',
  borderWidth: '1px',
  borderStyle: 'solid',
  borderColor: 'border',
  background: 'surface',
});

const paneHeaderClass = css({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '3',
});

const paneHeaderActionsClass = css({
  display: 'inline-flex',
  alignItems: 'center',
  gap: '2',
});

const linkPopoverContentClass = css({
  display: 'grid',
  gap: '3',
});

const paneTitleClass = css({
  fontSize: 'lg',
  fontWeight: 'semibold',
});

const editorTextareaClass = css({
  minHeight: '[28rem]',
  height: 'full',
  resize: 'none',
  fontFamily: 'mono',
});

const previewClass = css({
  minHeight: '[28rem]',
  p: '4',
  borderRadius: 'lg',
  background: 'surfaceMuted',
  overflowY: 'auto',
});

const emptyPreviewClass = css({
  fontSize: 'sm',
  color: 'muted',
});

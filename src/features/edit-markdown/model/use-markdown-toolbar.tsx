'use client';

import React from 'react';

import type { EditorAttachment } from '@/entities/editor/model/editor-attachment';
import { createMarkdownLinkByMode } from '@/entities/editor/model/markdown-link';
import {
  applyTextareaTransform,
  insertTemplate,
  prefixLine,
  toggleHeadingLine,
  wrapSelection,
} from '@/entities/editor/model/selection-utils';
import type {
  LinkMode,
  MarkdownToolbarProps,
  ToolbarActionItem,
  ToolbarSection,
} from '@/features/edit-markdown/model/markdown-toolbar.types';
import {
  createAlignBlockMarkdown,
  createAttachmentEmbedMarkdown,
  createImageEmbedMarkdownGroup,
  createImageGalleryMarkdown,
  createMathEmbedMarkdown,
  createToggleBlockMarkdown,
  createUploadedVideoEmbedMarkdown,
  createYoutubeEmbedMarkdown,
} from '@/features/edit-markdown/model/markdown-toolbar-templates';
import { AlignPopover } from '@/features/edit-markdown/ui/align-popover';
import { FileEmbedPopover } from '@/features/edit-markdown/ui/file-embed-popover';
import { ImageEmbedPopover } from '@/features/edit-markdown/ui/image-embed-popover';
import { LinkEmbedPopover } from '@/features/edit-markdown/ui/link-embed-popover';
import { MathEmbedPopover } from '@/features/edit-markdown/ui/math-embed-popover';
import { TextBackgroundColorPopover } from '@/features/edit-markdown/ui/text-background-color-popover';
import { TextColorPopover } from '@/features/edit-markdown/ui/text-color-popover';
import { VideoEmbedModal } from '@/features/edit-markdown/ui/video-embed-modal';
import {
  CodeBlockIcon,
  DashIcon,
  MarkDownBoldIcon,
  MarkDownItalicIcon,
  MarkDownStrikeIcon,
  MarkDownUnderlineIcon,
  QuoteIcon,
  SpoilerIcon,
  SubtextIcon,
  TableIcon,
} from '@/shared/ui/icons/app-icons';
import type { ClosePopover } from '@/shared/ui/popover/popover';

const tableTemplate = [
  '| 제목1 | 제목2 | 제목3 |',
  '|-------|-------|-------|',
  '| 내용  | 내용  | 내용  |',
].join('\n');

/**
 * markdown toolbar의 textarea 조작과 액션/섹션 구성을 한 곳에 모읍니다.
 * UI 컴포넌트는 레이아웃과 렌더링만 담당하고, 실제 편집 규칙은 이 hook에서 관리합니다.
 */
export const useMarkdownToolbar = ({
  contentType,
  onChange,
  textareaRef,
  popoverTriggerClassName,
}: MarkdownToolbarProps & {
  popoverTriggerClassName: string;
}) => {
  /**
   * 현재 textarea selection 범위를 그대로 읽어 선택 문자열을 반환합니다.
   * 공백을 포함한 원본 부분 문자열을 유지해 링크/이미지 라벨 삽입 시 사용자가 선택한 텍스트가 변형되지 않게 합니다.
   */
  const getSelectedText = React.useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) return '';

    return textarea.value.slice(textarea.selectionStart, textarea.selectionEnd);
  }, [textareaRef]);

  const applyTextTransform = React.useCallback(
    (transform: (textarea: HTMLTextAreaElement) => string) => {
      const textarea = textareaRef.current;
      if (!textarea) return;

      applyTextareaTransform(textarea, onChange, transform);
    },
    [onChange, textareaRef],
  );

  const applyTemplate = React.useCallback(
    (template: string, cursorOffset?: number) => {
      applyTextTransform(textarea => insertTemplate(textarea, template, cursorOffset));
    },
    [applyTextTransform],
  );

  const applyWrap = React.useCallback(
    (before: string, after: string, placeholder?: string) => {
      applyTextTransform(textarea => wrapSelection(textarea, before, after, placeholder));
    },
    [applyTextTransform],
  );

  const applyPrefix = React.useCallback(
    (prefix: string) => {
      applyTextTransform(textarea => prefixLine(textarea, prefix));
    },
    [applyTextTransform],
  );

  const applyHeading = React.useCallback(
    (level: 1 | 2 | 3 | 4) => {
      applyTextTransform(textarea => toggleHeadingLine(textarea, level));
    },
    [applyTextTransform],
  );

  const applyAlign = React.useCallback(
    (align: 'center' | 'left' | 'right') => {
      const selectedText = getSelectedText();

      if (selectedText) {
        applyWrap(`:::align ${align}\n`, '\n:::', '텍스트');
        return;
      }

      const alignBlock = createAlignBlockMarkdown(align);

      applyTemplate(alignBlock.text, alignBlock.cursorOffset);
    },
    [applyTemplate, applyWrap, getSelectedText],
  );

  const handleAlignApply = React.useCallback(
    (align: 'center' | 'left' | 'right', closePopover?: ClosePopover) => {
      applyAlign(align);
      closePopover?.({ restoreFocus: false });
    },
    [applyAlign],
  );

  const handleLinkApply = React.useCallback(
    (url: string, mode: LinkMode, closePopover?: ClosePopover) => {
      const selectedText = getSelectedText();
      const nextValue = createMarkdownLinkByMode({
        label: selectedText || url,
        mode,
        url,
      });

      applyTextTransform(currentTextarea =>
        insertTemplate(currentTextarea, nextValue, nextValue.length),
      );
      closePopover?.({ restoreFocus: false });
    },
    [applyTextTransform, getSelectedText],
  );

  const handleImageApply = React.useCallback(
    (
      payload: {
        items: Array<{
          altText: string;
          url: string;
        }>;
        mode: 'gallery' | 'individual';
      },
      closePopover?: ClosePopover,
    ) => {
      const nextValue =
        payload.mode === 'gallery'
          ? createImageGalleryMarkdown(payload.items)
          : createImageEmbedMarkdownGroup(payload.items);

      applyTextTransform(currentTextarea =>
        insertTemplate(currentTextarea, nextValue, nextValue.length),
      );
      closePopover?.({ restoreFocus: false });
    },
    [applyTextTransform],
  );

  const handleAttachmentApply = React.useCallback(
    (attachment: EditorAttachment, closePopover?: ClosePopover) => {
      applyTemplate(createAttachmentEmbedMarkdown(attachment));
      closePopover?.({ restoreFocus: false });
    },
    [applyTemplate],
  );

  const handleMathApply = React.useCallback(
    (formula: string, isBlock: boolean, closePopover?: ClosePopover) => {
      applyTemplate(
        createMathEmbedMarkdown({
          formula,
          isBlock,
        }),
      );
      closePopover?.({ restoreFocus: false });
    },
    [applyTemplate],
  );

  const handleTextColorApply = React.useCallback(
    (colorHex: string, closePopover?: ClosePopover) => {
      applyWrap(`<span style="color:${colorHex}">`, '</span>', '텍스트');
      closePopover?.({ restoreFocus: false });
    },
    [applyWrap],
  );

  const handleBackgroundColorApply = React.useCallback(
    (colorHex: string, closePopover?: ClosePopover) => {
      applyWrap(`<span style="background-color:${colorHex}">`, '</span>', '강조');
      closePopover?.({ restoreFocus: false });
    },
    [applyWrap],
  );

  const handleVideoApply = React.useCallback(
    (
      payload: {
        provider: 'upload' | 'youtube';
        src?: string;
        videoId?: string;
      },
      closePopover?: ClosePopover,
    ) => {
      if (payload.provider === 'upload') {
        if (!payload.src) return;

        applyTemplate(createUploadedVideoEmbedMarkdown(payload.src));
        closePopover?.({ restoreFocus: false });
        return;
      }

      if (!payload.videoId) return;

      applyTemplate(createYoutubeEmbedMarkdown(payload.videoId));
      closePopover?.({ restoreFocus: false });
    },
    [applyTemplate],
  );

  const handleToggleApply = React.useCallback(
    (level: 1 | 2 | 3 | 4) => {
      if (!textareaRef.current) return;

      const selectedText = getSelectedText();
      const toggleBlock = createToggleBlockMarkdown(level, selectedText);

      applyTemplate(toggleBlock.text, toggleBlock.cursorOffset);
    },
    [applyTemplate, getSelectedText, textareaRef],
  );

  const headingActions = React.useMemo<ToolbarActionItem[]>(
    () => [
      { key: 'heading-1', label: '제목 1', onClick: () => applyHeading(1), token: 'H1' },
      { key: 'heading-2', label: '제목 2', onClick: () => applyHeading(2), token: 'H2' },
      { key: 'heading-3', label: '제목 3', onClick: () => applyHeading(3), token: 'H3' },
      { key: 'heading-4', label: '제목 4', onClick: () => applyHeading(4), token: 'H4' },
    ],
    [applyHeading],
  );

  const inlineFormatActions = React.useMemo<ToolbarActionItem[]>(
    () => [
      {
        icon: <MarkDownBoldIcon aria-hidden color="text" size="sm" />,
        key: 'bold',
        label: '굵게',
        onClick: () => applyWrap('**', '**', '굵게'),
      },
      {
        icon: <MarkDownItalicIcon aria-hidden color="text" size="sm" />,
        key: 'italic',
        label: '기울임',
        onClick: () => applyWrap('*', '*', '기울임'),
      },
      {
        icon: <MarkDownStrikeIcon aria-hidden color="text" size="sm" />,
        key: 'strike',
        label: '취소선',
        onClick: () => applyWrap('~~', '~~', '취소선'),
      },
      {
        icon: <MarkDownUnderlineIcon aria-hidden color="text" size="sm" />,
        key: 'underline',
        label: '밑줄',
        onClick: () => applyWrap('<u>', '</u>', '밑줄'),
      },
    ],
    [applyWrap],
  );

  const textStructureActions = React.useMemo<ToolbarActionItem[]>(
    () => [
      {
        icon: <SubtextIcon aria-hidden color="text" size="sm" />,
        key: 'subtext',
        label: '보조 문구',
        onClick: () => applyPrefix('-# '),
      },
    ],
    [applyPrefix],
  );

  const blockSyntaxActions = React.useMemo<ToolbarActionItem[]>(
    () => [
      {
        icon: <DashIcon aria-hidden color="text" size="sm" />,
        key: 'horizontal-rule',
        label: '구분선',
        onClick: () => applyTemplate('\n---\n'),
      },
      {
        icon: <QuoteIcon aria-hidden color="text" size="sm" />,
        key: 'quote',
        label: '인용문',
        onClick: () => applyPrefix('> '),
      },
      {
        icon: <CodeBlockIcon aria-hidden color="text" size="sm" />,
        key: 'code-block',
        label: '코드 블록',
        onClick: () => applyWrap('```ts\n', '\n```', '코드를 입력하세요'),
      },
      {
        icon: <TableIcon aria-hidden color="text" size="sm" />,
        key: 'table',
        label: '표',
        onClick: () => applyTemplate(tableTemplate, 2),
      },
      {
        icon: <SpoilerIcon aria-hidden color="text" size="sm" />,
        key: 'spoiler',
        label: '스포일러',
        onClick: () => applyWrap('||', '||', '스포일러'),
      },
    ],
    [applyPrefix, applyTemplate, applyWrap],
  );

  const toggleActions = React.useMemo<ToolbarActionItem[]>(
    () => [
      {
        key: 'toggle-1',
        label: '토글 제목 1',
        onClick: () => handleToggleApply(1),
        token: 'T1',
      },
      {
        key: 'toggle-2',
        label: '토글 2',
        onClick: () => handleToggleApply(2),
        token: 'T2',
      },
      {
        key: 'toggle-3',
        label: '토글 제목 3',
        onClick: () => handleToggleApply(3),
        token: 'T3',
      },
      {
        key: 'toggle-4',
        label: '토글 제목 4',
        onClick: () => handleToggleApply(4),
        token: 'T4',
      },
    ],
    [handleToggleApply],
  );

  const toolbarSections = React.useMemo<ToolbarSection[]>(
    () => [
      {
        items: [
          ...headingActions.map(action => ({ action, key: action.key, type: 'action' as const })),
          ...textStructureActions.map(action => ({
            action,
            key: action.key,
            type: 'action' as const,
          })),
        ],
        key: 'heading-and-subtext',
      },
      {
        items: inlineFormatActions.map(action => ({
          action,
          key: action.key,
          type: 'action' as const,
        })),
        key: 'text-emphasis',
      },
      {
        items: [
          {
            key: 'text-color',
            node: (
              <TextColorPopover
                onApply={handleTextColorApply}
                onTriggerMouseDown={event => event.preventDefault()}
                triggerClassName={popoverTriggerClassName}
              />
            ),
            type: 'custom',
          },
          {
            key: 'background-color',
            node: (
              <TextBackgroundColorPopover
                onApply={handleBackgroundColorApply}
                onTriggerMouseDown={event => event.preventDefault()}
                triggerClassName={popoverTriggerClassName}
              />
            ),
            type: 'custom',
          },
          {
            key: 'align',
            node: (
              <AlignPopover
                onApply={handleAlignApply}
                onTriggerMouseDown={event => event.preventDefault()}
                triggerClassName={popoverTriggerClassName}
              />
            ),
            type: 'custom',
          },
        ],
        key: 'highlight-and-alignment',
      },
      {
        items: [
          ...blockSyntaxActions.map(action => ({
            action,
            key: action.key,
            type: 'action' as const,
          })),
          ...toggleActions.map(action => ({
            action,
            key: action.key,
            type: 'action' as const,
          })),
        ],
        key: 'block-syntax',
      },
      {
        items: [
          {
            key: 'math-embed',
            node: (
              <MathEmbedPopover
                onApply={handleMathApply}
                onTriggerMouseDown={event => event.preventDefault()}
                triggerClassName={popoverTriggerClassName}
              />
            ),
            type: 'custom',
          },
          {
            key: 'file-embed',
            node: (
              <FileEmbedPopover
                contentType={contentType}
                onApply={handleAttachmentApply}
                onTriggerMouseDown={event => event.preventDefault()}
                triggerClassName={popoverTriggerClassName}
              />
            ),
            type: 'custom',
          },
          {
            key: 'image-embed',
            node: (
              <ImageEmbedPopover
                contentType={contentType}
                onApply={handleImageApply}
                onTriggerMouseDown={event => event.preventDefault()}
                triggerClassName={popoverTriggerClassName}
              />
            ),
            type: 'custom',
          },
          {
            key: 'link-embed',
            node: (
              <LinkEmbedPopover
                onApply={handleLinkApply}
                onTriggerMouseDown={event => event.preventDefault()}
                triggerClassName={popoverTriggerClassName}
              />
            ),
            type: 'custom',
          },
          {
            key: 'video-embed',
            node: (
              <VideoEmbedModal
                contentType={contentType}
                onApply={handleVideoApply}
                onTriggerMouseDown={event => event.preventDefault()}
                triggerClassName={popoverTriggerClassName}
              />
            ),
            type: 'custom',
          },
        ],
        key: 'embed-and-media',
      },
    ],
    [
      blockSyntaxActions,
      handleAlignApply,
      handleBackgroundColorApply,
      contentType,
      handleAttachmentApply,
      handleImageApply,
      handleLinkApply,
      handleMathApply,
      handleTextColorApply,
      handleVideoApply,
      headingActions,
      inlineFormatActions,
      popoverTriggerClassName,
      textStructureActions,
      toggleActions,
    ],
  );

  return {
    toolbarSections,
  };
};

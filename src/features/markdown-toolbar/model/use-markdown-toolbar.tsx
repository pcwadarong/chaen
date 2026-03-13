'use client';

import React from 'react';

import { createMarkdownLinkByMode } from '@/entities/editor/model/markdown-link';
import {
  applyTextareaTransform,
  insertTemplate,
  prefixLine,
  toggleHeadingLine,
  wrapSelection,
} from '@/entities/editor/model/selection-utils';
import { AlignPopover } from '@/features/markdown-toolbar/ui/align-popover';
import { ImageEmbedPopover } from '@/features/markdown-toolbar/ui/image-embed-popover';
import { LinkEmbedPopover } from '@/features/markdown-toolbar/ui/link-embed-popover';
import { TextBackgroundColorPopover } from '@/features/markdown-toolbar/ui/text-background-color-popover';
import { TextColorPopover } from '@/features/markdown-toolbar/ui/text-color-popover';
import { YoutubeEmbedPopover } from '@/features/markdown-toolbar/ui/youtube-embed-popover';
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

import type {
  LinkMode,
  MarkdownToolbarProps,
  ToolbarActionItem,
  ToolbarSection,
} from './markdown-toolbar.types';

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
  onChange,
  textareaRef,
  popoverTriggerClassName,
}: MarkdownToolbarProps & {
  popoverTriggerClassName: string;
}) => {
  const getSelectedText = React.useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) return '';

    return textarea.value.slice(textarea.selectionStart, textarea.selectionEnd).trim();
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
      applyWrap(`:::align ${align}\n`, '\n:::', '텍스트');
    },
    [applyWrap],
  );

  const handleAlignApply = React.useCallback(
    (align: 'center' | 'left' | 'right', closePopover?: () => void) => {
      applyAlign(align);
      closePopover?.();
    },
    [applyAlign],
  );

  const handleLinkApply = React.useCallback(
    (url: string, mode: LinkMode, closePopover?: () => void) => {
      const selectedText = getSelectedText();
      const nextValue = createMarkdownLinkByMode({
        label: selectedText || url,
        mode,
        url,
      });

      applyTextTransform(currentTextarea =>
        insertTemplate(currentTextarea, nextValue, nextValue.length),
      );
      closePopover?.();
    },
    [applyTextTransform, getSelectedText],
  );

  const handleImageApply = React.useCallback(
    (url: string, closePopover?: () => void) => {
      const selectedText = getSelectedText();
      const altText = selectedText || '이미지 설명';
      const nextValue = `![${altText}](${url})`;

      applyTextTransform(currentTextarea =>
        insertTemplate(currentTextarea, nextValue, nextValue.length),
      );
      closePopover?.();
    },
    [applyTextTransform, getSelectedText],
  );

  const handleTextColorApply = React.useCallback(
    (colorHex: string, closePopover?: () => void) => {
      applyWrap(`<span style="color:${colorHex}">`, '</span>', '텍스트');
      closePopover?.();
    },
    [applyWrap],
  );

  const handleBackgroundColorApply = React.useCallback(
    (colorHex: string, closePopover?: () => void) => {
      applyWrap(`<span style="background-color:${colorHex}">`, '</span>', '강조');
      closePopover?.();
    },
    [applyWrap],
  );

  const handleYoutubeApply = React.useCallback(
    (videoId: string, closePopover?: () => void) => {
      applyTemplate(`<YouTube id="${videoId}" />`);
      closePopover?.();
    },
    [applyTemplate],
  );

  const handleToggleApply = React.useCallback(
    (level: 1 | 2 | 3 | 4) => {
      if (!textareaRef.current) return;

      const selectedText = getSelectedText();
      const headingPrefix = '#'.repeat(level);

      if (!selectedText) {
        applyTemplate(`:::toggle ${headingPrefix} \n:::`, `:::toggle ${headingPrefix} `.length);
        return;
      }

      applyWrap(`:::toggle ${headingPrefix} `, '\n내용\n:::', '제목');
    },
    [applyTemplate, applyWrap, getSelectedText, textareaRef],
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
            key: 'image-embed',
            node: (
              <ImageEmbedPopover
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
            key: 'youtube-embed',
            node: (
              <YoutubeEmbedPopover
                onApply={handleYoutubeApply}
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
      handleImageApply,
      handleLinkApply,
      handleTextColorApply,
      handleYoutubeApply,
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

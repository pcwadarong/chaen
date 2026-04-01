'use client';

import React from 'react';

import type { EditorAttachment } from '@/entities/editor/model/editor-attachment';
import { createMarkdownLinkByMode } from '@/entities/editor/model/markdown-link';
import {
  createAlignBlockMarkdown,
  createAttachmentEmbedMarkdown,
  createImageEmbedMarkdownGroup,
  createImageGalleryMarkdown,
  createMathEmbedMarkdown,
  createToggleBlockMarkdown,
  createUploadedVideoEmbedMarkdown,
  createYoutubeEmbedMarkdown,
} from '@/entities/editor-core/model/markdown-templates';
import {
  applyTextareaTransform,
  insertTemplate,
  prefixLine,
  toggleHeadingLine,
  wrapSelection,
} from '@/entities/editor-core/model/selection-utils';
import type {
  LinkEmbedPopoverRenderProps,
  LinkMode,
  MarkdownToolbarPresetItemKey,
  MarkdownToolbarProps,
  TextColorPopoverRenderProps,
  ToolbarActionItem,
  ToolbarCustomItem,
  ToolbarSectionItem,
} from '@/features/edit-markdown/model/markdown-toolbar.types';
import {
  createMarkdownToolbarSections,
  createToolbarActionItems,
  createToolbarCustomItem,
  createToolbarTokenOptions,
} from '@/features/edit-markdown/model/markdown-toolbar-composition';
import { AlignPopover } from '@/features/edit-markdown/ui/align-popover';
import { FileEmbedPopover } from '@/features/edit-markdown/ui/file-embed-popover';
import { ImageEmbedPopover } from '@/features/edit-markdown/ui/image-embed-popover';
import { LinkEmbedPopover } from '@/features/edit-markdown/ui/link-embed-popover';
import { MathEmbedPopover } from '@/features/edit-markdown/ui/math-embed-popover';
import { TextBackgroundColorPopover } from '@/features/edit-markdown/ui/text-background-color-popover';
import { TextColorPopover } from '@/features/edit-markdown/ui/text-color-popover';
import { ToolbarTokenPopover } from '@/features/edit-markdown/ui/toolbar-token-popover';
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
  uiRegistry,
  popoverTriggerClassName,
}: MarkdownToolbarProps & {
  popoverTriggerClassName: string;
}) => {
  const toolbarLabels = uiRegistry?.labels;
  const toolbarPopoverRegistry = uiRegistry?.popovers;

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
      if (!payload?.items || payload.items.length === 0) {
        closePopover?.({ restoreFocus: false });
        return;
      }

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

  const headingPopoverOptions = React.useMemo(
    () => createToolbarTokenOptions(headingActions),
    [headingActions],
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

  const togglePopoverOptions = React.useMemo(
    () => createToolbarTokenOptions(toggleActions),
    [toggleActions],
  );

  /**
   * toolbar token popover 기본 구현을 만들거나 host registry가 주입한 primitive를 사용합니다.
   */
  const renderTokenPopover = React.useCallback(
    (
      key: 'headingPopover' | 'togglePopover',
      props: React.ComponentProps<typeof ToolbarTokenPopover>,
    ) => {
      const renderer =
        key === 'headingPopover'
          ? toolbarPopoverRegistry?.headingPopover
          : toolbarPopoverRegistry?.togglePopover;

      if (renderer) {
        return renderer(props);
      }

      return <ToolbarTokenPopover {...props} />;
    },
    [toolbarPopoverRegistry?.headingPopover, toolbarPopoverRegistry?.togglePopover],
  );

  /**
   * 글자색/배경색/링크 팝오버는 현재 앱 기본 UI를 유지하되,
   * 외부 package 단계에서는 registry가 primitive를 교체할 수 있도록 분기합니다.
   */
  const renderToolbarPopover = React.useCallback(
    (
      key: 'backgroundColorPopover' | 'linkEmbedPopover' | 'textColorPopover',
      props: LinkEmbedPopoverRenderProps | TextColorPopoverRenderProps,
    ) => {
      if (key === 'textColorPopover') {
        if (toolbarPopoverRegistry?.textColorPopover) {
          return toolbarPopoverRegistry.textColorPopover(props as TextColorPopoverRenderProps);
        }

        return <TextColorPopover {...(props as TextColorPopoverRenderProps)} />;
      }

      if (key === 'backgroundColorPopover') {
        if (toolbarPopoverRegistry?.backgroundColorPopover) {
          return toolbarPopoverRegistry.backgroundColorPopover(
            props as TextColorPopoverRenderProps,
          );
        }

        return <TextBackgroundColorPopover {...(props as TextColorPopoverRenderProps)} />;
      }

      if (toolbarPopoverRegistry?.linkEmbedPopover) {
        return toolbarPopoverRegistry.linkEmbedPopover(props as LinkEmbedPopoverRenderProps);
      }

      return <LinkEmbedPopover {...(props as LinkEmbedPopoverRenderProps)} />;
    },
    [toolbarPopoverRegistry],
  );

  const highlightItems = React.useMemo<ToolbarCustomItem[]>(
    () => [
      createToolbarCustomItem(
        'text-color',
        renderToolbarPopover('textColorPopover', {
          labels: toolbarLabels?.textColorPopover,
          onApply: handleTextColorApply,
          onTriggerMouseDown: event => event.preventDefault(),
          triggerClassName: popoverTriggerClassName,
        }),
      ),
      createToolbarCustomItem(
        'background-color',
        renderToolbarPopover('backgroundColorPopover', {
          labels: toolbarLabels?.backgroundColorPopover,
          onApply: handleBackgroundColorApply,
          onTriggerMouseDown: event => event.preventDefault(),
          triggerClassName: popoverTriggerClassName,
        }),
      ),
      createToolbarCustomItem(
        'align',
        <AlignPopover
          onApply={handleAlignApply}
          onTriggerMouseDown={event => event.preventDefault()}
          triggerClassName={popoverTriggerClassName}
        />,
      ),
    ],
    [
      handleAlignApply,
      handleBackgroundColorApply,
      handleTextColorApply,
      popoverTriggerClassName,
      renderToolbarPopover,
      toolbarLabels?.backgroundColorPopover,
      toolbarLabels?.textColorPopover,
    ],
  );

  const embedItems = React.useMemo<ToolbarCustomItem[]>(
    () => [
      createToolbarCustomItem(
        'math-embed',
        <MathEmbedPopover
          onApply={handleMathApply}
          onTriggerMouseDown={event => event.preventDefault()}
          triggerClassName={popoverTriggerClassName}
        />,
      ),
      createToolbarCustomItem(
        'file-embed',
        <FileEmbedPopover
          contentType={contentType}
          onApply={handleAttachmentApply}
          onTriggerMouseDown={event => event.preventDefault()}
          triggerClassName={popoverTriggerClassName}
        />,
      ),
      createToolbarCustomItem(
        'image-embed',
        <ImageEmbedPopover
          contentType={contentType}
          onApply={handleImageApply}
          onTriggerMouseDown={event => event.preventDefault()}
          triggerClassName={popoverTriggerClassName}
        />,
      ),
      createToolbarCustomItem(
        'link-embed',
        renderToolbarPopover('linkEmbedPopover', {
          labels: toolbarLabels?.linkEmbedPopover,
          onApply: handleLinkApply,
          onTriggerMouseDown: event => event.preventDefault(),
          triggerClassName: popoverTriggerClassName,
        }),
      ),
      createToolbarCustomItem(
        'video-embed',
        <VideoEmbedModal
          contentType={contentType}
          onApply={handleVideoApply}
          onTriggerMouseDown={event => event.preventDefault()}
          triggerClassName={popoverTriggerClassName}
        />,
      ),
    ],
    [
      contentType,
      handleAttachmentApply,
      handleImageApply,
      handleLinkApply,
      handleMathApply,
      handleVideoApply,
      popoverTriggerClassName,
      renderToolbarPopover,
      toolbarLabels?.linkEmbedPopover,
    ],
  );

  const toolbarSections = React.useMemo(
    () =>
      createMarkdownToolbarSections({
        itemRegistry: Object.fromEntries(
          [
            createToolbarCustomItem(
              'heading-popover',
              renderTokenPopover('headingPopover', {
                labels: {
                  panelLabel: toolbarLabels?.headingPopover?.panelLabel ?? '제목 레벨 선택',
                  triggerAriaLabel: toolbarLabels?.headingPopover?.triggerAriaLabel ?? '제목',
                  triggerTooltip: toolbarLabels?.headingPopover?.triggerTooltip ?? '제목',
                },
                onTriggerMouseDown: event => event.preventDefault(),
                options: headingPopoverOptions,
                triggerClassName: popoverTriggerClassName,
                triggerToken: 'H',
              }),
            ),
            ...createToolbarActionItems(textStructureActions),
            ...createToolbarActionItems(inlineFormatActions),
            ...highlightItems,
            ...createToolbarActionItems(blockSyntaxActions),
            createToolbarCustomItem(
              'toggle-popover',
              renderTokenPopover('togglePopover', {
                labels: {
                  panelLabel: toolbarLabels?.togglePopover?.panelLabel ?? '토글 레벨 선택',
                  triggerAriaLabel: toolbarLabels?.togglePopover?.triggerAriaLabel ?? '토글',
                  triggerTooltip: toolbarLabels?.togglePopover?.triggerTooltip ?? '토글',
                },
                onTriggerMouseDown: event => event.preventDefault(),
                options: togglePopoverOptions,
                triggerClassName: popoverTriggerClassName,
                triggerToken: 'T',
              }),
            ),
            ...embedItems,
          ].map(item => [item.key as MarkdownToolbarPresetItemKey, item] as const),
        ) as Partial<Record<MarkdownToolbarPresetItemKey, ToolbarSectionItem>>,
      }),
    [
      blockSyntaxActions,
      embedItems,
      headingPopoverOptions,
      highlightItems,
      inlineFormatActions,
      popoverTriggerClassName,
      renderTokenPopover,
      textStructureActions,
      toolbarLabels?.headingPopover,
      toolbarLabels?.togglePopover,
      togglePopoverOptions,
    ],
  );

  return {
    toolbarSections,
  };
};

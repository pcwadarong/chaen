'use client';

import React from 'react';
import { css } from 'styled-system/css';

import { AlignPopover } from '@/features/markdown-toolbar/ui/align-popover';
import { LinkEmbedPopover } from '@/features/markdown-toolbar/ui/link-embed-popover';
import { TextBackgroundColorPopover } from '@/features/markdown-toolbar/ui/text-background-color-popover';
import { TextColorPopover } from '@/features/markdown-toolbar/ui/text-color-popover';
import { ToolbarActionButton } from '@/features/markdown-toolbar/ui/toolbar-action-button';
import { YoutubeEmbedPopover } from '@/features/markdown-toolbar/ui/youtube-embed-popover';
import { createMarkdownLinkByMode } from '@/shared/lib/editor/markdown-link';
import {
  applyTextareaTransform,
  insertTemplate,
  prefixLine,
  toggleHeadingLine,
  wrapSelection,
} from '@/shared/lib/editor/selection-utils';
import {
  CodeBlockIcon,
  DashIcon,
  ImageIcon,
  MarkDownBoldIcon,
  MarkDownItalicIcon,
  MarkDownStrikeIcon,
  MarkDownUnderlineIcon,
  QuoteIcon,
  SpoilerIcon,
  SubtextIcon,
  TableIcon,
} from '@/shared/ui/icons/app-icons';

type MarkdownToolbarProps = {
  onChange: (value: string) => void;
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
  value: string;
};

type LinkMode = 'card' | 'link' | 'preview';
type ToolbarActionItem = {
  icon?: React.ReactNode;
  key: string;
  label: string;
  onClick: () => void;
  token?: string;
};
type ToolbarSectionItem =
  | {
      action: ToolbarActionItem;
      key: string;
      type: 'action';
    }
  | {
      key: string;
      node: React.ReactNode;
      type: 'custom';
    };
type ToolbarSection = {
  items: ToolbarSectionItem[];
  key: string;
};

const tableTemplate = [
  '| 제목1 | 제목2 | 제목3 |',
  '|-------|-------|-------|',
  '| 내용  | 내용  | 내용  |',
].join('\n');

/**
 * textarea 기반 markdown 포맷 툴바입니다.
 * 값 변경 후에는 선택 범위와 포커스를 원래 textarea로 복원합니다.
 */
export const MarkdownToolbar = ({ onChange, textareaRef, value }: MarkdownToolbarProps) => {
  const applyTextTransform = (transform: (textarea: HTMLTextAreaElement) => string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    applyTextareaTransform(textarea, onChange, transform);
  };

  const applyTemplate = (template: string, cursorOffset?: number) => {
    applyTextTransform(textarea => insertTemplate(textarea, template, cursorOffset));
  };

  const applyWrap = (before: string, after: string, placeholder?: string) => {
    applyTextTransform(textarea => wrapSelection(textarea, before, after, placeholder));
  };

  const applyPrefix = (prefix: string) => {
    applyTextTransform(textarea => prefixLine(textarea, prefix));
  };

  const applyHeading = (level: 1 | 2 | 3 | 4) => {
    applyTextTransform(textarea => toggleHeadingLine(textarea, level));
  };

  const applyAlign = (align: 'center' | 'left' | 'right') => {
    applyWrap(`:::align ${align}\n`, '\n:::', '텍스트');
  };

  const handleAlignApply = (align: 'center' | 'left' | 'right', closePopover?: () => void) => {
    applyAlign(align);
    closePopover?.();
  };

  const handleLinkApply = (url: string, mode: LinkMode, closePopover?: () => void) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const selectedText = value.slice(textarea.selectionStart, textarea.selectionEnd).trim();
    const nextValue = createMarkdownLinkByMode({
      label: selectedText || url,
      mode,
      url,
    });

    applyTextTransform(currentTextarea =>
      insertTemplate(currentTextarea, nextValue, nextValue.length),
    );
    closePopover?.();
  };

  const handleImageApply = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const selectedText = value.slice(textarea.selectionStart, textarea.selectionEnd).trim();
    applyWrap('![', '](https://example.com/image.png)', selectedText || '이미지 설명');
  };

  const handleTextColorApply = (colorHex: string, closePopover?: () => void) => {
    applyWrap(`<span style="color:${colorHex}">`, '</span>', '텍스트');
    closePopover?.();
  };

  const handleBackgroundColorApply = (colorHex: string, closePopover?: () => void) => {
    applyWrap(`<span style="background-color:${colorHex}">`, '</span>', '강조');
    closePopover?.();
  };

  const handleYoutubeApply = (videoId: string, closePopover?: () => void) => {
    applyTemplate(`<YouTube id="${videoId}" />`);
    closePopover?.();
  };

  const handleToggleApply = (level: 1 | 2 | 3 | 4) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const selectedText = value.slice(textarea.selectionStart, textarea.selectionEnd).trim();
    const headingPrefix = '#'.repeat(level);

    if (!selectedText) {
      applyTemplate(`:::toggle ${headingPrefix} \n:::`, `:::toggle ${headingPrefix} `.length);
      return;
    }

    applyWrap(`:::toggle ${headingPrefix} `, '\n내용\n:::', '제목');
  };

  const headingActions: ToolbarActionItem[] = [
    { key: 'heading-1', label: '제목 1', onClick: () => applyHeading(1), token: 'H1' },
    { key: 'heading-2', label: '제목 2', onClick: () => applyHeading(2), token: 'H2' },
    { key: 'heading-3', label: '제목 3', onClick: () => applyHeading(3), token: 'H3' },
    { key: 'heading-4', label: '제목 4', onClick: () => applyHeading(4), token: 'H4' },
  ];
  const inlineFormatActions: ToolbarActionItem[] = [
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
  ];
  const textStructureActions: ToolbarActionItem[] = [
    {
      icon: <SubtextIcon aria-hidden color="text" size="sm" />,
      key: 'subtext',
      label: '보조 문구',
      onClick: () => applyPrefix('-# '),
    },
  ];
  const blockSyntaxActions: ToolbarActionItem[] = [
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
  ];
  const embedActions: ToolbarActionItem[] = [
    {
      icon: <ImageIcon aria-hidden color="text" size="sm" />,
      key: 'image',
      label: '이미지',
      onClick: handleImageApply,
    },
  ];
  const toggleActions: ToolbarActionItem[] = [
    {
      key: 'toggle-1',
      label: '토글 1',
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
      label: '토글 3',
      onClick: () => handleToggleApply(3),
      token: 'T3',
    },
    {
      key: 'toggle-4',
      label: '토글 4',
      onClick: () => handleToggleApply(4),
      token: 'T4',
    },
  ];

  const renderActionButton = (action: ToolbarActionItem) => (
    <ToolbarActionButton ariaLabel={action.label} key={action.key} onClick={action.onClick}>
      {action.token ? <span className={tokenClass}>{action.token}</span> : action.icon}
    </ToolbarActionButton>
  );

  const renderToolbarSectionItem = (item: ToolbarSectionItem) =>
    item.type === 'action' ? (
      renderActionButton(item.action)
    ) : (
      <React.Fragment key={item.key}>{item.node}</React.Fragment>
    );

  const toolbarSections: ToolbarSection[] = [
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
              triggerClassName={popoverTriggerResetClass}
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
              triggerClassName={popoverTriggerResetClass}
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
              triggerClassName={popoverTriggerResetClass}
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
        ...embedActions.map(action => ({
          action,
          key: action.key,
          type: 'action' as const,
        })),
        {
          key: 'link-embed',
          node: (
            <LinkEmbedPopover
              onApply={handleLinkApply}
              onTriggerMouseDown={event => event.preventDefault()}
              triggerClassName={popoverTriggerResetClass}
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
              triggerClassName={popoverTriggerResetClass}
            />
          ),
          type: 'custom',
        },
      ],
      key: 'embed-and-media',
    },
  ];

  return (
    <div aria-label="마크다운 서식 도구" className={toolbarClass} role="toolbar">
      {toolbarSections.map((section, index) => (
        <React.Fragment key={section.key}>
          <div className={groupClass}>{section.items.map(renderToolbarSectionItem)}</div>
          {index < toolbarSections.length - 1 ? (
            <div aria-hidden className={separatorClass} />
          ) : null}
        </React.Fragment>
      ))}
    </div>
  );
};

const toolbarClass = css({
  display: 'flex',
  alignItems: 'center',
  gap: '2',
  overflowX: 'auto',
  width: 'full',
  pb: '3',
  flexWrap: 'nowrap',
  scrollbarWidth: '[thin]',
});

const groupClass = css({
  display: 'inline-flex',
  alignItems: 'center',
  gap: '2',
  flex: 'none',
});

const separatorClass = css({
  width: '[1px]',
  minHeight: '7',
  backgroundColor: 'border',
  flex: 'none',
});

const tokenClass = css({
  fontSize: 'xs',
  fontWeight: 'bold',
  letterSpacing: '[-0.02em]',
});

const popoverTriggerResetClass = css({
  border: '[0]',
  p: '0',
});

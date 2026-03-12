'use client';

import React from 'react';
import { css } from 'styled-system/css';

import type {
  MarkdownToolbarProps,
  ToolbarActionItem,
  ToolbarSectionItem,
} from '@/features/markdown-toolbar/model/markdown-toolbar.types';
import { useMarkdownToolbar } from '@/features/markdown-toolbar/model/use-markdown-toolbar';
import { ToolbarActionButton } from '@/features/markdown-toolbar/ui/toolbar-action-button';

/**
 * textarea 기반 markdown 포맷 툴바입니다.
 * 실제 편집 규칙은 model hook에서 관리하고, 이 컴포넌트는 레이아웃과 렌더링만 담당합니다.
 */
export const MarkdownToolbar = ({ onChange, textareaRef, value }: MarkdownToolbarProps) => {
  const { toolbarSections } = useMarkdownToolbar({
    onChange,
    popoverTriggerClassName: popoverTriggerResetClass,
    textareaRef,
    value,
  });

  return (
    <div aria-label="마크다운 서식 도구" className={toolbarClass} role="toolbar">
      {toolbarSections.map((section, index) => (
        <React.Fragment key={section.key}>
          <div className={groupClass}>
            {section.items.map(item => renderToolbarSectionItem(item))}
          </div>
          {index < toolbarSections.length - 1 ? (
            <div aria-hidden className={separatorClass} />
          ) : null}
        </React.Fragment>
      ))}
    </div>
  );
};

/**
 * 일반 toolbar action item을 compact button으로 렌더링합니다.
 */
const renderActionButton = (action: ToolbarActionItem) => (
  <ToolbarActionButton ariaLabel={action.label} key={action.key} onClick={action.onClick}>
    {action.token ? <span className={tokenClass}>{action.token}</span> : action.icon}
  </ToolbarActionButton>
);

/**
 * section item 종류에 따라 action button 또는 custom node를 렌더링합니다.
 */
const renderToolbarSectionItem = (item: ToolbarSectionItem) =>
  item.type === 'action' ? (
    renderActionButton(item.action)
  ) : (
    <React.Fragment key={item.key}>{item.node}</React.Fragment>
  );

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

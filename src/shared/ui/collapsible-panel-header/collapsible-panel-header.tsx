import React from 'react';
import { css, cx } from 'styled-system/css';

import { ArrowUpIcon } from '@/shared/ui/icons/app-icons';

type CollapsiblePanelHeaderProps = {
  className?: string;
  isCollapsed: boolean;
  onToggle: () => void;
  title: React.ReactNode;
  titleClassName?: string;
};

/**
 * 패널 제목과 접기/펼치기 토글을 함께 제공하는 공통 헤더입니다.
 */
export const CollapsiblePanelHeader = ({
  className,
  isCollapsed,
  onToggle,
  title,
  titleClassName,
}: CollapsiblePanelHeaderProps) => (
  <header className={cx(rootClass, className)}>
    <h3 className={titleClassName ?? titleClass}>{title}</h3>
    <button
      aria-expanded={!isCollapsed}
      className={toggleButtonClass}
      onClick={onToggle}
      type="button"
    >
      <span>{isCollapsed ? '열기' : '닫기'}</span>
      <ArrowUpIcon
        aria-hidden
        className={isCollapsed ? toggleIconCollapsedClass : toggleIconClass}
        color="muted"
        size="sm"
      />
    </button>
  </header>
);

const rootClass = css({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
});

const titleClass = css({
  margin: '0',
  fontSize: 'lg',
  lineHeight: 'tight',
});

const toggleButtonClass = css({
  display: 'inline-flex',
  alignItems: 'center',
  gap: '1.5',
  fontSize: 'sm',
  color: 'muted',
  _focusVisible: {
    outline: '[2px solid var(--colors-focus-ring)]',
    outlineOffset: '[2px]',
  },
});

const toggleIconClass = css({
  transition: 'transform',
});

const toggleIconCollapsedClass = css({
  transition: 'transform',
  transform: 'rotate(180deg)',
});

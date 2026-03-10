import React from 'react';
import { css, cva } from 'styled-system/css';

import { Link } from '@/i18n/navigation';

export type DetailArchiveLinkItem = {
  description: string | null;
  href: string;
  isActive: boolean;
  title: string;
  yearText: string;
};

type DetailArchiveListProps = {
  emptyText: string;
  items: DetailArchiveLinkItem[];
};

export const detailArchiveSidebarViewportClass = css({
  py: '7',
  '@media (min-width: 961px)': {
    flex: '[1 1 auto]',
    minHeight: '0',
    overflowY: 'auto',
    overscrollBehavior: 'contain',
  },
  '@media (min-width: 1200px)': {
    py: '8',
  },
});

/**
 * 상세 페이지 좌측 아카이브 링크 목록을 공통 마크업으로 렌더링합니다.
 */
export const DetailArchiveList = ({ emptyText, items }: DetailArchiveListProps) => {
  if (items.length === 0) {
    return <p className={emptyArchiveClass}>{emptyText}</p>;
  }

  return (
    <ul className={sidebarListClass}>
      {items.map(item => (
        <li key={item.href}>
          <Link
            aria-current={item.isActive ? 'page' : undefined}
            className={sidebarLinkClass({ active: item.isActive })}
            href={item.href}
          >
            <div className={sidebarMetaRowClass}>
              <span>{item.yearText}</span>
            </div>
            <strong className={sidebarTitleClass}>{item.title}</strong>
            {item.description ? (
              <p className={sidebarDescriptionClass}>{item.description}</p>
            ) : null}
          </Link>
        </li>
      ))}
    </ul>
  );
};

const sidebarListClass = css({
  display: 'grid',
});

const sidebarLinkClass = cva({
  base: {
    display: 'grid',
    gap: '2',
    px: '4',
    py: '4',
    borderLeft: '[3px solid transparent]',
    borderBottom: '[1px solid var(--colors-border)]',
    color: 'text',
    transition: '[background-color 160ms ease, border-color 160ms ease]',
    _hover: {
      background: 'surfaceMuted',
    },
    _focusVisible: {
      outline: '[2px solid var(--colors-focus-ring)]',
      outlineOffset: '[-2px]',
      background: 'surfaceMuted',
    },
    '@media (min-width: 1200px)': {
      px: '5',
      py: '5',
    },
  },
  variants: {
    active: {
      true: {
        borderLeftColor: 'primary',
        background: 'surfaceMuted',
      },
      false: {},
    },
  },
});

const sidebarMetaRowClass = css({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  color: 'muted',
  fontSize: 'xs',
});

const sidebarTitleClass = css({
  lineClamp: '2',
  fontSize: 'xl',
  lineHeight: 'tight',
  letterSpacing: '[-0.03em]',
  color: 'muted',
});

const sidebarDescriptionClass = css({
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  color: 'muted',
  fontSize: 'sm',
});

const emptyArchiveClass = css({
  p: '5',
  color: 'muted',
});

'use client';

import React from 'react';
import { css, cx } from 'styled-system/css';

import { Button } from '@/shared/ui/button/button';

export type SortOrder = 'latest' | 'oldest';

type SortOrderTabsProps = {
  currentSort: SortOrder;
  labels: {
    group: string;
    latest: string;
    oldest: string;
  };
  onChangeSort: (sort: SortOrder) => void;
};

/**
 * latest/oldest 정렬 토글 UI를 범용 탭 블록으로 제공합니다.
 */
const SortOrderTabsBase = ({ currentSort, labels, onChangeSort }: SortOrderTabsProps) => (
  <div className={toolbarClass}>
    <div aria-label={labels.group} className={sortGroupClass} role="tablist">
      <Button
        aria-selected={currentSort === 'latest'}
        className={cx(
          sortButtonClass,
          currentSort === 'latest' ? activeSortButtonClass : undefined,
        )}
        onClick={() => onChangeSort('latest')}
        role="tab"
        size="sm"
        tone="white"
        type="button"
        variant={currentSort === 'latest' ? 'solid' : 'ghost'}
      >
        {labels.latest}
      </Button>
      <Button
        aria-selected={currentSort === 'oldest'}
        className={cx(
          sortButtonClass,
          currentSort === 'oldest' ? activeSortButtonClass : undefined,
        )}
        onClick={() => onChangeSort('oldest')}
        role="tab"
        size="sm"
        tone="white"
        type="button"
        variant={currentSort === 'oldest' ? 'solid' : 'ghost'}
      >
        {labels.oldest}
      </Button>
    </div>
  </div>
);

SortOrderTabsBase.displayName = 'SortOrderTabs';

export const SortOrderTabs = React.memo(SortOrderTabsBase);

const toolbarClass = css({
  display: 'flex',
  justifyContent: 'flex-end',
  paddingTop: '2',
  paddingBottom: '1',
  marginTop: '1',
});

const sortGroupClass = css({
  display: 'inline-flex',
  alignItems: 'center',
  gap: '1',
  width: '[fit-content]',
  maxWidth: 'full',
  p: '1',
  borderRadius: 'full',
  background: 'surfaceMuted',
  border: '[1px solid var(--colors-border)]',
});

const sortButtonClass = css({
  color: 'muted',
  fontSize: 'md',
  fontWeight: 'medium',
  _hover: {
    color: 'primary',
  },
  _focusVisible: {
    color: 'primary',
  },
});

const activeSortButtonClass = css({
  background: 'surface',
  color: 'text',
  borderColor: 'transparent',
  fontWeight: 'semibold',
});

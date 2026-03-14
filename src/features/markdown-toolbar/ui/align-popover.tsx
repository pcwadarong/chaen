'use client';

import React from 'react';
import { css } from 'styled-system/css';

import { Button } from '@/shared/ui/button/button';
import { AlignCenterIcon, AlignLeftIcon, AlignRightIcon } from '@/shared/ui/icons/app-icons';
import { type ClosePopover, Popover } from '@/shared/ui/popover/popover';

type AlignPopoverProps = {
  onApply: (align: 'center' | 'left' | 'right', closePopover?: ClosePopover) => void;
  onTriggerMouseDown?: React.MouseEventHandler<HTMLButtonElement>;
  triggerClassName?: string;
};

const alignOptions = [
  {
    icon: <AlignLeftIcon aria-hidden color="text" size="sm" />,
    key: 'left',
    label: '좌정렬',
    value: 'left' as const,
  },
  {
    icon: <AlignCenterIcon aria-hidden color="text" size="sm" />,
    key: 'center',
    label: '가운데 정렬',
    value: 'center' as const,
  },
  {
    icon: <AlignRightIcon aria-hidden color="text" size="sm" />,
    key: 'right',
    label: '우정렬',
    value: 'right' as const,
  },
];

/**
 * toolbar 내부에서 정렬 문법을 선택하는 팝오버입니다.
 */
export const AlignPopover = ({
  onApply,
  onTriggerMouseDown,
  triggerClassName,
}: AlignPopoverProps) => (
  <Popover
    onTriggerMouseDown={onTriggerMouseDown}
    panelLabel="정렬 선택"
    portalPlacement="start"
    renderInPortal
    triggerAriaLabel="정렬"
    triggerClassName={triggerClassName}
    triggerContent={<AlignLeftIcon aria-hidden color="text" size="sm" />}
    triggerTooltip="정렬"
  >
    {({ closePopover }) => (
      <div className={alignGridClass}>
        {alignOptions.map(option => (
          <Button
            aria-label={option.label}
            className={alignButtonClass}
            key={option.key}
            onClick={() => onApply(option.value, closePopover)}
            onMouseDown={event => event.preventDefault()}
            type="button"
            variant="ghost"
          >
            {option.icon}
          </Button>
        ))}
      </div>
    )}
  </Popover>
);

const alignGridClass = css({
  display: 'inline-grid',
  gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
  gap: '2',
  minWidth: '[8.5rem]',
});

const alignButtonClass = css({
  minWidth: '9',
  minHeight: '9',
  px: '0',
  borderRadius: 'lg',
  borderColor: 'border',
});

'use client';

import React from 'react';
import { css } from 'styled-system/css';

import type { ToolbarTokenOption } from '@/features/edit-markdown/model/markdown-toolbar.types';
import { Button } from '@/shared/ui/button/button';
import { type ClosePopover, Popover } from '@/shared/ui/popover/popover';

export type ToolbarTokenPopoverLabels = {
  panelLabel: string;
  triggerAriaLabel: string;
  triggerTooltip: string;
};

export type ToolbarTokenPopoverProps = {
  labels: ToolbarTokenPopoverLabels;
  onTriggerMouseDown?: React.MouseEventHandler<HTMLButtonElement>;
  options: ToolbarTokenOption[];
  triggerClassName?: string;
  triggerToken: string;
};

/**
 * 제목/토글처럼 단계 선택이 필요한 markdown toolbar 명령을 compact token trigger 하나로 묶어 제공합니다.
 * trigger는 툴바 공간을 줄이고, 실제 단계 선택은 팝오버 안 버튼 목록에서 수행합니다.
 */
export const ToolbarTokenPopover = ({
  labels,
  onTriggerMouseDown,
  options,
  triggerClassName,
  triggerToken,
}: ToolbarTokenPopoverProps) => (
  <Popover
    onTriggerMouseDown={onTriggerMouseDown}
    panelClassName={panelClass}
    panelLabel={labels.panelLabel}
    portalPlacement="start"
    renderInPortal
    triggerAriaLabel={labels.triggerAriaLabel}
    triggerClassName={triggerClassName}
    triggerContent={<span className={triggerTokenClass}>{triggerToken}</span>}
    triggerTooltip={labels.triggerTooltip}
  >
    {({ closePopover }) => (
      <div className={optionGridClass}>
        {options.map(option => (
          <Button
            aria-label={option.label}
            className={optionButtonClass}
            key={option.key}
            onClick={() => handleOptionClick(option.onClick, closePopover)}
            onMouseDown={event => event.preventDefault()}
            size="sm"
            tone="white"
            type="button"
            variant="ghost"
          >
            <span className={optionTokenClass}>{option.token}</span>
          </Button>
        ))}
      </div>
    )}
  </Popover>
);

/**
 * 선택한 툴바 명령을 적용한 뒤 팝오버를 닫습니다.
 */
const handleOptionClick = (onClick: () => void, closePopover: ClosePopover) => {
  onClick();
  closePopover({ restoreFocus: false });
};

const panelClass = css({
  minWidth: 'auto',
});

const optionGridClass = css({
  display: 'grid',
  gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
  gap: '2',
});

const optionButtonClass = css({
  minWidth: '10',
  minHeight: '9',
  px: '0',
  borderRadius: 'lg',
  borderColor: 'border',
});

const triggerTokenClass = css({
  fontSize: 'xs',
  fontWeight: 'bold',
  letterSpacing: '[-0.02em]',
});

const optionTokenClass = css({
  fontSize: 'xs',
  fontWeight: 'bold',
  letterSpacing: '[-0.02em]',
});

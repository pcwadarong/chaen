'use client';

import React from 'react';
import { css } from 'styled-system/css';

import { markdownColorPresets } from '@/shared/lib/markdown/markdown-color-presets';
import { Button } from '@/shared/ui/button/button';
import { Popover } from '@/shared/ui/popover/popover';

type ColorStylePopoverProps = {
  previewMode: 'background' | 'text';
  onApply: (colorHex: string, closePopover?: () => void) => void;
  onTriggerMouseDown?: React.MouseEventHandler<HTMLButtonElement>;
  panelLabel: string;
  triggerAriaLabel: string;
  triggerClassName?: string;
  triggerContent: React.ReactNode;
  triggerTooltip: string;
};

/**
 * 글자색/배경색 강조처럼 같은 팔레트를 재사용하는 toolbar 색상 팝오버 베이스입니다.
 */
export const ColorStylePopover = ({
  previewMode,
  onApply,
  onTriggerMouseDown,
  panelLabel,
  triggerAriaLabel,
  triggerClassName,
  triggerContent,
  triggerTooltip,
}: ColorStylePopoverProps) => (
  <Popover
    onTriggerMouseDown={onTriggerMouseDown}
    panelLabel={panelLabel}
    portalPlacement="start"
    renderInPortal
    triggerAriaLabel={triggerAriaLabel}
    triggerClassName={triggerClassName}
    triggerContent={triggerContent}
    triggerTooltip={triggerTooltip}
  >
    {({ closePopover }) => (
      <div className={colorGridClass}>
        {markdownColorPresets.map(option => (
          <Button
            aria-label={`${option.label} 색상`}
            className={colorButtonClass}
            key={option.hex}
            onClick={() => onApply(option.hex, closePopover)}
            onMouseDown={event => event.preventDefault()}
            title={option.hex}
            type="button"
            variant="ghost"
          >
            <span
              aria-hidden
              className={colorSwatchClass}
              style={
                previewMode === 'text'
                  ? { color: option.textColor }
                  : { backgroundColor: option.softBackgroundColor }
              }
            >
              A
            </span>
          </Button>
        ))}
      </div>
    )}
  </Popover>
);

const colorGridClass = css({
  display: 'grid',
  gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
  gap: '2',
  minWidth: '[11rem]',
});

const colorButtonClass = css({
  minWidth: '9',
  minHeight: '9',
  borderRadius: 'lg',
  borderColor: 'border',
  px: '0',
});

const colorSwatchClass = css({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '5',
  height: '5',
  borderRadius: 'md',
  fontSize: 'xs',
  fontWeight: 'bold',
  boxShadow: '[inset 0 0 0 1px rgba(15, 23, 42, 0.08)]',
});

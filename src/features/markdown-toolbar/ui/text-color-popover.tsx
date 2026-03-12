'use client';

import React from 'react';

import { ColorStylePopover } from '@/features/markdown-toolbar/ui/color-style-popover';
import { ColorIcon } from '@/shared/ui/icons/app-icons';

type TextColorPopoverProps = {
  onApply: (colorHex: string, closePopover?: () => void) => void;
  onTriggerMouseDown?: React.MouseEventHandler<HTMLButtonElement>;
  triggerClassName?: string;
};

/**
 * toolbar 내부에서 글자색 강조 문법을 선택하는 팝오버입니다.
 */
export const TextColorPopover = ({
  onApply,
  onTriggerMouseDown,
  triggerClassName,
}: TextColorPopoverProps) => (
  <ColorStylePopover
    previewMode="text"
    onApply={onApply}
    onTriggerMouseDown={onTriggerMouseDown}
    panelLabel="글자 색상 선택"
    triggerAriaLabel="글자 색상"
    triggerClassName={triggerClassName}
    triggerContent={<ColorIcon aria-hidden color="text" size="sm" />}
    triggerTooltip="글자 색상"
  />
);

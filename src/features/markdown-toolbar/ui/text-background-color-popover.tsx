'use client';

import React from 'react';

import { ColorStylePopover } from '@/features/markdown-toolbar/ui/color-style-popover';
import { TextBgColorIcon } from '@/shared/ui/icons/app-icons';

type TextBackgroundColorPopoverProps = {
  onApply: (colorHex: string, closePopover?: () => void) => void;
  onTriggerMouseDown?: React.MouseEventHandler<HTMLButtonElement>;
  triggerClassName?: string;
};

/**
 * toolbar 내부에서 배경색 강조 문법을 선택하는 팝오버입니다.
 */
export const TextBackgroundColorPopover = ({
  onApply,
  onTriggerMouseDown,
  triggerClassName,
}: TextBackgroundColorPopoverProps) => (
  <ColorStylePopover
    previewMode="background"
    onApply={onApply}
    onTriggerMouseDown={onTriggerMouseDown}
    panelLabel="배경 색상 선택"
    triggerAriaLabel="배경 색상"
    triggerClassName={triggerClassName}
    triggerContent={<TextBgColorIcon aria-hidden color="text" size="sm" />}
    triggerTooltip="배경 색상"
  />
);

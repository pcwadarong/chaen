'use client';

import React from 'react';

import {
  ColorStylePopover,
  type ColorStylePopoverLabels,
} from '@/features/edit-markdown/ui/color-style-popover';
import { TextBgColorIcon } from '@/shared/ui/icons/app-icons';

type TextBackgroundColorPopoverProps = {
  labels?: Partial<ColorStylePopoverLabels>;
  onApply: (colorHex: string, closePopover?: () => void) => void;
  onTriggerMouseDown?: React.MouseEventHandler<HTMLButtonElement>;
  triggerClassName?: string;
};

/**
 * toolbar 내부에서 배경색 강조 문법을 선택하는 팝오버입니다.
 */
export const TextBackgroundColorPopover = ({
  labels,
  onApply,
  onTriggerMouseDown,
  triggerClassName,
}: TextBackgroundColorPopoverProps) => (
  <ColorStylePopover
    labels={{
      getOptionAriaLabel: labels?.getOptionAriaLabel,
      panelLabel: labels?.panelLabel ?? '배경 색상 선택',
      triggerAriaLabel: labels?.triggerAriaLabel ?? '배경 색상',
      triggerTooltip: labels?.triggerTooltip ?? '배경 색상',
    }}
    previewMode="background"
    onApply={onApply}
    onTriggerMouseDown={onTriggerMouseDown}
    triggerClassName={triggerClassName}
    triggerContent={<TextBgColorIcon aria-hidden color="text" size="sm" />}
  />
);

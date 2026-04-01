'use client';

import React from 'react';

import {
  ColorStylePopover,
  type ColorStylePopoverLabels,
} from '@/features/edit-markdown/ui/color-style-popover';
import { ColorIcon } from '@/shared/ui/icons/app-icons';

type TextColorPopoverProps = {
  labels?: Partial<ColorStylePopoverLabels>;
  onApply: (colorHex: string, closePopover?: () => void) => void;
  onTriggerMouseDown?: React.MouseEventHandler<HTMLButtonElement>;
  triggerClassName?: string;
};

/**
 * toolbar 내부에서 글자색 강조 문법을 선택하는 팝오버입니다.
 */
export const TextColorPopover = ({
  labels,
  onApply,
  onTriggerMouseDown,
  triggerClassName,
}: TextColorPopoverProps) => (
  <ColorStylePopover
    labels={{
      getOptionAriaLabel: labels?.getOptionAriaLabel,
      panelLabel: labels?.panelLabel ?? '글자 색상 선택',
      triggerAriaLabel: labels?.triggerAriaLabel ?? '글자 색상',
      triggerTooltip: labels?.triggerTooltip ?? '글자 색상',
    }}
    previewMode="text"
    onApply={onApply}
    onTriggerMouseDown={onTriggerMouseDown}
    triggerClassName={triggerClassName}
    triggerContent={<ColorIcon aria-hidden color="text" size="sm" />}
  />
);

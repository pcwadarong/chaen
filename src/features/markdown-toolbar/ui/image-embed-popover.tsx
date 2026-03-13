'use client';

import React, { useState } from 'react';
import { css } from 'styled-system/css';

import { Button } from '@/shared/ui/button/button';
import { ImageIcon } from '@/shared/ui/icons/app-icons';
import { Input } from '@/shared/ui/input/input';
import { type ClosePopover, Popover } from '@/shared/ui/popover/popover';

type ImageEmbedPopoverProps = {
  onApply: (url: string, closePopover?: ClosePopover) => void;
  onTriggerMouseDown?: React.MouseEventHandler<HTMLButtonElement>;
  triggerClassName?: string;
};

/**
 * toolbar 내부에서 이미지 URL을 받아 markdown 이미지 문법을 삽입하는 팝오버입니다.
 */
export const ImageEmbedPopover = ({
  onApply,
  onTriggerMouseDown,
  triggerClassName,
}: ImageEmbedPopoverProps) => {
  const [imageInput, setImageInput] = useState('');

  const handleApply = (closePopover?: ClosePopover) => {
    const normalizedInput = imageInput.trim();

    if (!normalizedInput) return;

    onApply(normalizedInput, closePopover);
    setImageInput('');
  };

  return (
    <Popover
      onTriggerMouseDown={onTriggerMouseDown}
      panelLabel="이미지 삽입"
      portalPlacement="start"
      renderInPortal
      triggerAriaLabel="이미지"
      triggerClassName={triggerClassName}
      triggerContent={<ImageIcon aria-hidden color="text" size="sm" />}
      triggerTooltip="이미지"
    >
      {({ closePopover }) => (
        <div className={popoverContentClass}>
          <Input
            aria-label="이미지 URL"
            onChange={event => setImageInput(event.target.value)}
            onMouseDown={event => event.stopPropagation()}
            placeholder="https://example.com/image.png"
            type="url"
            value={imageInput}
          />
          <Button onClick={() => handleApply(closePopover)}>삽입</Button>
        </div>
      )}
    </Popover>
  );
};

const popoverContentClass = css({
  display: 'grid',
  gap: '3',
  minWidth: '[16rem]',
});

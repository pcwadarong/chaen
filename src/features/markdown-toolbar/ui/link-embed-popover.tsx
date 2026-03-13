'use client';

import React, { useState } from 'react';
import { css } from 'styled-system/css';

import { Button } from '@/shared/ui/button/button';
import { LinkIcon } from '@/shared/ui/icons/app-icons';
import { Input } from '@/shared/ui/input/input';
import { type ClosePopover, Popover } from '@/shared/ui/popover/popover';

type LinkEmbedMode = 'card' | 'link' | 'preview';

type LinkEmbedPopoverProps = {
  onApply: (url: string, mode: LinkEmbedMode, closePopover?: ClosePopover) => void;
  onTriggerMouseDown?: React.MouseEventHandler<HTMLButtonElement>;
  triggerClassName?: string;
};

/**
 * 관리자 에디터에서 사용하는 링크 삽입 팝오버 UI
 */
export const LinkEmbedPopover = ({
  onApply,
  onTriggerMouseDown,
  triggerClassName,
}: LinkEmbedPopoverProps) => {
  const [linkInput, setLinkInput] = useState('');

  const handleApply = (mode: LinkEmbedMode, closePopover?: ClosePopover) => {
    const normalizedInput = linkInput.trim();

    if (!normalizedInput) return;

    onApply(normalizedInput, mode, closePopover);
    setLinkInput('');
  };

  return (
    <Popover
      onTriggerMouseDown={onTriggerMouseDown}
      panelLabel="링크 삽입"
      portalPlacement="start"
      renderInPortal
      triggerAriaLabel="링크 임베드"
      triggerClassName={triggerClassName}
      triggerContent={<LinkIcon aria-hidden color="text" size="sm" />}
      triggerTooltip="링크 임베드"
    >
      {({ closePopover }) => (
        <div className={popoverContentClass}>
          <Input
            aria-label="링크 URL"
            onChange={event => setLinkInput(event.target.value)}
            onMouseDown={event => event.stopPropagation()}
            placeholder="https://example.com"
            type="url"
            value={linkInput}
          />
          <div className={linkModeGridClass}>
            <Button onClick={() => handleApply('preview', closePopover)}>제목 링크</Button>
            <Button onClick={() => handleApply('link', closePopover)}>하이퍼링크</Button>
            <Button onClick={() => handleApply('card', closePopover)}>OG 카드</Button>
          </div>
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

const linkModeGridClass = css({
  display: 'flex',
  gap: '2',
  flexWrap: 'wrap',
});

'use client';

import React, { useState } from 'react';
import { css } from 'styled-system/css';

import { normalizeEmbedInput } from '@/features/edit-markdown/model/embed-popover-state';
import { Button } from '@/shared/ui/button/button';
import { LinkIcon } from '@/shared/ui/icons/app-icons';
import { Input } from '@/shared/ui/input/input';
import { type ClosePopover, Popover } from '@/shared/ui/popover/popover';

type LinkEmbedMode = 'card' | 'link' | 'preview';
export type LinkEmbedPopoverLabels = {
  cardButtonLabel: string;
  panelLabel: string;
  previewButtonLabel: string;
  triggerAriaLabel: string;
  triggerTooltip: string;
  urlInputAriaLabel: string;
  urlPlaceholder: string;
  hyperlinkButtonLabel: string;
};

type LinkEmbedPopoverProps = {
  labels?: Partial<LinkEmbedPopoverLabels>;
  onApply: (url: string, mode: LinkEmbedMode, closePopover?: ClosePopover) => void;
  onTriggerMouseDown?: React.MouseEventHandler<HTMLButtonElement>;
  triggerClassName?: string;
};

/**
 * 관리자 에디터에서 사용하는 링크 삽입 팝오버 UI
 */
export const LinkEmbedPopover = ({
  labels,
  onApply,
  onTriggerMouseDown,
  triggerClassName,
}: LinkEmbedPopoverProps) => {
  const [linkInput, setLinkInput] = useState('');
  const resolvedLabels: LinkEmbedPopoverLabels = {
    cardButtonLabel: labels?.cardButtonLabel ?? 'OG 카드',
    panelLabel: labels?.panelLabel ?? '링크 삽입',
    previewButtonLabel: labels?.previewButtonLabel ?? '제목 링크',
    triggerAriaLabel: labels?.triggerAriaLabel ?? '링크 임베드',
    triggerTooltip: labels?.triggerTooltip ?? '링크 임베드',
    urlInputAriaLabel: labels?.urlInputAriaLabel ?? '링크 URL',
    urlPlaceholder: labels?.urlPlaceholder ?? 'https://example.com',
    hyperlinkButtonLabel: labels?.hyperlinkButtonLabel ?? '하이퍼링크',
  };

  const handleApply = (mode: LinkEmbedMode, closePopover?: ClosePopover) => {
    const normalizedInput = normalizeEmbedInput(linkInput);

    if (!normalizedInput) return;

    onApply(normalizedInput, mode, closePopover);
    setLinkInput('');
  };

  return (
    <Popover
      onTriggerMouseDown={onTriggerMouseDown}
      panelLabel={resolvedLabels.panelLabel}
      portalPlacement="start"
      renderInPortal
      triggerAriaLabel={resolvedLabels.triggerAriaLabel}
      triggerClassName={triggerClassName}
      triggerContent={<LinkIcon aria-hidden color="text" size="sm" />}
      triggerTooltip={resolvedLabels.triggerTooltip}
    >
      {({ closePopover }) => (
        <div className={popoverContentClass}>
          <Input
            aria-label={resolvedLabels.urlInputAriaLabel}
            onChange={event => setLinkInput(event.target.value)}
            onMouseDown={event => event.stopPropagation()}
            placeholder={resolvedLabels.urlPlaceholder}
            type="url"
            value={linkInput}
          />
          <div className={linkModeGridClass}>
            <Button onClick={() => handleApply('preview', closePopover)}>
              {resolvedLabels.previewButtonLabel}
            </Button>
            <Button onClick={() => handleApply('link', closePopover)}>
              {resolvedLabels.hyperlinkButtonLabel}
            </Button>
            <Button onClick={() => handleApply('card', closePopover)}>
              {resolvedLabels.cardButtonLabel}
            </Button>
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

'use client';

import React, { useState } from 'react';
import { css } from 'styled-system/css';

import { extractYoutubeId } from '@/features/edit-markdown/model/markdown-toolbar-templates';
import { Button } from '@/shared/ui/button/button';
import { YoutubeIcon } from '@/shared/ui/icons/app-icons';
import { Input } from '@/shared/ui/input/input';
import { type ClosePopover, Popover } from '@/shared/ui/popover/popover';

type YoutubeEmbedPopoverProps = {
  onApply: (videoId: string, closePopover?: ClosePopover) => void;
  onTriggerMouseDown?: React.MouseEventHandler<HTMLButtonElement>;
  triggerClassName?: string;
};

/**
 * toolbar 내부 YouTube 삽입 팝오버입니다.
 * URL 입력을 로컬 상태로 관리하고 유효한 id만 상위 액션에 전달합니다.
 */
export const YoutubeEmbedPopover = ({
  onApply,
  onTriggerMouseDown,
  triggerClassName,
}: YoutubeEmbedPopoverProps) => {
  const [youtubeInput, setYoutubeInput] = useState('');

  const handleApply = (closePopover?: ClosePopover) => {
    const videoId = extractYoutubeId(youtubeInput);

    if (!videoId) return;

    onApply(videoId, closePopover);
    setYoutubeInput('');
  };

  return (
    <Popover
      onTriggerMouseDown={onTriggerMouseDown}
      panelLabel="YouTube 삽입"
      portalPlacement="start"
      renderInPortal
      triggerAriaLabel="유튜브"
      triggerClassName={triggerClassName}
      triggerContent={<YoutubeIcon aria-hidden color="text" size="sm" />}
      triggerTooltip="유튜브"
    >
      {({ closePopover }) => (
        <div className={popoverContentClass}>
          <Input
            aria-label="YouTube URL"
            onChange={event => setYoutubeInput(event.target.value)}
            onMouseDown={event => event.stopPropagation()}
            placeholder="https://youtube.com/watch?v=..."
            type="url"
            value={youtubeInput}
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

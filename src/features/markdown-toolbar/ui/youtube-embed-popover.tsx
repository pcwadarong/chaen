'use client';

import React, { useState } from 'react';
import { css } from 'styled-system/css';

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
 * pathname에서 첫 번째 비어 있지 않은 segment를 읽습니다.
 */
const getFirstPathSegment = (pathname: string) =>
  pathname.split('/').find(segment => segment.length > 0) ?? null;

/**
 * 다양한 YouTube URL 형태에서 video id를 추출합니다.
 */
const extractYoutubeId = (value: string) => {
  const trimmedValue = value.trim();

  if (!trimmedValue) return null;

  try {
    const url = new URL(trimmedValue);
    const isYoutubeDomain = url.hostname === 'youtube.com' || url.hostname.endsWith('.youtube.com');

    if (url.hostname === 'youtu.be') {
      return getFirstPathSegment(url.pathname);
    }

    if (isYoutubeDomain) {
      if (url.pathname === '/watch') {
        return url.searchParams.get('v');
      }

      const [, firstSegment, secondSegment] = url.pathname.split('/');

      if (firstSegment === 'shorts' && secondSegment) {
        return secondSegment;
      }

      if (firstSegment === 'embed' && secondSegment) {
        return secondSegment;
      }
    }
  } catch {
    return null;
  }

  return null;
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

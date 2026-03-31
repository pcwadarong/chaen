import React from 'react';
import { css } from 'styled-system/css';

type MarkdownVideoProps = {
  provider: 'youtube';
  videoId: string;
};

/**
 * markdown 커스텀 video 구문을 iframe 기반 영상 블록으로 렌더링합니다.
 * 현재는 YouTube provider만 지원하며, provider 분기 지점을 이 컴포넌트로 고정합니다.
 *
 * @param props 영상 provider와 video id입니다.
 * @returns provider에 맞는 iframe video block을 반환합니다.
 */
export const MarkdownVideo = ({ provider, videoId }: MarkdownVideoProps) => {
  if (provider !== 'youtube') return null;

  return (
    <div className={videoFrameClass}>
      <iframe
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
        className={videoIframeClass}
        referrerPolicy="strict-origin-when-cross-origin"
        src={`https://www.youtube.com/embed/${videoId}`}
        title="YouTube video player"
      />
    </div>
  );
};

const videoFrameClass = css({
  position: 'relative',
  width: 'full',
  overflow: 'hidden',
  borderRadius: 'xl',
  border: '[1px solid var(--colors-border)]',
  background: 'surfaceMuted',
  pt: '[56.25%]',
});

const videoIframeClass = css({
  position: 'absolute',
  inset: '0',
  width: 'full',
  height: 'full',
  border: '[0]',
});

import React from 'react';
import { css } from 'styled-system/css';

type MarkdownVideoProps = {
  provider: 'upload' | 'youtube';
  src?: string;
  videoId?: string;
};

const YOUTUBE_VIDEO_ID_PATTERN = /^[A-Za-z0-9_-]{11}$/;

/**
 * markdown 커스텀 video 구문을 provider별 영상 블록으로 렌더링합니다.
 * 현재는 `youtube`, `upload` provider를 지원하며, renderer 분기 지점을 이 컴포넌트로 고정합니다.
 *
 * @param props 영상 provider와 provider별 식별값입니다. `youtube`는 `videoId`, `upload`는 공개 `src`를 사용합니다.
 * @returns provider에 맞는 iframe 또는 업로드 video block을 반환합니다.
 */
export const MarkdownVideo = ({ provider, src, videoId }: MarkdownVideoProps) => {
  if (provider === 'upload' && src) {
    return (
      <div className={videoFrameClass}>
        <video className={videoElementClass} controls preload="metadata" src={src} />
      </div>
    );
  }

  if (provider !== 'youtube' || !videoId || !YOUTUBE_VIDEO_ID_PATTERN.test(videoId)) return null;

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

const videoElementClass = css({
  position: 'absolute',
  inset: '0',
  width: 'full',
  height: 'full',
  objectFit: 'contain',
  background: 'black',
});

'use client';

import { useTranslations } from 'next-intl';
import React from 'react';
import { css } from 'styled-system/css';

import { useBassAudio } from '@/features/audio/model/use-bass-audio';
import { Button } from '@/shared/ui/button/button';
import { srOnlyClass } from '@/shared/ui/styles/sr-only-style';

const AUDIO_PREPARE_KEYBOARD_KEYS = new Set(['Enter', ' ']);

/**
 * 현재 background music 재생 상태를 dash 또는 wave 아이콘으로 표현합니다.
 */
const MusicPlaybackIndicator = ({ isPlaying }: { readonly isPlaying: boolean }) => (
  <svg
    aria-hidden="true"
    height="18"
    viewBox="0 0 24 24"
    width="18"
    xmlns="http://www.w3.org/2000/svg"
  >
    {isPlaying ? (
      <>
        <g>
          <animateTransform
            attributeName="transform"
            dur="1.15s"
            repeatCount="indefinite"
            type="translate"
            values="0 0; 0 -0.8; 0 0.7; 0 0"
          />
          <path
            d="M4 12C6 12 6.5 7 9 7C11.5 7 12.5 17 15 17C17 17 17.5 12 20 12"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2.2"
          />
        </g>
        <g opacity="0.34">
          <animateTransform
            attributeName="transform"
            dur="1.15s"
            repeatCount="indefinite"
            type="translate"
            values="0 0; 0 0.65; 0 -0.55; 0 0"
          />
          <path
            d="M4 12C6 12 6.5 8.5 9 8.5C11.5 8.5 12.5 15.5 15 15.5C17 15.5 17.5 12 20 12"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
          />
        </g>
      </>
    ) : (
      <path
        d="M6 12H18"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2.4"
      />
    )}
  </svg>
);

/**
 * 전역 네비게이션에서 background music 재생/일시정지를 제어하는 버튼입니다.
 */
export const MusicToggleButton = () => {
  const t = useTranslations('Navigation');
  const { isBackgroundMusicPlaying, prepareBassAudioPlayback, toggleBackgroundMusicPlayback } =
    useBassAudio();
  const handlePrepareAudioPlaybackByKeyboard = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (!AUDIO_PREPARE_KEYBOARD_KEYS.has(event.key)) return;

    prepareBassAudioPlayback();
  };

  return (
    <Button
      aria-label={isBackgroundMusicPlaying ? t('pauseMusic') : t('playMusic')}
      aria-pressed={isBackgroundMusicPlaying}
      className={buttonClass}
      onClick={() => {
        void toggleBackgroundMusicPlayback();
      }}
      onKeyDown={handlePrepareAudioPlaybackByKeyboard}
      onPointerDownCapture={prepareBassAudioPlayback}
      size="sm"
      tone="white"
      type="button"
      variant="ghost"
    >
      <MusicPlaybackIndicator isPlaying={isBackgroundMusicPlaying} />
      <span className={srOnlyClass}>
        {isBackgroundMusicPlaying ? t('pauseMusic') : t('playMusic')}
      </span>
    </Button>
  );
};

const buttonClass = css({
  width: '[2.5rem]',
  minWidth: '[2.5rem]',
  minHeight: '[2.5rem]',
  padding: '0',
  borderRadius: 'full',
  borderColor: '[color-mix(in srgb, var(--colors-border) 74%, transparent)]',
  backgroundColor: '[color-mix(in srgb, var(--colors-surface) 92%, transparent)]',
  _hover: {
    color: 'primary',
  },
  _focusVisible: {
    color: 'primary',
  },
  '&[aria-pressed="true"]': {
    color: 'primary',
  },
});

/* @vitest-environment jsdom */

import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';

import { MusicToggleButton } from '@/widgets/global-nav/ui/music-toggle-button';

import '@testing-library/jest-dom/vitest';

const bassAudioMockState = vi.hoisted(() => ({
  isBackgroundMusicPlaying: false,
  prepareBassAudioPlayback: vi.fn(),
  toggleBackgroundMusicPlayback: vi.fn(),
}));

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => `Navigation.${key}`,
}));

vi.mock('@/features/audio/model/use-bass-audio', () => ({
  useBassAudio: () => bassAudioMockState,
}));

describe('MusicToggleButton', () => {
  beforeEach(() => {
    bassAudioMockState.isBackgroundMusicPlaying = false;
    bassAudioMockState.prepareBassAudioPlayback.mockReset();
    bassAudioMockState.toggleBackgroundMusicPlayback.mockReset();
  });

  it('멈춤 상태에서는 재생 aria-label과 dash 아이콘 상태를 노출해야 한다', () => {
    render(<MusicToggleButton />);

    expect(screen.getByRole('button', { name: 'Navigation.playMusic' })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
  });

  it('재생 상태에서는 일시정지 aria-label로 바뀌고 토글 콜백을 호출해야 한다', () => {
    bassAudioMockState.isBackgroundMusicPlaying = true;

    render(<MusicToggleButton />);

    const button = screen.getByRole('button', { name: 'Navigation.pauseMusic' });
    fireEvent.click(button);

    expect(button).toHaveAttribute('aria-pressed', 'true');
    expect(bassAudioMockState.toggleBackgroundMusicPlayback).toHaveBeenCalledOnce();
  });

  it('버튼을 누르기 시작할 때, MusicToggleButton은 오디오 prewarm을 먼저 호출해야 한다', () => {
    render(<MusicToggleButton />);

    const button = screen.getByRole('button', { name: 'Navigation.playMusic' });
    fireEvent.pointerDown(button);

    expect(bassAudioMockState.prepareBassAudioPlayback).toHaveBeenCalledOnce();
  });

  it('Enter 키로 버튼을 활성화할 때, MusicToggleButton은 오디오 prewarm을 먼저 호출해야 한다', () => {
    render(<MusicToggleButton />);

    const button = screen.getByRole('button', { name: 'Navigation.playMusic' });
    fireEvent.keyDown(button, { key: 'Enter' });

    expect(bassAudioMockState.prepareBassAudioPlayback).toHaveBeenCalledOnce();
  });
});

'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

export const BASS_STRING_AUDIO_PATHS = {
  line1: '/music/bass_e.mp3',
  line2: '/music/bass_a.mp3',
  line3: '/music/bass_d.mp3',
  line4: '/music/bass_g.mp3',
} as const;

const BASS_TRACK_AUDIO_PATH = '/music/music.mp3';

type BassStringName = keyof typeof BASS_STRING_AUDIO_PATHS;

/**
 * 홈 히어로 bass 오브젝트에 연결되는 메인 트랙/줄 샘플 오디오를 관리합니다.
 * 메인 트랙은 토글 재생으로, 각 줄 샘플은 개별 원샷 재생으로 유지합니다.
 */
export const useBassAudio = (): {
  isBassTrackPlaying: boolean;
  playBassString: (stringName: BassStringName) => Promise<void>;
  stopBassTrackPlayback: () => void;
  toggleBassTrackPlayback: () => Promise<void>;
} => {
  const bassTrackAudioRef = useRef<HTMLAudioElement | null>(null);
  const bassStringAudioRefs = useRef<Partial<Record<BassStringName, HTMLAudioElement>>>({});
  const [isBassTrackPlaying, setIsBassTrackPlaying] = useState(false);

  /**
   * 메인 bass 트랙이 자연 종료되면 UI 상태를 정지 상태로 되돌립니다.
   */
  const handleBassTrackEnded = useCallback(() => {
    setIsBassTrackPlaying(false);
  }, []);

  /**
   * 메인 bass 트랙 오디오 엘리먼트를 지연 생성하고 ended 이벤트를 연결합니다.
   */
  const getBassTrackAudio = useCallback(() => {
    if (bassTrackAudioRef.current) return bassTrackAudioRef.current;

    const nextAudio = createAudioElement(BASS_TRACK_AUDIO_PATH);
    nextAudio.addEventListener('ended', handleBassTrackEnded);
    bassTrackAudioRef.current = nextAudio;

    return nextAudio;
  }, [handleBassTrackEnded]);

  /**
   * 줄 이름에 해당하는 원샷 오디오 엘리먼트를 지연 생성해 재사용합니다.
   */
  const getBassStringAudio = useCallback((stringName: BassStringName) => {
    const currentAudio = bassStringAudioRefs.current[stringName];

    if (currentAudio) return currentAudio;

    const nextAudio = createAudioElement(BASS_STRING_AUDIO_PATHS[stringName]);
    bassStringAudioRefs.current[stringName] = nextAudio;

    return nextAudio;
  }, []);

  /**
   * 메인 bass 트랙을 처음부터 재생하거나, 이미 재생 중이면 완전히 정지합니다.
   */
  const toggleBassTrackPlayback = useCallback(async () => {
    const bassTrackAudio = getBassTrackAudio();

    if (!bassTrackAudio.paused) {
      stopAudioPlayback(bassTrackAudio);
      setIsBassTrackPlaying(false);
      return;
    }

    const didStartPlayback = await playAudioFromStart(bassTrackAudio);
    setIsBassTrackPlaying(didStartPlayback);
  }, [getBassTrackAudio]);

  /**
   * 현재 재생 중인 메인 bass 트랙을 즉시 정지하고 처음 위치로 되돌립니다.
   */
  const stopBassTrackPlayback = useCallback(() => {
    if (!bassTrackAudioRef.current) return;

    stopAudioPlayback(bassTrackAudioRef.current);
    setIsBassTrackPlaying(false);
  }, []);

  /**
   * 지정한 bass 줄 원샷을 항상 처음부터 다시 재생합니다.
   */
  const playBassString = useCallback(
    async (stringName: BassStringName) => {
      const bassStringAudio = getBassStringAudio(stringName);

      await playAudioFromStart(bassStringAudio);
    },
    [getBassStringAudio],
  );

  useEffect(
    () => () => {
      if (bassTrackAudioRef.current) {
        bassTrackAudioRef.current.removeEventListener('ended', handleBassTrackEnded);
        stopAudioPlayback(bassTrackAudioRef.current);
      }

      Object.values(bassStringAudioRefs.current).forEach(audio => {
        if (!audio) return;

        stopAudioPlayback(audio);
      });
    },
    [handleBassTrackEnded],
  );

  return {
    isBassTrackPlaying,
    playBassString,
    stopBassTrackPlayback,
    toggleBassTrackPlayback,
  };
};

/**
 * 경로 기반 HTMLAudioElement를 생성하고 공통 preload 정책을 적용합니다.
 */
const createAudioElement = (src: string): HTMLAudioElement => {
  const audioElement = new Audio(src);
  audioElement.preload = 'auto';

  return audioElement;
};

/**
 * 오디오를 정지하고 재생 위치를 처음으로 되돌립니다.
 */
const stopAudioPlayback = (audioElement: HTMLAudioElement): void => {
  if (!audioElement.paused) {
    audioElement.pause();
  }

  audioElement.currentTime = 0;
};

/**
 * 오디오를 항상 처음 위치에서 다시 재생하고, 재생 성공 여부를 반환합니다.
 * 브라우저 정책이나 로드 상태로 실패할 수 있으므로 예외는 내부에서 삼킵니다.
 */
const playAudioFromStart = async (audioElement: HTMLAudioElement): Promise<boolean> => {
  stopAudioPlayback(audioElement);

  try {
    await audioElement.play();
    return true;
  } catch {
    return false;
  }
};

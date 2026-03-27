'use client';

import { useSyncExternalStore } from 'react';

export const BASS_STRING_AUDIO_PATHS = {
  line1: '/music/bass_e.mp3',
  line2: '/music/bass_a.mp3',
  line3: '/music/bass_d.mp3',
  line4: '/music/bass_g.mp3',
} as const;

const BACKGROUND_MUSIC_AUDIO_PATH = '/music/music.mp3';

type BassStringName = keyof typeof BASS_STRING_AUDIO_PATHS;

type BassAudioSnapshot = {
  readonly isBackgroundMusicPlaying: boolean;
};

const bassAudioStore = {
  backgroundMusicAudio: null as HTMLAudioElement | null,
  bassStringAudios: {} as Partial<Record<BassStringName, HTMLAudioElement>>,
  listeners: new Set<() => void>(),
  snapshot: {
    isBackgroundMusicPlaying: false,
  } as BassAudioSnapshot,
};

/**
 * background music 재생 상태를 외부 구독자에게 전파합니다.
 */
const emitBassAudioStore = () => {
  bassAudioStore.listeners.forEach(listener => {
    listener();
  });
};

/**
 * background music 재생 상태가 실제로 바뀐 경우에만 스냅샷을 갱신합니다.
 */
const setBackgroundMusicPlaying = (isBackgroundMusicPlaying: boolean) => {
  if (bassAudioStore.snapshot.isBackgroundMusicPlaying === isBackgroundMusicPlaying) return;

  bassAudioStore.snapshot = {
    isBackgroundMusicPlaying,
  };
  emitBassAudioStore();
};

/**
 * 외부 컴포넌트가 bass audio store 상태를 구독할 수 있도록 연결합니다.
 */
const subscribeBassAudioStore = (listener: () => void) => {
  bassAudioStore.listeners.add(listener);

  return () => {
    bassAudioStore.listeners.delete(listener);
  };
};

/**
 * 현재 bass audio store 상태 스냅샷을 반환합니다.
 */
const getBassAudioSnapshot = () => bassAudioStore.snapshot;

/**
 * background music `play` 이벤트가 발생하면 재생 상태를 동기화합니다.
 */
function handleBackgroundMusicPlay() {
  setBackgroundMusicPlaying(true);
}

/**
 * background music `pause` 이벤트가 발생하면 재생 상태를 동기화합니다.
 */
function handleBackgroundMusicPause() {
  setBackgroundMusicPlaying(false);
}

/**
 * 메인 background music 오디오를 지연 생성하고 공통 이벤트를 연결합니다.
 */
const getBackgroundMusicAudio = () => {
  if (bassAudioStore.backgroundMusicAudio) return bassAudioStore.backgroundMusicAudio;

  const audioElement = createAudioElement(BACKGROUND_MUSIC_AUDIO_PATH);
  audioElement.loop = true;
  audioElement.addEventListener('pause', handleBackgroundMusicPause);
  audioElement.addEventListener('play', handleBackgroundMusicPlay);
  bassAudioStore.backgroundMusicAudio = audioElement;

  return audioElement;
};

/**
 * 지정한 bass 줄 원샷 오디오를 지연 생성해 재사용합니다.
 */
const getBassStringAudio = (stringName: BassStringName) => {
  const currentAudio = bassAudioStore.bassStringAudios[stringName];

  if (currentAudio) return currentAudio;

  const audioElement = createAudioElement(BASS_STRING_AUDIO_PATHS[stringName]);
  bassAudioStore.bassStringAudios[stringName] = audioElement;

  return audioElement;
};

/**
 * music과 bass string 샘플을 공유 store 기반으로 제어합니다.
 * 메인 트랙은 loop 배경음으로, 줄 샘플은 개별 원샷으로 유지합니다.
 */
export const useBassAudio = (): {
  isBackgroundMusicPlaying: boolean;
  pauseBackgroundMusicPlayback: () => void;
  playBassString: (stringName: BassStringName) => Promise<void>;
  toggleBackgroundMusicPlayback: () => Promise<void>;
  triggerBackgroundMusicPlayback: () => Promise<void>;
} => {
  const snapshot = useSyncExternalStore(
    subscribeBassAudioStore,
    getBassAudioSnapshot,
    getBassAudioSnapshot,
  );

  return {
    isBackgroundMusicPlaying: snapshot.isBackgroundMusicPlaying,
    pauseBackgroundMusicPlayback,
    playBassString,
    toggleBackgroundMusicPlayback,
    triggerBackgroundMusicPlayback,
  };
};

/**
 * bass body 같은 트리거에서 호출하는 진입점입니다.
 * 이미 재생 중이면 상태를 건드리지 않고, 멈춰 있으면 loop background music을 시작합니다.
 */
const triggerBackgroundMusicPlayback = async () => {
  const backgroundMusicAudio = getBackgroundMusicAudio();

  if (!backgroundMusicAudio.paused) return;

  await playAudio(backgroundMusicAudio);
};

/**
 * nav 버튼에서 사용하는 메인 background music 토글입니다.
 * 재생 중이면 일시정지하고, 멈춰 있으면 현재 위치에서 다시 재생합니다.
 */
const toggleBackgroundMusicPlayback = async () => {
  const backgroundMusicAudio = getBackgroundMusicAudio();

  if (!backgroundMusicAudio.paused) {
    backgroundMusicAudio.pause();
    return;
  }

  await playAudio(backgroundMusicAudio);
};

/**
 * 메인 background music을 일시정지 상태로 전환합니다.
 */
const pauseBackgroundMusicPlayback = () => {
  const backgroundMusicAudio = bassAudioStore.backgroundMusicAudio;

  if (!backgroundMusicAudio || backgroundMusicAudio.paused) return;

  backgroundMusicAudio.pause();
};

/**
 * 지정한 bass 줄 원샷을 항상 처음부터 다시 재생합니다.
 */
const playBassString = async (stringName: BassStringName) => {
  const bassStringAudio = getBassStringAudio(stringName);

  await playAudioFromStart(bassStringAudio);
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
 * 현재 위치에서 오디오 재생을 시도하고, 성공 여부를 반환합니다.
 */
const playAudio = async (audioElement: HTMLAudioElement): Promise<boolean> => {
  try {
    await audioElement.play();
    return true;
  } catch {
    setBackgroundMusicPlaying(false);
    return false;
  }
};

/**
 * 오디오를 항상 처음 위치에서 다시 재생하고, 재생 성공 여부를 반환합니다.
 */
const playAudioFromStart = async (audioElement: HTMLAudioElement): Promise<boolean> => {
  stopAudioPlayback(audioElement);

  return playAudio(audioElement);
};

/**
 * 테스트에서 singleton store를 초기화합니다.
 */
export const __resetBassAudioStoreForTest = () => {
  const backgroundMusicAudio = bassAudioStore.backgroundMusicAudio;

  if (backgroundMusicAudio) {
    backgroundMusicAudio.removeEventListener('pause', handleBackgroundMusicPause);
    backgroundMusicAudio.removeEventListener('play', handleBackgroundMusicPlay);
    stopAudioPlayback(backgroundMusicAudio);
  }

  Object.values(bassAudioStore.bassStringAudios).forEach(audioElement => {
    if (!audioElement) return;

    stopAudioPlayback(audioElement);
  });

  bassAudioStore.backgroundMusicAudio = null;
  bassAudioStore.bassStringAudios = {};
  bassAudioStore.snapshot = {
    isBackgroundMusicPlaying: false,
  };
  bassAudioStore.listeners.clear();
};

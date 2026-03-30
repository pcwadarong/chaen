/* @vitest-environment jsdom */

import { act, renderHook } from '@testing-library/react';

import {
  __resetBassAudioStoreForTest,
  BASS_STRING_AUDIO_PATHS,
  useBassAudio,
} from '@/features/audio/model/use-bass-audio';

type AudioEventType = 'pause' | 'play';

type FakeAudioElement = {
  currentTime: number;
  dispatch: (type: AudioEventType) => void;
  load: ReturnType<typeof vi.fn>;
  loop: boolean;
  pause: ReturnType<typeof vi.fn>;
  paused: boolean;
  play: ReturnType<typeof vi.fn>;
  preload: string;
  src: string;
};

const audioMockState = vi.hoisted(() => ({
  createdAudios: [] as FakeAudioElement[],
}));

/**
 * 테스트에서 사용할 오디오 엘리먼트를 생성합니다.
 */
const createFakeAudioElement = (src: string): FakeAudioElement => {
  const listeners = new Map<AudioEventType, Set<() => void>>();

  const audioElement: FakeAudioElement = {
    currentTime: 0,
    dispatch: type => {
      listeners.get(type)?.forEach(listener => {
        listener();
      });
    },
    load: vi.fn(),
    loop: false,
    pause: vi.fn(() => {
      audioElement.paused = true;
      audioElement.dispatch('pause');
    }),
    paused: true,
    play: vi.fn(async () => {
      audioElement.paused = false;
      audioElement.dispatch('play');
    }),
    preload: 'auto',
    src,
  };

  Object.assign(audioElement, {
    addEventListener: (type: AudioEventType, listener: () => void) => {
      const eventListeners = listeners.get(type) ?? new Set();
      eventListeners.add(listener);
      listeners.set(type, eventListeners);
    },
    removeEventListener: (type: AudioEventType, listener: () => void) => {
      listeners.get(type)?.delete(listener);
    },
  });

  return audioElement;
};

describe('useBassAudio', () => {
  beforeEach(() => {
    __resetBassAudioStoreForTest();
    audioMockState.createdAudios = [];
    vi.stubGlobal(
      'Audio',
      vi.fn((src: string) => {
        const audioElement = createFakeAudioElement(src);
        audioMockState.createdAudios.push(audioElement);

        return audioElement;
      }),
    );
  });

  afterEach(() => {
    __resetBassAudioStoreForTest();
    vi.unstubAllGlobals();
  });

  it('background music 재생을 시작하면 music.mp3를 loop 상태로 재생해야 한다', async () => {
    const { result } = renderHook(() => useBassAudio());

    await act(async () => {
      await result.current.triggerBackgroundMusicPlayback();
    });

    expect(audioMockState.createdAudios).toHaveLength(1);
    expect(audioMockState.createdAudios[0]?.src).toBe('/music/music.mp3');
    expect(audioMockState.createdAudios[0]?.loop).toBe(true);
    expect(audioMockState.createdAudios[0]?.play).toHaveBeenCalledOnce();
    expect(result.current.isBackgroundMusicPlaying).toBe(true);
  });

  it('첫 사용자 입력 전에 prepareBassAudioPlayback을 호출하면 모든 관리 오디오를 미리 생성하고 load를 호출해야 한다', () => {
    const { result } = renderHook(() => useBassAudio());

    act(() => {
      result.current.prepareBassAudioPlayback();
    });

    expect(audioMockState.createdAudios).toHaveLength(5);
    expect(audioMockState.createdAudios.map(audioElement => audioElement.src)).toEqual([
      '/music/music.mp3',
      BASS_STRING_AUDIO_PATHS.line1,
      BASS_STRING_AUDIO_PATHS.line2,
      BASS_STRING_AUDIO_PATHS.line3,
      BASS_STRING_AUDIO_PATHS.line4,
    ]);
    expect(
      audioMockState.createdAudios.every(audioElement => audioElement.load.mock.calls.length === 1),
    ).toBe(true);
  });

  it('이미 재생 중일 때 bass trigger를 다시 호출해도 background music을 다시 재생하지 않아야 한다', async () => {
    const { result } = renderHook(() => useBassAudio());

    await act(async () => {
      await result.current.triggerBackgroundMusicPlayback();
      await result.current.triggerBackgroundMusicPlayback();
    });

    expect(audioMockState.createdAudios[0]?.play).toHaveBeenCalledTimes(1);
  });

  it('재생 중인 background music을 다시 토글하면 현재 위치를 유지한 채 일시정지해야 한다', async () => {
    const { result } = renderHook(() => useBassAudio());

    await act(async () => {
      await result.current.triggerBackgroundMusicPlayback();
    });

    const musicAudioElement = audioMockState.createdAudios[0];

    if (!musicAudioElement) {
      throw new Error('music audio element must exist');
    }

    musicAudioElement.currentTime = 12;

    await act(async () => {
      await result.current.toggleBackgroundMusicPlayback();
    });

    expect(musicAudioElement.pause).toHaveBeenCalledOnce();
    expect(musicAudioElement.currentTime).toBe(12);
    expect(result.current.isBackgroundMusicPlaying).toBe(false);
  });

  it('멈춘 background music을 토글하면 현재 위치에서 다시 재생해야 한다', async () => {
    const { result } = renderHook(() => useBassAudio());

    await act(async () => {
      await result.current.triggerBackgroundMusicPlayback();
      await result.current.toggleBackgroundMusicPlayback();
    });

    const musicAudioElement = audioMockState.createdAudios[0];

    if (!musicAudioElement) {
      throw new Error('music audio element must exist');
    }

    musicAudioElement.currentTime = 18;

    await act(async () => {
      await result.current.toggleBackgroundMusicPlayback();
    });

    expect(musicAudioElement.play).toHaveBeenCalledTimes(2);
    expect(musicAudioElement.currentTime).toBe(18);
    expect(result.current.isBackgroundMusicPlaying).toBe(true);
  });

  it('line2를 재생하면 해당 줄 오디오 파일을 처음부터 다시 재생해야 한다', async () => {
    const { result } = renderHook(() => useBassAudio());

    await act(async () => {
      await result.current.playBassString('line2');
    });

    const stringAudioElement = audioMockState.createdAudios[0];

    if (!stringAudioElement) {
      throw new Error('bass string audio element must exist');
    }

    stringAudioElement.currentTime = 3;

    await act(async () => {
      await result.current.playBassString('line2');
    });

    expect(stringAudioElement.src).toBe(BASS_STRING_AUDIO_PATHS.line2);
    expect(stringAudioElement.pause).toHaveBeenCalledTimes(1);
    expect(stringAudioElement.play).toHaveBeenCalledTimes(2);
    expect(stringAudioElement.currentTime).toBe(0);
  });

  it('bass string 원샷 재생이 실패해도 이미 재생 중인 background music 상태는 false로 바뀌지 않아야 한다', async () => {
    vi.stubGlobal(
      'Audio',
      vi.fn((src: string) => {
        const audioElement = createFakeAudioElement(src);

        if (src === BASS_STRING_AUDIO_PATHS.line1) {
          audioElement.play = vi.fn(async () => {
            throw new Error('decode failure');
          });
        }

        audioMockState.createdAudios.push(audioElement);

        return audioElement;
      }),
    );

    const { result } = renderHook(() => useBassAudio());

    await act(async () => {
      await result.current.triggerBackgroundMusicPlayback();
    });

    expect(result.current.isBackgroundMusicPlaying).toBe(true);

    await act(async () => {
      await result.current.playBassString('line1');
    });

    expect(result.current.isBackgroundMusicPlaying).toBe(true);
  });

  it('서로 다른 훅 인스턴스는 같은 background music 재생 상태를 공유해야 한다', async () => {
    const firstHook = renderHook(() => useBassAudio());
    const secondHook = renderHook(() => useBassAudio());

    await act(async () => {
      await firstHook.result.current.triggerBackgroundMusicPlayback();
    });

    expect(secondHook.result.current.isBackgroundMusicPlaying).toBe(true);
  });
});

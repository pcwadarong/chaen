/* @vitest-environment jsdom */

import { act, renderHook } from '@testing-library/react';

import { BASS_STRING_AUDIO_PATHS, useBassAudio } from '@/features/audio/model/use-bass-audio';

type AudioEventType = 'ended';

type FakeAudioElement = {
  currentTime: number;
  dispatch: (type: AudioEventType) => void;
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
    loop: false,
    pause: vi.fn(() => {
      audioElement.paused = true;
    }),
    paused: true,
    play: vi.fn(async () => {
      audioElement.paused = false;
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
    vi.unstubAllGlobals();
  });

  it('메인 bass 트랙 토글을 시작하면 music.mp3를 처음부터 재생 상태로 전환해야 한다', async () => {
    const { result } = renderHook(() => useBassAudio());

    await act(async () => {
      await result.current.toggleBassTrackPlayback();
    });

    expect(audioMockState.createdAudios).toHaveLength(1);
    expect(audioMockState.createdAudios[0]?.src).toBe('/music/music.mp3');
    expect(audioMockState.createdAudios[0]?.play).toHaveBeenCalledOnce();
    expect(result.current.isBassTrackPlaying).toBe(true);
  });

  it('재생 중인 메인 bass 트랙을 다시 토글하면 정지하고 재생 위치를 0으로 되돌려야 한다', async () => {
    const { result } = renderHook(() => useBassAudio());

    await act(async () => {
      await result.current.toggleBassTrackPlayback();
    });

    const musicAudioElement = audioMockState.createdAudios[0];

    if (!musicAudioElement) {
      throw new Error('music audio element must exist');
    }

    musicAudioElement.currentTime = 12;

    await act(async () => {
      await result.current.toggleBassTrackPlayback();
    });

    expect(musicAudioElement.pause).toHaveBeenCalledOnce();
    expect(musicAudioElement.currentTime).toBe(0);
    expect(result.current.isBassTrackPlaying).toBe(false);
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

  it('메인 bass 트랙 ended 이벤트가 발생하면 재생 상태를 false로 되돌려야 한다', async () => {
    const { result } = renderHook(() => useBassAudio());

    await act(async () => {
      await result.current.toggleBassTrackPlayback();
    });

    const musicAudioElement = audioMockState.createdAudios[0];

    if (!musicAudioElement) {
      throw new Error('music audio element must exist');
    }

    act(() => {
      musicAudioElement.dispatch('ended');
    });

    expect(result.current.isBassTrackPlaying).toBe(false);
  });

  it('언마운트되면 생성한 모든 오디오를 정지하고 재생 위치를 초기화해야 한다', async () => {
    const { result, unmount } = renderHook(() => useBassAudio());

    await act(async () => {
      await result.current.toggleBassTrackPlayback();
      await result.current.playBassString('line4');
    });

    const [musicAudioElement, stringAudioElement] = audioMockState.createdAudios;

    if (!musicAudioElement || !stringAudioElement) {
      throw new Error('created audios must exist');
    }

    musicAudioElement.currentTime = 8;
    stringAudioElement.currentTime = 4;

    unmount();

    expect(musicAudioElement.pause).toHaveBeenCalled();
    expect(stringAudioElement.pause).toHaveBeenCalled();
    expect(musicAudioElement.currentTime).toBe(0);
    expect(stringAudioElement.currentTime).toBe(0);
  });
});

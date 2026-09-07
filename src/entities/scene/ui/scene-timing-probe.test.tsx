import { render } from '@testing-library/react';
import React from 'react';

import { SceneTimingProbe } from '@/entities/scene/ui/scene-timing-probe';

const frameCallbacks: (() => void)[] = [];

vi.mock('@react-three/fiber', () => ({
  useFrame: (callback: () => void) => {
    frameCallbacks.push(callback);
  },
}));

/** 렌더 루프가 도는 것을 흉내 낸다. jsdom에는 실제 프레임이 없다. */
const runFrames = (count: number) => {
  for (let index = 0; index < count; index += 1) {
    frameCallbacks.forEach(callback => {
      callback();
    });
  }
};

const markNames = () =>
  performance
    .getEntriesByType('mark')
    .map(entry => entry.name)
    .filter(name => name.startsWith('scene:'));

describe('SceneTimingProbe', () => {
  beforeEach(() => {
    frameCallbacks.length = 0;
    performance.clearMarks();
  });

  it('프레임이 여러 번 돌아도 첫 프레임 mark를 한 번만 남긴다', () => {
    render(<SceneTimingProbe />);
    runFrames(3);

    expect(markNames()).toEqual(['scene:first-frame']);
  });

  it('isContent면 씬 내용이 그려진 프레임으로 기록한다', () => {
    render(<SceneTimingProbe isContent />);
    runFrames(3);

    expect(markNames()).toEqual(['scene:first-content-frame']);
  });

  it('두 프로브가 함께 있으면 빈 캔버스와 씬 내용 시점을 각각 남긴다', () => {
    render(
      <>
        <SceneTimingProbe />
        <SceneTimingProbe isContent />
      </>,
    );
    runFrames(2);

    expect(markNames().sort()).toEqual(['scene:first-content-frame', 'scene:first-frame']);
  });
});

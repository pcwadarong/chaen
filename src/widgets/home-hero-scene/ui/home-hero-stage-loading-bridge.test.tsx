/* @vitest-environment jsdom */

import { render } from '@testing-library/react';
import React from 'react';
import { vi } from 'vitest';

import { HomeHeroStageReadyBridge } from '@/widgets/home-hero-scene/ui/home-hero-stage-loading-bridge';

describe('HomeHeroStageReadyBridge', () => {
  it('같은 ready 콜백을 공유하는 새 bridge가 이미 마운트됐으면 이전 bridge cleanup은 false를 덮어쓰지 않아야 한다', () => {
    const onReadyChange = vi.fn();
    const fallbackBridge = render(
      <HomeHeroStageReadyBridge isReady={false} onReadyChange={onReadyChange} />,
    );

    render(<HomeHeroStageReadyBridge isReady onReadyChange={onReadyChange} />);
    fallbackBridge.unmount();

    expect(onReadyChange.mock.calls.at(-1)?.[0]).toBe(true);
  });

  it('현재 bridge가 unmount될 때는 준비 상태를 false로 되돌려야 한다', () => {
    const onReadyChange = vi.fn();
    const bridge = render(<HomeHeroStageReadyBridge isReady onReadyChange={onReadyChange} />);

    bridge.unmount();

    expect(onReadyChange.mock.calls.at(-1)?.[0]).toBe(false);
  });
});

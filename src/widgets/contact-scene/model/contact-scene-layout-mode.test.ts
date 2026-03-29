// @vitest-environment node

import { describe, expect, it } from 'vitest';

import {
  CONTACT_SCENE_LAYOUT_MODE,
  getContactSceneLayoutMode,
} from '@/widgets/contact-scene/model/contact-scene-layout-mode';

describe('getContactSceneLayoutMode', () => {
  it('stacked scene일 때 ContactScene은 hidden 모드여야 한다', () => {
    expect(
      getContactSceneLayoutMode({
        availableHeight: 900,
        sceneViewportMode: 'stacked',
      }),
    ).toBe(CONTACT_SCENE_LAYOUT_MODE.hidden);
  });

  it('wide scene이지만 높이가 800 미만일 때 ContactScene은 centeredCopy 모드여야 한다', () => {
    expect(
      getContactSceneLayoutMode({
        availableHeight: 799,
        sceneViewportMode: 'wide',
      }),
    ).toBe(CONTACT_SCENE_LAYOUT_MODE.centeredCopy);
  });

  it('wide scene이고 높이가 충분할 때 ContactScene은 splitScene 모드여야 한다', () => {
    expect(
      getContactSceneLayoutMode({
        availableHeight: 860,
        sceneViewportMode: 'wide',
      }),
    ).toBe(CONTACT_SCENE_LAYOUT_MODE.splitScene);
  });
});

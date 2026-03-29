// @vitest-environment node

import { describe, expect, it } from 'vitest';

import { getContactSceneLayoutMode } from '@/widgets/contact-scene/model/contact-scene-layout-mode';

describe('getContactSceneLayoutMode', () => {
  it('mobile scene일 때 ContactScene은 hidden 모드여야 한다', () => {
    expect(
      getContactSceneLayoutMode({
        availableHeight: 900,
        sceneMode: 'mobile',
      }),
    ).toBe('hidden');
  });

  it('desktop scene이지만 높이가 800 미만일 때 ContactScene은 compact 모드여야 한다', () => {
    expect(
      getContactSceneLayoutMode({
        availableHeight: 799,
        sceneMode: 'desktop',
      }),
    ).toBe('compact');
  });

  it('desktop scene이고 높이가 충분할 때 ContactScene은 full 모드여야 한다', () => {
    expect(
      getContactSceneLayoutMode({
        availableHeight: 860,
        sceneMode: 'desktop',
      }),
    ).toBe('full');
  });
});

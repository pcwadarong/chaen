/**
 * @vitest-environment node
 */

import { Group, Mesh } from 'three';

import { setHomeHeroCostumeVisibility } from '@/widgets/home-hero-scene/model/set-home-hero-costume-visibility';

describe('setHomeHeroCostumeVisibility', () => {
  it('클로즈업 의상 대상 이름만 visible 상태가 토글되어야 한다', () => {
    const scene = new Group();
    const inner = new Mesh();
    const outer = new Mesh();
    const body = new Mesh();

    inner.name = 'inner';
    body.name = 'body';

    scene.add(inner, outer, body);

    setHomeHeroCostumeVisibility(scene, false);

    expect(inner.visible).toBe(false);
    expect(outer.visible).toBe(false);
    expect(body.visible).toBe(true);
  });
});

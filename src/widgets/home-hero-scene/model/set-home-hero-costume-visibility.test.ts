/**
 * @vitest-environment node
 */

import { Group, Mesh } from 'three';

import { setHomeHeroCostumeVisibility } from '@/widgets/home-hero-scene/model/set-home-hero-costume-visibility';

describe('setHomeHeroCostumeVisibility', () => {
  it('클로즈업 의상 토글 대상일 때, 이름이 일치한 mesh만 visible 상태가 바뀌어야 한다', () => {
    const scene = new Group();
    const inner = new Mesh();
    const outer = new Mesh();
    const body = new Mesh();

    inner.name = 'inner';
    outer.name = 'outer';
    body.name = 'body';

    scene.add(inner, outer, body);

    setHomeHeroCostumeVisibility(scene, false);

    expect(inner.visible).toBe(false);
    expect(outer.visible).toBe(false);
    expect(body.visible).toBe(true);
  });
});

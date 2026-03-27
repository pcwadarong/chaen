/* @vitest-environment node */

import { Group, Mesh, MeshStandardMaterial, NoColorSpace, Texture } from 'three';
import { describe, expect, it } from 'vitest';

import {
  applyFrameScreenTexture,
  applyScenePropMaterials,
  type PropsOrmTextures,
} from '@/entities/scene/lib/use-scene-prop-materials';
import { prepareOrmTexture } from '@/shared/lib/three/orm-material';

/**
 * 테스트용 소품 mesh를 생성합니다.
 */
const createMesh = (name: string) => {
  const mesh = new Mesh(undefined, new MeshStandardMaterial());
  mesh.name = name;
  return mesh;
};

/**
 * 테스트용 props ORM texture 묶음을 생성합니다.
 */
const createOrmTextures = (): PropsOrmTextures => ({
  room: new Texture(),
});

describe('applyScenePropMaterials', () => {
  it('scene prop mesh에는 frame_screen을 제외하고 room ORM을 연결한다', () => {
    const bassScene = new Group();
    const tableScene = new Group();
    const sofaScene = new Group();
    const bassBodyMesh = createMesh('bass_body');
    const lineMesh = createMesh('line1');
    const tableMesh = createMesh('table');
    const cameraMesh = createMesh('camera');
    const bookMesh = createMesh('book_small');
    const frameMesh = createMesh('frame');
    const frameScreenMesh = createMesh('frame_screen');
    const sofaMesh = createMesh('sofa');
    const textures = createOrmTextures();

    bassScene.add(bassBodyMesh, lineMesh);
    tableScene.add(tableMesh, cameraMesh, bookMesh, frameMesh, frameScreenMesh);
    sofaScene.add(sofaMesh);

    applyScenePropMaterials(bassScene, textures);
    applyScenePropMaterials(tableScene, textures);
    applyScenePropMaterials(sofaScene, textures);

    expect(bassBodyMesh.material.aoMap).toBe(textures.room);
    expect(lineMesh.material.roughnessMap).toBe(textures.room);
    expect(tableMesh.material.aoMap).toBe(textures.room);
    expect(cameraMesh.material.metalnessMap).toBe(textures.room);
    expect(bookMesh.material.roughnessMap).toBe(textures.room);
    expect(frameMesh.material.aoMap).toBe(textures.room);
    expect(frameScreenMesh.material.aoMap).toBe(null);
    expect(frameScreenMesh.material.roughnessMap).toBe(null);
    expect(frameScreenMesh.material.metalnessMap).toBe(null);
    expect(sofaMesh.material.roughnessMap).toBe(textures.room);
  });

  it('prepareOrmTexture를 거친 props ORM texture 설정을 덮어쓰지 않는다', () => {
    const scene = new Group();
    const mesh = createMesh('prop');
    const textures = createOrmTextures();

    prepareOrmTexture(textures.room);

    scene.add(mesh);

    applyScenePropMaterials(scene, textures);

    expect(textures.room.colorSpace).toBe(NoColorSpace);
    expect(textures.room.flipY).toBe(false);
  });

  it('frame_screen에는 선택 이미지를 map으로 연결하고 색상을 흰색으로 맞춰야 한다', () => {
    const scene = new Group();
    const frameScreenMesh = createMesh('frame_screen');
    const texture = new Texture();

    scene.add(frameScreenMesh);

    applyFrameScreenTexture(scene, texture);

    expect(frameScreenMesh.material.map).toBe(texture);
    expect(frameScreenMesh.material.color.getHexString()).toBe('ffffff');
  });

  it('선택 이미지가 없으면 frame_screen map을 제거하고 기본 색상으로 되돌려야 한다', () => {
    const scene = new Group();
    const frameScreenMesh = createMesh('frame_screen');
    const texture = new Texture();

    scene.add(frameScreenMesh);
    frameScreenMesh.material.map = texture;

    applyFrameScreenTexture(scene, null);

    expect(frameScreenMesh.material.map).toBe(null);
    expect(frameScreenMesh.material.color.getHexString()).toBe('f4f1ff');
  });
});

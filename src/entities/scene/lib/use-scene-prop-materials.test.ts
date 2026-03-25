import { Group, Mesh, MeshStandardMaterial, NoColorSpace, Texture } from 'three';
import { describe, expect, it } from 'vitest';

import {
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

  it('사전에 정리된 props ORM texture는 NoColorSpace와 flipY=false를 유지한다', () => {
    const scene = new Group();
    const mesh = createMesh('prop');
    const textures = createOrmTextures();

    prepareOrmTexture(textures.room);

    scene.add(mesh);

    applyScenePropMaterials(scene, textures);

    expect(textures.room.colorSpace).toBe(NoColorSpace);
    expect(textures.room.flipY).toBe(false);
  });
});

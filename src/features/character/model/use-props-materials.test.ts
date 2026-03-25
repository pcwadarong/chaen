import { Group, Mesh, MeshStandardMaterial, NoColorSpace, Texture } from 'three';
import { describe, expect, it } from 'vitest';

import {
  applyPropsMaterials,
  type PropsOrmTextures,
} from '@/features/character/model/use-props-materials';

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

describe('applyPropsMaterials', () => {
  it('bass, sofa, table 계열 소품에는 모두 room ORM을 연결한다', () => {
    const guitarScene = new Group();
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

    guitarScene.add(bassBodyMesh, lineMesh);
    tableScene.add(tableMesh, cameraMesh, bookMesh, frameMesh, frameScreenMesh);
    sofaScene.add(sofaMesh);

    applyPropsMaterials(guitarScene, '/models/guitar.glb', textures);
    applyPropsMaterials(tableScene, '/models/table.glb', textures);
    applyPropsMaterials(sofaScene, '/models/sofa.glb', textures);

    expect(bassBodyMesh.material.aoMap).toBe(textures.room);
    expect(lineMesh.material.roughnessMap).toBe(textures.room);
    expect(tableMesh.material.aoMap).toBe(textures.room);
    expect(cameraMesh.material.metalnessMap).toBe(textures.room);
    expect(bookMesh.material.roughnessMap).toBe(textures.room);
    expect(frameMesh.material.aoMap).toBe(textures.room);
    expect(frameScreenMesh.material.aoMap).toBe(null);
    expect(sofaMesh.material.roughnessMap).toBe(textures.room);
  });

  it('props ORM texture는 NoColorSpace와 flipY=false로 정리한다', () => {
    const scene = new Group();
    const mesh = createMesh('prop');
    const textures = createOrmTextures();

    scene.add(mesh);

    applyPropsMaterials(scene, '/models/guitar.glb', textures);

    expect(textures.room.colorSpace).toBe(NoColorSpace);
    expect(textures.room.flipY).toBe(false);
  });
});

import { Group, Mesh, MeshStandardMaterial, NoColorSpace, Texture } from 'three';
import { describe, expect, it } from 'vitest';

import {
  applyCharacterMaterials,
  type CharacterOrmTextures,
} from '@/entities/character/lib/use-character-materials';
import { prepareOrmTexture } from '@/shared/lib/three/orm-material';

/**
 * 테스트용 mesh를 생성합니다.
 */
const createMesh = (name: string) => {
  const mesh = new Mesh(undefined, new MeshStandardMaterial());
  mesh.name = name;
  return mesh;
};

/**
 * 테스트용 ORM texture 묶음을 만듭니다.
 */
const createOrmTextures = (): CharacterOrmTextures => ({
  gear: new Texture(),
  hair: new Texture(),
  outfit: new Texture(),
  skin: new Texture(),
});

describe('applyCharacterMaterials', () => {
  it('character mesh 이름 규칙에 따라 skin, outfit, hair, gear ORM을 분기 적용한다', () => {
    const scene = new Group();
    const bodyMesh = createMesh('body');
    const faceMesh = createMesh('face');
    const innerMesh = createMesh('inner');
    const outerMesh = createMesh('outer');
    const pantsMesh = createMesh('pants');
    const ribonMesh = createMesh('ribon');
    const hairMesh = createMesh('hair');
    const browsMesh = createMesh('brows');
    const eyebrowMesh = createMesh('eyebrow');
    const headphoneMesh = createMesh('headphone_band');
    const laptopMesh = createMesh('laptop');
    const laptopScreenMesh = createMesh('laptop_screen');
    const shoesMesh = createMesh('shoes');
    const textures = createOrmTextures();

    scene.add(
      bodyMesh,
      faceMesh,
      innerMesh,
      outerMesh,
      pantsMesh,
      ribonMesh,
      hairMesh,
      browsMesh,
      eyebrowMesh,
      headphoneMesh,
      laptopMesh,
      laptopScreenMesh,
      shoesMesh,
    );

    applyCharacterMaterials(scene, textures);

    expect(bodyMesh.material.aoMap).toBe(textures.skin);
    expect(faceMesh.material.aoMap).toBe(textures.skin);
    expect(bodyMesh.material.roughnessMap).toBe(textures.skin);
    expect(bodyMesh.material.metalnessMap).toBe(textures.skin);

    expect(innerMesh.material.aoMap).toBe(textures.outfit);
    expect(outerMesh.material.aoMap).toBe(textures.outfit);
    expect(pantsMesh.material.roughnessMap).toBe(textures.outfit);
    expect(ribonMesh.material.metalnessMap).toBe(textures.outfit);

    expect(hairMesh.material.aoMap).toBe(textures.hair);
    expect(browsMesh.material.aoMap).toBe(textures.hair);
    expect(eyebrowMesh.material.aoMap).toBe(textures.hair);
    expect(hairMesh.material.alphaMap).toBe(textures.hair);
    expect(hairMesh.material.transparent).toBe(true);

    expect(headphoneMesh.material.aoMap).toBe(textures.gear);
    expect(laptopMesh.material.roughnessMap).toBe(textures.gear);
    expect(shoesMesh.material.metalnessMap).toBe(textures.gear);
    expect(laptopScreenMesh.material.aoMap).toBe(null);
    expect(laptopScreenMesh.material.roughnessMap).toBe(null);
    expect(laptopScreenMesh.material.metalnessMap).toBe(null);
  });

  it('prepareOrmTexture를 거친 ORM texture 설정을 덮어쓰지 않는다', () => {
    const scene = new Group();
    const bodyMesh = createMesh('body');
    const hairMesh = createMesh('hair');
    const textures = createOrmTextures();

    prepareOrmTexture(textures.gear);
    prepareOrmTexture(textures.skin);
    prepareOrmTexture(textures.outfit);
    prepareOrmTexture(textures.hair);

    scene.add(bodyMesh, hairMesh);

    applyCharacterMaterials(scene, textures);

    expect(textures.gear.colorSpace).toBe(NoColorSpace);
    expect(textures.skin.colorSpace).toBe(NoColorSpace);
    expect(textures.outfit.colorSpace).toBe(NoColorSpace);
    expect(textures.hair.colorSpace).toBe(NoColorSpace);
    expect(textures.gear.flipY).toBe(false);
    expect(textures.skin.flipY).toBe(false);
    expect(textures.outfit.flipY).toBe(false);
    expect(textures.hair.flipY).toBe(false);
  });
});

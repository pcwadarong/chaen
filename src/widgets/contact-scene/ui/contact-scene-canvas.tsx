'use client';

import { Canvas } from '@react-three/fiber';
import React, { Suspense } from 'react';

import { SceneProp } from '@/entities/scene/ui/scene-prop';
import { HomeHeroCharacter } from '@/widgets/home-hero-scene/ui/home-hero-character';
import {
  HOME_HERO_CAMERA_FAR,
  HOME_HERO_CAMERA_NEAR,
} from '@/widgets/home-hero-scene/ui/home-hero-scene-layout';

/** 데스크탑 contact 영역의 정적 3D 씬입니다. hero 초기 카메라 위치를 그대로 사용합니다. */
export const ContactSceneCanvas = () => (
  <Canvas
    camera={{
      far: HOME_HERO_CAMERA_FAR,
      fov: 45,
      near: HOME_HERO_CAMERA_NEAR,
      position: [0, 0.75, 8.9],
    }}
    dpr={[1, 2]}
    gl={{ alpha: true, antialias: true }}
  >
    <ambientLight color="#f8f4ff" intensity={1.5} />
    <directionalLight castShadow color="#fff8f0" intensity={2.2} position={[1.5, 5.0, 8.0]} />
    <pointLight
      color="#fff8e8"
      decay={1.5}
      distance={15}
      intensity={4}
      position={[1.1, 1.9, 7.2]}
    />
    <Suspense fallback={null}>
      <group position={[0, -2.4, 0]}>
        <HomeHeroCharacter instance="contact" position={[0, 0, 0]} />
        <SceneProp path="/models/sofa.glb" position={[0, 0, -1]} />
      </group>
    </Suspense>
  </Canvas>
);

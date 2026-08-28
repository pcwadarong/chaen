# 01. 죽은 텍스처 제거 — `perf/3d-strip-dead-textures`

- **효과**: 3D 자산 48MB → 약 17.5MB (−63%)
- **의존**: 없음 (단, `03`이 먼저 병합되면 경로 상수를 소비만 할 것)
- **위험도**: 낮음 — 화면 출력은 픽셀 단위로 동일해야 한다
- **관련 발견**: F-1, F-2, F-3, F-10

---

## 프롬프트

```
`docs/3d-performance/README.md`를 먼저 읽어라. 이 작업은 그 문서의 F-1, F-2, F-3, F-10을 해결한다.

## 배경

`character.glb`(31.5MB)의 96.7%가 텍스처이고, 그중 18.40MB는 로드된 직후 런타임에
덮어써져 버려진다. `src/entities/character/lib/use-character-materials.ts`의
`applyCharacterMaterials`가 노드 이름 기준으로 aoMap/roughnessMap/metalnessMap을
`/textures/*_ORM.png`로 교체하기 때문이다. 소품 3종도 같은 구조로,
`applyScenePropMaterials`가 room ORM으로 덮어쓴다.

즉 GLB에서 이 텍스처들을 빼도 **화면은 1픽셀도 바뀌지 않는다.** 이게 이 작업의 계약이다.

## 목표

### A. `character.glb`에서 사망한 metallicRoughness 텍스처 6종 제거

제거 대상 (합계 18.40MB):
| glTF image index | 이름 | 크기 |
|---|---|---|
| 15 | `fabric_pattern_05_rough_4k` (4096²) | 14.97MB |
| 14 | `outfit_roughness` | 1.73MB |
| 5  | `hair_roughness` | 1.02MB |
| 9  | `gear_roughness` | 0.34MB |
| 8  | `gear_metallic-gear_roughness` | 0.34MB |
| 11 | `Image` (1×1 더미) | ~0 |

**반드시 남길 것**: image 2 `skin_roughness`(0.13MB).
`eye_left` / `eye_right` 노드(머티리얼 `눈`)는 `use-character-materials.ts`의 네 이름 집합
어디에도 없어서 ORM 덮어쓰기를 받지 않는다. 이걸 지우면 눈의 roughness가 사라진다.
0.13MB이므로 그냥 남겨라. (눈을 skin ORM 대상에 넣는 건 이 브랜치 범위가 아니다 —
README의 후속 항목으로 남긴다.)

목표: `character.glb` 31.5MB → **약 13MB**

### B. 소품 3종의 텍스처를 외부 공유 텍스처로 전환

`sofa.glb`/`bass.glb`/`table.glb`에 완전히 동일한 room 텍스처가 각각 임베드되어 있다.
roughness/metallic 계열은 이미 room_ORM으로 덮어써져 사망 상태다.

이미 이 코드베이스는 **ORM을 외부 텍스처로 빼서 `useTexture`로 로드하는 구조**를 쓰고 있다.
같은 결을 따라 `room_color`와 `room_normal`도 외부로 뺀다:

1. `room_color`(0.84MB), `room_normal`(1.20MB)을 `public/textures/`로 추출 (각 1벌만)
2. 소품 GLB 3종에서 임베드 텍스처를 **전부** 제거 → 지오메트리만 남김 (각 ~0.1MB)
3. `src/entities/scene/lib/use-scene-prop-materials.ts`의 `useScenePropMaterials`가
   room ORM에 더해 color/normal도 로드하도록 확장하고,
   `applyScenePropMaterials`에서 `material.map` / `material.normalMap`에 연결

주의사항:
- `frame_screen` 메시는 `ROOM_ORM_EXCLUDED_MESH_NAMES`로 이미 제외되어 있다.
  **color/normal 주입에서도 반드시 같이 제외**해야 한다. 이 메시는 런타임에 선택 이미지를
  `material.map`으로 받고, 없으면 `#f4f1ff` 색으로 떨어진다.
- `room_color`는 sRGB, `room_normal`은 non-color다. 기존 `prepareOrmTexture`는
  `NoColorSpace` + `flipY = false`를 설정하는데, color 맵에는 `SRGBColorSpace`가 필요하다.
  ORM용과 color용 준비 함수를 분리하라. `flipY = false`는 glTF UV 규약이라 셋 다 유지.
- 소품 머티리얼은 파일당 3~14개인데 모두 같은 텍스처를 공유하고 UV 영역과 color factor로만
  구분된다. 텍스처를 전부 같은 것으로 재주입해도 등가다 — 다만 **눈으로 확인**하라.

목표: 소품 합계 9.3MB → **GLB 0.3MB + 공유 텍스처 2.04MB ≈ 2.3MB**
(부수 효과: 같은 텍스처가 GPU에 3벌 올라가던 것이 1벌이 된다)

### C. 죽은 파일·항목 정리

- `public/textures/outfit_map.png` (0.10MB) — 코드 참조 0회. 삭제.
- `use-character-materials.ts`의 `GEAR_MESH_NAMES`에 있는 `'laptop_logo'` — GLB에 그런 노드
  없음. 제거.
- `public/thumbnail.png` 1.77MB → WebP 변환 (~150KB). OG 이미지이므로 참조 경로
  (`src/app/[locale]/**` metadata, 테스트의 `https://chaen.dev/thumbnail.png`)를 같이 갱신.

### D. 파이프라인을 재현 가능하게

수작업 Blender 재익스포트 대신 CLI로 처리하고 스크립트로 남겨라.

- `pnpm add -D @gltf-transform/cli @gltf-transform/core @gltf-transform/functions`
- `scripts/optimize-3d-assets.mjs` 를 추가하고 `package.json`에 스크립트 등록
- 원본 GLB는 어딘가 보존해야 재실행이 가능하다. `public/models/`를 결과물로 두고
  원본은 `assets/models-src/` 같은 곳에 두거나(gitignore 후 별도 보관), 혹은
  이 스크립트가 **멱등**하도록(이미 최적화된 파일에 재실행해도 안전) 작성하라.
  선택한 방식을 스크립트 상단 주석과 PR 문서에 명시할 것.

## 하지 말 것

- **지오메트리를 건드리지 마라.** 72,528 tri / 44,717 vert는 정상이고 Draco로 0.40MB다.
  simplify / decimate / weld 금지.
- **애니메이션을 건드리지 마라.** 4클립 513채널 합계 0.39MB다. 리샘플/양자화로 얻을 게 없고
  품질만 잃는다.
- **KTX2로 변환하지 마라.** 별도 브랜치(`06`)다. 여기서는 PNG 그대로 두고 "빼는" 것만 한다.
- `src/entities/scene/model/preloadGLB.ts`의 **경로 정의를 재구조화하지 마라.**
  브랜치 `03`이 이 파일을 담당한다. 소비만 하라.
- 화면에 보이는 결과를 바꾸지 마라. 조명/톤매핑/머티리얼 파라미터 튜닝은 범위 밖이다.

## 검증

1. `pnpm run check-types && pnpm run lint && pnpm run test:vitest`
2. `pnpm run test:browser:smoke`
3. **육안 검증이 이 브랜치의 핵심이다.** `pnpm dev`로 띄우고:
   - 홈 히어로 씬: 캐릭터 피부/머리/옷/헤드폰/신발/노트북, 소파·테이블·베이스
   - 스크롤 시퀀스로 클로즈업까지 진입 (의상 숨김 분기 포함)
   - contact 씬 캐릭터
   - 액자(`frame_screen`)에 이미지 선택 시 / 미선택 시 양쪽
   - 변경 전후 스크린샷을 같은 카메라 위치에서 찍어 PR 문서에 첨부
4. 크기 확인:
   ```
   ls -lh public/models public/textures
   ```
   `character.glb` ≈13MB, 소품 각 ~0.1MB, `public/textures` 합계 ≈9MB 이하

## 커밋 분할 제안

1. `🔧 chore: gltf-transform 기반 3D 자산 최적화 스크립트 추가`
2. `⚡ perf: 런타임에 덮어써지는 캐릭터 roughness 텍스처 제거` (18.4MB)
3. `⚡ perf: 소품 room 텍스처를 외부 공유 텍스처로 분리` (9.3MB → 2.3MB)
4. `🔥 remove: 미사용 outfit_map 텍스처와 존재하지 않는 laptop_logo 항목 제거`
5. `⚡ perf: OG 썸네일을 WebP로 전환`

`⚡ perf:`는 변형 선택자 없는 U+26A1 `⚡`를 써야 husky 훅을 통과한다.

## PR 문서

`docs/pr/3d-strip-dead-textures.md`에 작성. `docs/3d-performance/README.md`를 맨 위에 링크하고
본문은 요약본으로. "왜 화면이 안 바뀌는가"(런타임 ORM 덮어쓰기 구조)를 설계 섹션의 핵심으로 쓸 것.
before/after 크기 표와 스크린샷 필수.
```

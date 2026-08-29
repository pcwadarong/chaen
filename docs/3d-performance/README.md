# 3D 캐릭터/씬 자산 성능 분석

> 측정일: 2026-08-29 · 기준 커밋: `a2cfed7` · 브랜치: `audit/3d-character-assets`

## 한 줄 요약

**메시와 애니메이션은 문제가 아니다. 첫 진입 3D 페이로드 48MB 중 47.6MB가 텍스처고, 그중 27MB 이상이 로드된 뒤 런타임에 덮어써져 버려진다.**

---

## 1. 측정치

### 첫 진입에 즉시 받는 3D 자산 = 약 48MB

| 파일 | 크기 | 내역 |
| --- | --- | --- |
| `public/models/character.glb` | **31.5MB** | 텍스처 30.1MB (96.7%) / 지오메트리 0.40MB / 애니메이션 0.39MB / 기타 0.23MB |
| `public/models/bass.glb` | 3.3MB | 텍스처 3.2MB |
| `public/models/table.glb` | 3.3MB | 텍스처 3.2MB |
| `public/models/sofa.glb` | 2.7MB | 텍스처 2.6MB |
| `public/textures/*.png` | 6.9MB | ORM 5종 + 미사용 1종 |

### 지오메트리·애니메이션은 건강함 (건드릴 이유 없음)

| 항목 | 값 | 평가 |
| --- | --- | --- |
| 캐릭터 삼각형 | 72,528 tri / 44,717 vert | 웹 캐릭터로 정상 |
| 지오메트리 압축 | KHR_draco_mesh_compression | **0.40MB, 전체의 1.3%** |
| 스켈레톤 | 본 169개 | 정상 |
| 애니메이션 | 4클립(idle/music/typing/notification) × 513채널 | **0.39MB, 1.2%** |
| morph target | 7개 메시에 1~3개 (표정/눈깜빡임) | 정상, 버텍스 베이크 아님 |

> **"베이크"에 대한 오해 정리**
> 이 파일에 있는 건 **본 키프레임**(TRS on bones)이다. 스켈레톤이 살아 있고 런타임에 본에 옷/얼굴을 붙일 수 있으며, 4클립 전부 합쳐 0.39MB로 사실상 공짜다.
> 피해야 하는 **버텍스 베이크**(프레임마다 정점을 굽는 것)는 이 파일에 **하나도 없다.** 지금 구조가 맞다.

### 캐릭터 GLB 임베드 텍스처 16종

| 이미지 | 해상도 | 포맷 | 파일 | VRAM(밉 포함) | 런타임 상태 |
| --- | --- | --- | --- | --- | --- |
| `fabric_pattern_05_rough_4k` | 4096² | RGB8 | **14.97MB** | 85.3MB | 🔴 **덮어써짐 → 사망** |
| `outfit_normal` | 2048² | RGBA8 | 3.14MB | 21.3MB | 사용 |
| `outfit_color` | 2048² | RGBA8 | 2.88MB | 21.3MB | 사용 |
| `outfit_roughness` | 2048² | RGB8 | 1.73MB | 21.3MB | 🔴 덮어써짐 → 사망 |
| `skin_color` | 1024² | RGBA8 | 1.36MB | 5.3MB | 사용 |
| `hair_color` | 2048² | RGBA8 | 1.28MB | 21.3MB | 사용 (brow/eyebrow) |
| `hair_color-hair_alpha` | 2048² | RGBA8 | 1.26MB | 21.3MB | 사용 (hair) — 위와 중복 의심 |
| `hair_roughness` | 2048² | RGB8 | 1.02MB | 21.3MB | 🔴 덮어써짐 → 사망 |
| `gear_normal` | 2048² | RGBA8 | 0.84MB | 21.3MB | 사용 |
| `hair_normal` | 2048² | RGBA8 | 0.38MB | 21.3MB | 사용 |
| `gear_metallic-gear_roughness` | 2048² | RGB8 | 0.34MB | 21.3MB | 🔴 덮어써짐 → 사망 |
| `gear_roughness` | 2048² | RGB8 | 0.34MB | 21.3MB | 🔴 덮어써짐 → 사망 |
| `gear_color` | 2048² | RGBA8 | 0.33MB | 21.3MB | 사용 |
| `skin_roughness` | 1024² | RGB8 | 0.13MB | 5.3MB | ⚠️ **눈에서만** 살아남음 |
| `skin_normal` | 2048² | RGBA8 | 0.10MB | 21.3MB | 사용 (해상도 과다) |
| `Image` | 1×1 | RGB8 | ~0 | ~0 | 🔴 덮어써짐 → 사망 |
| **합계** | | | **30.09MB** | **≈352MB** | **사망 18.40MB** |

### 소품 3종 — 같은 방 텍스처를 3번 배송

| | `room_normal` | `room_color` | `room_roughness` | `room_metallic-room_roughness` |
| --- | --- | --- | --- | --- |
| `sofa.glb` | 1.20MB | 0.84MB | 0.59MB 🔴 | — |
| `bass.glb` | 1.20MB | 0.84MB | 0.59MB 🔴 | 0.59MB 🔴 |
| `table.glb` | 1.20MB | 0.84MB | 0.59MB 🔴 | 0.59MB 🔴 |

세 파일에 **완전히 동일한 2048² 텍스처가 각각 임베드**되어 있고, GLB별로 별개 `Texture` 객체가 되어 GPU에도 3벌 올라간다. roughness/metallic 계열은 전부 `/textures/room_ORM.png`로 덮어써진다.

### `public/textures/` 독립 텍스처

| 파일 | 해상도 | 포맷 | 파일 | VRAM | 비고 |
| --- | --- | --- | --- | --- | --- |
| `hair_ORM.png` | 2048² | RGBA8 | 3.33MB | 21.3MB | 다른 ORM은 Palette8인데 이것만 RGBA8 |
| `skin_ORM.png` | 2048² | Palette8 | 1.37MB | 21.3MB | |
| `outfit_ORM.png` | 2048² | Palette8 | 1.13MB | 21.3MB | |
| `room_ORM.png` | 2048² | Palette8 | 0.57MB | 21.3MB | |
| `gear_ORM.png` | 2048² | Palette8 | 0.42MB | 21.3MB | |
| `outfit_map.png` | 2048² | RGBA8 | 0.10MB | 21.3MB | 🔴 **코드에서 참조 0회 — 죽은 파일** |

### GPU VRAM 추정

전부 PNG → GPU에 RGBA8 비압축 업로드. 밉맵 포함 추정:

| 소스 | VRAM |
| --- | --- |
| `character.glb` 텍스처 16종 | ≈352MB |
| `public/textures` ORM 6종 | ≈128MB |
| `sofa` / `bass` / `table` (dedup 안 됨) | 64 + 85 + 85 = ≈234MB |
| **합계** | **≈714MB** |

여기에 홈 페이지는 **Canvas가 2개**(hero + contact)라 WebGL 컨텍스트가 둘이고, 같은 텍스처가 **각 컨텍스트에 따로 업로드**된다. 저사양 GPU/모바일에서 컨텍스트 로스가 날 수 있는 수치.

---

## 2. 발견 목록

### 🔴 F-1. 15MB 텍스처가 로드 직후 버려짐

`fabric_pattern_05_rough_4k` (4096² RGB PNG, **14.97MB = 캐릭터 파일의 47%**)는 머티리얼 `strip`의 metallicRoughness 맵이다. 대응 노드는 `shoes_strip`이고, 이 이름은 `src/entities/character/lib/use-character-materials.ts`의 `GEAR_MESH_NAMES`에 들어 있다.

→ `applyCharacterMaterials`가 첫 렌더 전에 `roughnessMap`/`metalnessMap`을 `/textures/gear_ORM.png`로 **덮어쓴다.** 다운로드하고, PNG 디코딩하고, 한 번도 안 쓰고 버린다.

### 🔴 F-2. 임베드된 roughness 맵이 사실상 전부 사망 (18.40MB)

`applyCharacterMaterials`는 노드 이름이 `SKIN_MESH_NAMES` / `HAIR_MESH_NAMES` / `OUTFIT_MESH_NAMES` / `GEAR_MESH_NAMES`에 걸리면 무조건 ORM으로 `aoMap`/`roughnessMap`/`metalnessMap`을 교체한다. 노드 22개 중 **19개가 매칭**된다.

| 사망 이미지 | 크기 |
| --- | --- |
| `fabric_pattern_05_rough_4k` | 14.97MB |
| `outfit_roughness` | 1.73MB |
| `hair_roughness` | 1.02MB |
| `gear_roughness` | 0.34MB |
| `gear_metallic-gear_roughness` | 0.34MB |
| `Image` (1×1) | ~0 |
| **합계** | **18.40MB** |

**유일한 생존자**: `skin_roughness`(0.13MB). `eye_left`/`eye_right`(머티리얼 `눈`)가 네 집합 **어디에도 없어서** 덮어쓰기를 피했다. 의도된 예외인지 확인 필요.

**부수 발견**: `GEAR_MESH_NAMES`의 `'laptop_logo'`는 GLB에 존재하지 않는 노드다. 죽은 항목.

### 🔴 F-3. 방 텍스처 3중 배송 + roughness 사망

`applyScenePropMaterials`(`src/entities/scene/lib/use-scene-prop-materials.ts:41`)가 `frame_screen`을 제외한 **모든** 소품 메시의 roughness/metalness를 `/textures/room_ORM.png`로 덮어쓴다. 즉 소품 GLB의 room roughness/metallic도 전부 사망.

남는 `room_color` + `room_normal`(합 2.04MB)조차 세 파일에 중복 임베드되어 있다. 이미 ORM을 외부 텍스처로 빼는 구조를 쓰고 있으므로, color/normal도 같은 방식으로 빼면 소품 GLB는 지오메트리만 남는다.

### 🟠 F-4. KTX2/Basis 미도입

`KTX2Loader`, `MeshoptDecoder` 참조가 코드베이스에 0건. 모든 텍스처가 PNG → GPU RGBA8. KTX2(색상/ORM은 ETC1S, 노멀은 UASTC)로 가면 파일 크기와 **VRAM이 함께** 4~8배 줄어든다. 지금은 VRAM이 파일 크기와 무관하게 해상도로만 결정되므로, PNG 최적화만으로는 VRAM이 1바이트도 안 줄어든다.

### 🟠 F-5. 48MB를 모든 라우트에서 프리로드

`SceneAssetPreloader`가 **루트 레이아웃** `src/app/layout.tsx:30`에 있다. `/articles`, `/resume`, admin 등 3D를 전혀 쓰지 않는 모든 페이지에서 GLB 4개 프리로드가 걸린다.

### 🟠 F-6. `public/` 장기 캐시 헤더 없음

`next.config.ts`에 `headers()`가 없다. Next는 `public/`을 `Cache-Control: public, max-age=0`으로 내보내므로, 48MB 자산이 매 방문마다 최소 재검증(304) 왕복을 한다.

### 🟡 F-7. 믹서가 프레임당 두 번 갱신 → 애니메이션 약 2배속

`src/entities/character/model/use-character-instance.ts:92`

```ts
useFrame((state, delta) => {
  const currentFrame = state.gl.info.render.frame;
  if (characterCache.lastUpdatedFrame === currentFrame) return;
  characterCache.lastUpdatedFrame = currentFrame;
  characterCache.mainMixer.update(delta);
  characterCache.contactMixer.update(delta);
});
```

홈 페이지(`src/views/home/ui/home-page.tsx`)에는 hero canvas와 contact canvas가 **동시에** 마운트된다. 렌더러가 다르면 `gl.info.render.frame` 카운터도 **완전히 별개**이고, contact canvas는 `dynamic({ ssr: false })`라 반드시 늦게 마운트되어 카운터가 어긋난다.

→ 매 rAF마다 두 캔버스가 각각 두 믹서를 갱신 → `delta`가 두 번 누적 → **애니메이션 약 2배속**. 반대로 두 카운터가 우연히 같아지는 프레임에는 한쪽 갱신이 통째로 드롭된다.

또한 화면 밖 contact 캐릭터의 스켈레톤이 항상 갱신된다.

### 🟡 F-8. `antialias: true` + EffectComposer 중복

hero canvas는 `gl={{ antialias: true }}`인데 `OutlineEffect`가 `EffectComposer`로 자체 렌더 타깃에 그린다. 기본 프레임버퍼 MSAA는 낭비. contact canvas는 컴포저가 없으므로 AA 유지가 맞다.

### 🟡 F-9. `frameloop="demand"` 없음 / 오프스크린 정지 없음

코드베이스에 `frameloop`, `invalidate()` 참조 0건. contact 씬은 정적인데 스크롤로 화면을 벗어나도 계속 60fps로 렌더된다.

### 🟡 F-10. 자잘한 것들

- `skin_normal` 2048²인데 파일 0.10MB(= 거의 평평). `skin_color`는 1024². 1024로 내리거나 제거 검토.
- `hair_color`(1.28MB)와 `hair_color-hair_alpha`(1.26MB) — 둘 다 2048², 알파 유무만 다른 동일 아트로 보임. RGBA 하나로 병합 가능.
- `hair_ORM.png` 3.33MB만 RGBA8, 나머지 ORM은 Palette8. 팔레트화만 해도 ~2MB.
- `public/textures/outfit_map.png` 미사용 — 삭제.
- `public/thumbnail.png` 1.77MB PNG(OG 이미지) → WebP ~150KB.

---

## 3. 실행 계획 — 브랜치 맵

각 브랜치의 작업 지시서는 같은 폴더의 번호별 파일에 있다.

> **작업 순서와 병합 순서는 다르다.** 진짜 선행 관계는 `01 → 06` 하나뿐이고,
> 나머지 넷은 서로 무관해서 **지금 동시에 워크트리를 파도 된다.** 아래 "병합 순서"는
> 충돌을 줄이려는 권장일 뿐 강제가 아니다.

| # | 브랜치 | 지시서 | 효과 | 의존 |
| --- | --- | --- | --- | --- |
| 1 | `perf/3d-strip-dead-textures` | [01](./01-strip-dead-textures.md) | 자산 **48MB → 17.5MB** | — |
| 2 | `perf/3d-preload-scope` | [02](./02-preload-scope.md) | 비홈 라우트 **-48MB** | — |
| 3 | `perf/3d-asset-cache-headers` | [03](./03-asset-cache-headers.md) | 재방문 **0 바이트** | — |
| 4 | `fix/character-mixer-frame-guard` | [04](./04-mixer-frame-guard.md) | 애니메이션 속도 정확 + CPU 절감 | — |
| 5 | `perf/3d-render-loop` | [05](./05-render-loop.md) | 프레임 안정성 / 배터리 | — |
| 6 | `perf/3d-ktx2-textures` | [06](./06-ktx2-textures.md) | 파일 **-60%**, VRAM **-75%** | **1** |

### 의존 그래프

```
02 ─┐
03 ─┤  서로 무관 — 지금 전부 같이 파도 된다
04 ─┤
05 ─┘

01 ─────────────► 06     ← 유일한 진짜 선행 관계
```

**`01 → 06`이 강제인 이유**: 06은 01이 남긴 텍스처를 압축하고 01이 만든
`scripts/optimize-3d-assets.mjs`에 변환 단계를 이어 붙인다. 곧 지울 15MB짜리 텍스처를
KTX2로 굽는 건 무의미하고, `public/**`을 양쪽이 통째로 갈아엎어 머지 자체가 불가능하다.

### 파일 충돌 실측

| 브랜치 쌍 | 겹치는 파일 | 성격 |
| --- | --- | --- |
| 01 ↔ 06 | `public/**`, `optimize-3d-assets.mjs` | 🔴 해소 불가 → 선행 강제 |
| 01 ↔ 03 | `use-character-materials.ts`, `use-scene-prop-materials.ts` | 🟡 다른 부분 (03=경로 상수, 01=이름 집합·color/normal 추가) |
| 03 ↔ 04 | `use-character-instance.ts` | 🟢 다른 훅 (03=60행 경로, 04=92행 `useFrame`) |
| 02 ↔ 03 | `preloadGLB.ts` | 🟢 02는 소비만 하도록 범위 제한 |
| 나머지 전부 | — | 🟢 겹침 없음 |

`preloadGLB.ts`는 **03이 소유한다.** 03이 이 파일을 `scene-asset-paths.ts`로 재편하므로,
01·02는 경로 정의를 수정하지 말고 소비만 할 것.

### 권장 병합 순서

```
03 → 02 → 04 → 05 → 01 → 06
      └─ 02·04·05는 사실 아무 순서나 무관
```

- 03이 가장 작고 01이 리베이스할 경로 모듈을 먼저 만들어준다.
- 01은 `public/` 바이너리를 전부 갈아엎으므로 소스 변경이 큰 것들 뒤에 둔다.
- 01·06 병합 시 `.vN` 파일명을 반드시 올린다 (`gltf-pipeline` 스킬 Step 6).

> **함정 — `04`의 재현 측정은 `05` 병합 전에 해둘 것.**
> 05가 contact canvas를 오프스크린에서 멈추면 그쪽 `useFrame`이 안 돌아 2배속 증상이 **가려진다.**
> 버그가 사라진 게 아니라(contact가 보일 때는 그대로 이중 갱신) 재현이 안 되는 것뿐이다.
> 04 지시서는 "고치기 전에 눈으로 확인하라"로 시작하므로, 05가 먼저 들어간 베이스에서
> 시작하면 그 단계에서 막힌다.

### 누적 효과

| 단계 | 첫 진입 3D 페이로드 | VRAM |
| --- | --- | --- |
| 현재 | 48MB | ≈714MB |
| 1~4번 완료 | **≈17.5MB** | ≈390MB |
| 6번까지 완료 | **≈7MB** | **≈150MB** |

---

## 4. 공통 규칙 (모든 브랜치)

- **`.claude/skills/gltf-pipeline`을 먼저 읽어라.** GLB를 건드리는 브랜치(`01`, `06`)는
  이름 조회 제약·gltf-transform 금지 목록·KTX2 절차·`.vN` 캐시 버스팅이 전부 거기 있다.
  이 문서와 충돌하면 **스킬이 단일 출처다.**
- PR 리뷰가 달리면 `follow-review` 스킬, 셀프 리뷰는 `self-review` 스킬.

- **커밋 메시지는 한국어**, 허용 타입만: `✨ feat:` `🐛 fix:` `♻️ refactor:` `💄 style:` `📝 docs:` `🔧 chore:` `🔥 remove:` `🧪 test:` `⚡ perf:` `⚙️ ci:` `🧹 lint:`
  - ⚠️ `⚡ perf:`는 **변형 선택자 없는 U+26A1 `⚡`**만 통과한다. `⚡️`(U+FE0F 포함)는 husky 훅이 거부한다.
- `.gitignore`에 `docs/*`가 있다. 문서를 커밋하려면 `!docs/<경로>` 예외가 필요하다 (이 폴더는 이미 예외 등록됨).
- GitHub 작업은 개인 계정으로: `env -u GITHUB_TOKEN gh <command>`
- 검증: `pnpm run check-types` → `pnpm run lint` → `pnpm run test:vitest`. 3D 런타임을 바꾼 브랜치는 `pnpm run test:browser:smoke`까지.
- PR 문서는 `docs/pr/`에 작성 (AGENTS.md §4 구조: 목적 → 설계 → Changes → 리뷰 포인트 → Test plan → 후속).
- 아키텍처는 FSD를 따른다 (AGENTS.md §1). 함수/훅에는 **한국어 JSDoc**.

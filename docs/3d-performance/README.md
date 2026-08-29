# 3D 자산·런타임 성능 — 남은 과제

> 측정 기준: `origin/main` = `39b7c05` (**PR #93 머지 이후**) · 갱신일 2026-08-29
>
> ⚠️ 이 문서의 초판은 `a2cfed7`(#93 이전)에서 측정해 이미 해결된 문제를 다뤘다.
> 아래는 **#93 이후 실측**으로 다시 쓴 것이다.

## 한 줄 요약

**파일 크기 문제는 #93이 끝냈다(48MB → 9.6MB). 남은 건 VRAM이다 — 380MB, 5배 줄어든 파일에 비해 1.9배밖에 안 줄었다.**

---

## 1. PR #93이 이미 해결한 것

다시 분석하지 않도록 기록해 둔다.

| 항목 | 결과 |
| --- | --- |
| 에셋 빌드 파이프라인 | `scripts/optimize-models.mjs` · `optimize-textures.mjs` (`pnpm optimize:models\|textures`) |
| 다운로드 총량 | **47.9MB → 9.6MB** |
| `character.glb` | 32MB → **`character.v2.glb` 4.57MB** |
| 소품 3종 | 9.4MB → 0.66MB (`bass` 0.24 / `table` 0.23 / `sofa` 0.16) |
| 4096² fabric roughness | 15MB → 1024² WebP 0.29MB |
| 지오메트리 압축 | Draco → **Meshopt** (`EXT_meshopt_compression`, 디코더 three 번들 내장) |
| 텍스처 포맷 | **`EXT_texture_webp`** + `/textures/*.v2.webp` |
| Draco 디코더 | gstatic CDN → **self-host** (`/decoders/draco/`, `useGLTF.setDecoderPath`) |
| 캐시 | `.vN` 파일명 규칙 + `/models`·`/textures`·`/decoders` `immutable` |
| 경로 상수화 | `entities/scene/model/preloadGLB.ts` (`CHARACTER_MODEL_PATH` 등) |
| 렌더 루프 | `shared/lib/three/use-render-when-visible.ts` — IntersectionObserver + `visibilitychange`로 오프스크린/백그라운드 `frameloop` 정지 |
| 첫 가시화 | 두 캔버스에 `<Preload all />` |
| 그림자 | frustum 타이트닝 (±6, 1024 맵, bias) |
| 믹서 재개 | `delta` 상한 `1/30` 클램프 |

> **구조 변화 주의:** `skins`가 1개 → **12개**로 늘었다. meshopt/quantize 과정의 부산물로 보인다.
> 동작에는 문제가 없지만, 캐릭터 GLB를 다시 만질 때 `inspect` 베이스라인으로 알고 있어야 한다.

---

## 2. 남은 문제 — 실측

### 지금 상태

| | 파일 | VRAM (RGBA8 + 밉) |
| --- | --- | --- |
| #93 이전 | 48MB | ≈714MB |
| **현재 (`origin/main`)** | **9.6MB** | **≈380MB** |
| 배율 | 5.0× ↓ | **1.9× ↓** |

**WebP는 파일 크기만 줄인다.** GPU에는 디코딩 후 RGBA8로 올라가므로 VRAM은 오직 **해상도**가 결정한다. 텍스처 해상도는 `fabric`(4096→1024) 하나 빼고 전부 2048² 그대로다.

여기에 홈 페이지는 캔버스가 2개(hero + contact)라 WebGL 컨텍스트가 둘이고, **같은 텍스처가 각 컨텍스트에 따로 업로드**된다.

### 🔴 F-1. 죽은 roughness 텍스처가 아직 임베드되어 있다 — VRAM 90MB

`applyCharacterMaterials`가 런타임에 `roughnessMap`/`metalnessMap`/`aoMap`을 외부 ORM으로 덮어쓰므로, 아래 이미지들은 **디코딩된 뒤 한 번도 안 쓰이고 버려진다.** #93은 이것들을 **압축했을 뿐 제거하지 않았다.**

| 이미지 | 해상도 | 파일 | **VRAM** |
| --- | --- | --- | --- |
| `outfit_roughness` | 2048² | 0.45MB | 21.3MB |
| `hair_roughness` | 2048² | 0.27MB | 21.3MB |
| `gear_roughness` | 2048² | 0.11MB | 21.3MB |
| `gear_metallic-gear_roughness` | 2048² | 0.11MB | 21.3MB |
| `fabric_pattern_05_rough_4k` | 1024² | 0.29MB | 5.3MB |
| **합계** | | **1.23MB** | **≈90.5MB** |

파일로는 1.2MB라 사소하지만 VRAM으로는 GLB 텍스처(272MB)의 **3분의 1**이다.

**생존자**: `skin_roughness`(1024², 5.3MB). `eye_left`/`eye_right`(머티리얼 `눈`)가 네 이름 집합 어디에도 없어 덮어쓰기를 피한다. 지우면 눈만 밋밋해진다.

### 🔴 F-2. KTX2 미도입 — 남은 VRAM의 근본 원인

`KTX2Loader` 참조 0건. F-1로 죽은 것을 제거해도 **288MB**가 남고, 이건 해상도를 낮추지 않는 한 PNG/WebP로는 줄일 방법이 없다.

KTX2(색상·ORM = ETC1S, 노멀 = UASTC) 전환 시 추정:

| | 현재 | F-1 후 | **F-1 + KTX2 후** |
| --- | --- | --- | --- |
| GLB 텍스처 | 272MB | 181MB | ≈38MB |
| `/textures` ORM 5종 | 107MB | 107MB | ≈14MB |
| **합계** | **380MB** | 288MB | **≈50MB** |

### 🟠 F-3. 프리로더가 여전히 루트 레이아웃에 있다

`src/app/layout.tsx:30`. `/articles`, `/resume`, admin 등 3D를 전혀 안 쓰는 라우트가 GLB 4개(9.6MB)를 받는다. #93이 총량을 줄여 임팩트는 작아졌지만 여전히 순수 낭비다.

### 🟡 F-4. 믹서 프레임 가드 버그 — 그대로

`src/entities/character/model/use-character-instance.ts:82`

```ts
useFrame((state, delta) => {
  const currentFrame = state.gl.info.render.frame;
  if (characterCache.lastUpdatedFrame === currentFrame) return;
  characterCache.lastUpdatedFrame = currentFrame;
  const clampedDelta = Math.min(delta, 1 / 30);
  characterCache.mainMixer.update(clampedDelta);
  characterCache.contactMixer.update(clampedDelta);
});
```

#93은 `clampedDelta`만 추가했고 **가드 자체는 손대지 않았다.** `gl.info.render.frame`은 렌더러별 카운터라 캔버스 2개 사이에서는 비교가 성립하지 않는다 → 매 rAF마다 두 캔버스가 각각 두 믹서를 갱신 → `delta` 이중 누적.

> **#93이 재현을 어렵게 만들었다.** `RenderWhenVisible`이 contact 캔버스를 오프스크린에서 멈추므로,
> contact가 화면 밖이면 증상이 안 나타난다. **contact 씬이 뷰포트 안에 있는 상태에서 측정해야 한다.**
> 클램프 때문에 "2배속"이 아니라 "프레임당 최대 2/30초 진행"으로 나타나는 점도 감안할 것.

### 🟡 F-5. 자잘한 것

- `hair_color`(0.20MB)와 `hair_color-hair_alpha`(0.43MB) — 둘 다 2048², 알파 유무만 다른 동일 아트로 보인다. 병합하면 VRAM 21.3MB 절감
- `skin_normal` 2048²인데 파일 0.01MB(= 거의 평평). `skin_color`는 1024². 1024로 내리면 VRAM 16MB 절감
- `public/thumbnail.png` — OG 이미지. WebP 전환 여부 확인 필요

---

## 3. 브랜치 맵

| # | 브랜치 | 지시서 | 효과 | 의존 |
| --- | --- | --- | --- | --- |
| 1 | `perf/3d-vram-ktx2` | [01](./01-vram-ktx2.md) | VRAM **380MB → ≈50MB** | — |
| 2 | `perf/3d-preload-scope` | [02](./02-preload-scope.md) | 비홈 라우트 **-9.6MB** | — |
| 3 | `fix/character-mixer-frame-guard` | [03](./03-mixer-frame-guard.md) | 애니메이션 속도 정확 | — |

**세 브랜치 모두 서로 독립적이다.** 파일이 겹치지 않으므로 지금 동시에 워크트리를 파도 되고, 병합 순서도 무관하다.

| 브랜치 | 주로 건드리는 파일 |
| --- | --- |
| 01 | `public/**`, `scripts/optimize-*.mjs`, `shared/lib/three/`, `use-character-materials.ts`, `use-scene-prop-materials.ts`, `preloadGLB.ts`(`.v3` 갱신) |
| 02 | `app/layout.tsx`, `views/home/`, `entities/scene/ui/scene-asset-preloader.tsx` |
| 03 | `entities/character/model/use-character-instance.ts` |

> `scene-asset-preloader.tsx`는 02가 소유하고, 01은 여기서 `setDecoderPath` 계열 로더 설정만 만진다.
> 겹치면 훅 단위가 달라 리베이스가 간단하다.

---

## 4. 공통 규칙

- **`.claude/skills/gltf-pipeline`을 먼저 읽어라.** 이름 조회 제약, gltf-transform 금지 목록,
  KTX2 절차, `.vN` 캐시 버스팅이 전부 거기 있다. **이 문서와 충돌하면 스킬이 단일 출처다.**
- 에셋을 바꾸면 `preloadGLB.ts`의 `.vN`을 올린다. 안 올리면 immutable 캐시 때문에 옛 파일이 계속 서빙된다.
- 원본은 `assets-src/`에 백업되어 있다 (#93이 `inspect` 베이스라인까지 함께 남겼다). 재변환 시 여기서 출발한다.
- 커밋 타입은 `pr-workflow` 스킬의 허용 표를 따른다. `⚡ perf:`는 **변형 선택자 없는 U+26A1**만 통과한다.
- PR 문서는 `docs/pr/`에 `목적 → 설계 → Changes → 리뷰 포인트 → Test plan → 후속` 구조로 (`pr-workflow` 스킬).
- 검증: `pnpm run check-types` → `pnpm run lint` → `pnpm run test:vitest`. 3D 런타임을 바꿨으면 `pnpm run test:browser`까지.
- 리뷰가 달리면 `follow-review` 스킬, 셀프 리뷰는 `self-review` 스킬.

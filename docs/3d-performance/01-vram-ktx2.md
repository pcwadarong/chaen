# 01. VRAM 절감 — `perf/3d-vram-ktx2`

- **효과**: GPU VRAM **380MB → ≈50MB** (7~8×)
- **의존**: 없음
- **위험도**: 높음 — 압축 아티팩트로 화질이 눈에 띄게 나빠질 수 있다
- **관련 발견**: F-1, F-2, F-5

---

## 프롬프트

```
`docs/3d-performance/README.md`와 `.claude/skills/gltf-pipeline` 스킬을 먼저 읽어라.
충돌하면 **스킬이 단일 출처다.**

## 배경

PR #93이 파일 크기를 48MB → 9.6MB로 끝냈다. 하지만 **VRAM은 380MB로 1.9배밖에 안 줄었다.**
WebP는 파일만 줄이고 GPU에는 RGBA8로 올라가므로, VRAM은 오직 해상도가 결정한다.
텍스처는 `fabric`(4096→1024) 하나 빼고 전부 2048² 그대로다.

게다가 홈은 캔버스가 2개(hero + contact)라 컨텍스트가 둘이고, 같은 텍스처가
각 컨텍스트에 따로 업로드된다.

**이 브랜치는 파일 크기가 아니라 VRAM을 목표로 한다.** 파일이 조금 커지더라도
VRAM이 줄면 이긴 것이다 (KTX2는 대개 둘 다 줄지만, 판단 기준을 헷갈리지 마라).

## 목표

### A. 죽은 텍스처 제거 — VRAM 90MB (먼저 할 것)

`applyCharacterMaterials`가 런타임에 ORM으로 덮어쓰는 텍스처들이 아직 GLB에 남아 있다.
#93은 이것들을 **압축했을 뿐 제거하지 않았다.**

| 이미지 | 해상도 | 파일 | VRAM |
|---|---|---|---|
| `outfit_roughness` | 2048² | 0.45MB | 21.3MB |
| `hair_roughness` | 2048² | 0.27MB | 21.3MB |
| `gear_roughness` | 2048² | 0.11MB | 21.3MB |
| `gear_metallic-gear_roughness` | 2048² | 0.11MB | 21.3MB |
| `fabric_pattern_05_rough_4k` | 1024² | 0.29MB | 5.3MB |
| **합계** | | 1.23MB | **≈90.5MB** |

**반드시 남길 것**: `skin_roughness`(1024²). `eye_left`/`eye_right`(머티리얼 `눈`)가
`use-character-materials.ts`의 네 이름 집합 어디에도 없어 덮어쓰기를 피한다.
지우면 눈만 조용히 밋밋해진다.

> 지우기 전에 **노드 이름 → 집합 매칭을 전수 확인하라.** 스킬 Step 5의 "압축보다 제거가 먼저" 절과
> Step 1의 이름 표를 그대로 따르면 된다. 집합이 그 사이 바뀌었을 수 있으니 코드를 직접 읽어라.

소품 GLB도 같은 구조다 — `applyScenePropMaterials`가 `frame_screen`을 뺀 **모든** 메시를
room ORM으로 덮어쓴다. 소품에 roughness/metallic 계열이 남아 있으면 같이 제거하라.
(#93 이후 소품은 0.16~0.24MB로 작아서 남은 게 없을 수도 있다 — 확인부터.)

### B. KTX2 전환 — 나머지 238MB

| 텍스처 | 포맷 | 이유 |
|---|---|---|
| baseColor | ETC1S | 압축률 우선 |
| ORM | ETC1S | 스칼라 데이터, 정밀도 요구 낮음 |
| **normal** | **UASTC** | ETC1S로 굽면 노멀이 눈에 띄게 깨진다. 예외 없음 |

대상은 두 군데다:
- `character.v2.glb` 내부 임베드 텍스처 (`EXT_texture_webp` → `KHR_texture_basisu`)
- `public/textures/*_ORM.v2.webp` 5종 (GLB 밖, `useTexture`로 로드)

로더 배선·함정은 **스킬 Step 5에 전부 적혀 있다.** 특히:
- transcoder self-host (이미 `/decoders/draco/` 선례가 있으니 `/decoders/basis/`로 나란히)
- `detectSupport`에 실제 `WebGLRenderer`가 필요하고, **캔버스가 2개라 전역 싱글턴 금지**
- `useTexture` → `useKTX2` 교체 시 `prepareOrmTexture`의 `flipY`/`colorSpace` 재확인

> **#93 이후 달라진 전제**: 지오메트리가 Draco가 아니라 **Meshopt**(`EXT_meshopt_compression`)다.
> `useGLTF`의 draco/meshopt 인자와 `setDecoderPath('/decoders/draco/')` 설정이
> `entities/scene/ui/scene-asset-preloader.tsx`에 있다. KTX2 로더를 여기에 나란히 붙이되,
> **Meshopt 설정을 깨뜨리지 마라.**

### C. 해상도 다운스케일 (F-5)

KTX2로 줄인 뒤에도 남는 것들. **육안 확인 후에만** 적용하라.

- `skin_normal` 2048²인데 파일이 0.01MB — 실질 정보가 거의 없다. `skin_color`는 1024².
  1024로 내리면 VRAM 16MB 절감
- `hair_color`(0.20MB)와 `hair_color-hair_alpha`(0.43MB) — 알파 유무만 다른 동일 아트로 보인다.
  **픽셀 비교로 실제 동일한지 확인한 뒤** 병합. 21.3MB 절감

### D. `.v3` 갱신

에셋을 통째로 교체하므로 `preloadGLB.ts`의 `.v2` → `.v3`, `use-character-materials.ts`와
`use-scene-prop-materials.ts`의 텍스처 경로도 함께. **안 올리면 immutable 캐시 때문에
기존 방문자에게 옛 파일이 계속 서빙된다.**

### E. 파이프라인은 기존 스크립트에 이어 붙인다

`scripts/optimize-models.mjs` / `optimize-textures.mjs`가 이미 있다. **새 스크립트를 만들지 마라.**
원본은 `assets-src/`에 `inspect` 베이스라인과 함께 백업되어 있으니 거기서 출발한다.

## 하지 말 것

- 지오메트리·애니메이션·본 구조를 건드리지 마라. 스킬 Step 2·3의 금지 목록
  (`flatten`/`join`/`palette`/`instance`/`simplify`/`weld`/단독 `quantize`/`optimize` 프리셋) 준수.
- Meshopt를 빼거나 Draco로 되돌리지 마라. #93의 결정이다.
- 머티리얼 파라미터·조명·톤매핑을 튜닝하지 마라. 압축 때문에 색이 달라 보이면
  **압축 설정을 조정하라.**
- `app/layout.tsx`나 프리로더 마운트 위치를 건드리지 마라 (브랜치 02).
- `use-character-instance.ts`의 `useFrame` 블록을 건드리지 마라 (브랜치 03).

## 검증

1. `pnpm run check-types && pnpm run lint && pnpm run test:vitest`
2. **VRAM 실측이 이 브랜치의 성적표다.**
   ```js
   renderer.info.memory   // { geometries, textures }
   ```
   전후를 기록하고 PR에 표로 넣어라. 목표 ≈50MB.
3. `gltf-transform inspect`로 노드 22개 이름·애니메이션 4클립·모프 타깃 보존 확인
   (스킬 Step 4). `assets-src/`의 베이스라인과 대조.
4. **화질 비교** — 전후 같은 카메라 위치 스크린샷:
   얼굴 클로즈업(피부·눈) / 머리카락 알파 경계 / 옷 / 헤드폰·노트북 금속면 / 소품 나뭇결
5. **Safari(iOS 포함) 필수.** 지원 포맷이 달라 Safari에서만 깨지는 사례가 흔하다.
6. `pnpm run test:browser`

## 커밋 분할 제안

1. `⚡ perf: 런타임에 덮어써지는 roughness 텍스처 제거 (VRAM 90MB)`
2. `🔧 chore: basis transcoder self-host + KTX2 로더 배선`
3. `⚡ perf: 캐릭터·소품 텍스처를 KTX2로 전환`
4. `⚡ perf: 독립 ORM 텍스처를 KTX2로 전환`
5. `⚡ perf: 과대 해상도 노멀맵 다운스케일과 hair color 병합`
6. `🔧 chore: 에셋 버전을 .v3으로 갱신`

`⚡ perf:`는 변형 선택자 없는 U+26A1 `⚡`여야 husky 훅을 통과한다.

## PR 문서

`docs/pr/3d-vram-ktx2.md`. 설계 섹션에 "왜 파일이 아니라 VRAM이 목표인가",
"왜 노멀만 UASTC인가", "캔버스 2개에서 detectSupport를 어떻게 다뤘는가"를 쓸 것.
**VRAM 실측 전후 표와 화질 비교 스크린샷이 이 PR의 본체다.**
후속 섹션에 #93이 남긴 `skins 1 → 12` 구조 변화 관찰을 기록해 둘 것.
```

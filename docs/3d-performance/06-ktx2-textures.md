# 06. KTX2 텍스처 전환 — `perf/3d-ktx2-textures`

- **효과**: 파일 크기 −60%, **GPU VRAM −75%** (≈390MB → ≈150MB)
- **의존**: **브랜치 `01` 병합 후에 시작할 것.** 지울 텍스처를 압축해봐야 의미가 없다
- **위험도**: 높음 — 압축 아티팩트로 화질이 눈에 띄게 나빠질 수 있다
- **관련 발견**: F-4, F-10

---

## 프롬프트

```
`docs/3d-performance/README.md`를 먼저 읽고, 브랜치 `01`(`perf/3d-strip-dead-textures`)이
병합되었는지 확인하라. 병합 전이면 시작하지 마라 — 곧 지워질 텍스처를 압축하게 된다.

이 작업은 그 문서의 F-4, F-10을 해결한다.

## 배경

코드베이스에 `KTX2Loader`, `MeshoptDecoder` 참조가 0건이다. 모든 텍스처가 PNG라
GPU에 RGBA8 비압축으로 올라간다. **VRAM은 파일 크기가 아니라 해상도로 결정되므로,
PNG를 아무리 잘 최적화해도 VRAM은 1바이트도 안 줄어든다.**

브랜치 `01` 이후에도 남는 VRAM은 약 390MB이고, 홈 페이지는 WebGL 컨텍스트가 2개라
같은 텍스처가 각 컨텍스트에 따로 업로드된다. KTX2(GPU 압축 포맷)로 가야 실제로 줄어든다.

## 목표

### A. 압축 방식 선택

| 텍스처 종류 | 권장 | 이유 |
|---|---|---|
| color (baseColor) | ETC1S | 압축률 우선, 색상은 아티팩트가 덜 보임 |
| ORM (roughness/metal/AO) | ETC1S | 스칼라 데이터, 정밀도 요구 낮음 |
| normal map | **UASTC** | ETC1S로 압축하면 노멀이 눈에 띄게 깨진다 |

`gltf-transform`의 `etc1s` / `uastc` 커맨드, 또는 `toktx`/`basisu`를 쓴다.
브랜치 `01`이 `scripts/optimize-3d-assets.mjs`를 만들었으므로 **거기에 이어 붙여라.**
새 스크립트를 만들지 마라.

### B. GLB 내부 텍스처 (`character.glb`)

`KHR_texture_basisu` 확장으로 변환. 로더 쪽 배선이 필요하다:

- `KTX2Loader`를 만들고 **transcoder 파일을 self-host**하라.
  `three/examples/jsm/libs/basis/`의 파일들을 `public/basis/`로 복사하고
  `setTranscoderPath('/basis/')`. CDN 의존을 만들지 마라.
- `useGLTF`(drei)에 물리는 방법: 네 번째 인자 `extendLoader`를 쓴다.
  ```ts
  useGLTF(path, true, true, (loader) => {
    loader.setKTX2Loader(ktx2Loader.detectSupport(gl));
  });
  ```
  `detectSupport`에는 실제 `WebGLRenderer`가 필요하다 (`useThree(s => s.gl)`).
- **함정**: 홈에는 canvas가 2개다. 렌더러가 다르면 지원 포맷 감지도 따로 해야 한다.
  `KTX2Loader` 인스턴스를 렌더러별로 관리하거나, 두 canvas가 같은 포맷 집합을 쓰는지
  확인하고 근거를 남겨라. 여기가 이 브랜치에서 가장 틀리기 쉬운 지점이다.

### C. 독립 텍스처 (`public/textures/*.png`)

`useTexture`(drei)는 KTX2를 로드하지 못한다. `useKTX2`로 교체해야 한다:

- `src/entities/character/lib/use-character-materials.ts` — ORM 4종
- `src/entities/scene/lib/use-scene-prop-materials.ts` — room ORM
  (브랜치 `01`이 room color/normal도 여기로 옮겼다면 그것들도)

`prepareOrmTexture`의 `flipY = false`가 KTX2에서도 필요한지 확인하라 —
KTX2는 컨테이너 레벨에서 방향을 다루므로 동작이 다를 수 있다. **UV가 뒤집히면 여기가 원인이다.**

### D. 폴백 경로

KTX2는 `detectSupport`가 실패하면 로드가 실패한다. 데스크톱/모바일 주요 브라우저는
ASTC/ETC/BC 중 하나를 지원하지만, 확인되지 않는 환경이 있다.
- `useSceneWebglAvailability`(`src/shared/lib/dom/`)에 이미 WebGL 가용성 판단 훅이 있다.
  포맷 미지원 시의 동작을 정하고 문서화하라.
- PNG 폴백을 병행 유지하면 자산이 두 벌이 된다. **권장하지 않는다** —
  대신 로드 실패를 조용히 삼키지 말고 기존 fallback UI(`SceneBrowserFallback`)로
  떨어뜨리는 게 낫다. 선택과 근거를 PR에 남겨라.

### E. 함께 처리할 F-10 항목

브랜치 `01`에서 처리하지 않았다면 여기서:
- `skin_normal` 2048² → 1024² (파일이 0.10MB라 실질 정보가 거의 없다.
  `skin_color`도 1024²다). 육안 확인 후 결정.
- `hair_color`(1.28MB)와 `hair_color-hair_alpha`(1.26MB) 병합 — 동일 아트로 보인다.
  실제로 같은지 픽셀 비교로 확인한 뒤에 병합하라.
- `hair_ORM.png`만 RGBA8이고 나머지 ORM은 Palette8이다. KTX2 변환이 이걸 흡수한다.

## 하지 말 것

- 지오메트리, 애니메이션, 본 구조를 건드리지 마라.
- Draco를 빼지 마라. 지오메트리 0.40MB는 이미 충분히 작다.
  (다만 drei의 기본 Draco 디코더가 외부 CDN(gstatic)을 가리키는지 확인하고,
  그렇다면 self-host로 옮겨라 — transcoder를 self-host하는 김에 같이. 이건 해도 된다.)
- 머티리얼 파라미터, 조명, 톤매핑을 튜닝하지 마라. 압축 때문에 색이 달라 보이면
  **압축 설정을 조정하라**, 조명을 만지지 마라.
- 로더 설정을 컴포넌트 안에 흩뿌리지 마라. `src/shared/lib/three/`에 모아라
  (`orm-material.ts`가 이미 거기 있다).

## 검증

1. `pnpm run check-types && pnpm run lint && pnpm run test:vitest`
2. **화질 검증이 이 브랜치의 핵심이다.** 변환 전후를 같은 카메라 위치에서 비교:
   - 얼굴 클로즈업 (스크롤 시퀀스 끝) — 피부 그라데이션과 눈
   - 머리카락 — 알파 경계와 노멀
   - 옷 — 가장 큰 텍스처(`outfit_color` 2.88MB, `outfit_normal` 3.14MB)
   - 헤드폰/노트북 금속 표면 — ORM 정밀도가 낮으면 여기서 티가 난다
   - 소품(소파/테이블/베이스) 나뭇결
   - 각 항목 전후 스크린샷을 PR에 첨부
3. VRAM 실측:
   ```js
   // 콘솔에서
   renderer.info.memory  // { geometries, textures }
   ```
   그리고 `chrome://gpu` 또는 Performance 프로파일의 GPU 메모리를 전후 비교.
4. 크로스 브라우저: Chrome, Safari(iOS 포함), Firefox에서 텍스처가 정상 로드되는지.
   지원 포맷이 다르므로 Safari에서 깨지는 사례가 흔하다.
5. `pnpm run test:browser`
6. **브랜치 `03`이 병합되어 있다면 `SCENE_ASSET_VERSION`을 반드시 올려라.**
   자산이 전부 교체되므로 올리지 않으면 기존 방문자가 캐시된 PNG 경로를 계속 쓴다.

## 커밋 분할 제안

1. `🔧 chore: basis transcoder와 draco 디코더 self-host 전환`
2. `🔧 chore: 자산 최적화 스크립트에 KTX2 변환 단계 추가`
3. `⚡ perf: 캐릭터 GLB 텍스처를 KTX2로 전환`
4. `⚡ perf: 독립 ORM 텍스처를 KTX2로 전환`
5. `🔧 chore: 자산 버전 상수 갱신`

`⚡ perf:`는 변형 선택자 없는 U+26A1 `⚡`를 써야 husky 훅을 통과한다.

## PR 문서

`docs/pr/3d-ktx2-textures.md`. 설계 섹션에 "왜 노멀만 UASTC인가", "canvas가 2개일 때
detectSupport를 어떻게 다뤘는가", "폴백 전략과 그 근거"를 쓸 것.
VRAM 실측 전후 표와 화질 비교 스크린샷이 이 PR의 본체다.
```

# 02. 프리로드 범위 축소 — `perf/3d-preload-scope`

- **효과**: 3D를 쓰지 않는 모든 라우트에서 48MB 다운로드 제거
- **의존**: 없음
- **위험도**: 낮음~중간 — 홈 진입 체감 로딩이 느려지지 않는지가 관건
- **관련 발견**: F-5

---

## 프롬프트

```
`docs/3d-performance/README.md`를 먼저 읽어라. 이 작업은 그 문서의 F-5를 해결한다.

## 배경

`SceneAssetPreloader`가 **루트 레이아웃** `src/app/layout.tsx:30`에 있다.
이 컴포넌트는 마운트되면 `useGLTF.preload`로 GLB 4개(합계 41MB)를 즉시 받기 시작한다.

결과적으로 `/articles`, `/articles/tag/*`, `/resume`, admin 등 3D를 전혀 렌더하지 않는
모든 페이지가 41MB를 다운로드한다. 이 라우트들에서는 순수 낭비다.

## 목표

3D 프리로드를 **실제로 3D를 쓰는 곳**으로 좁히고, 거기서도 초기 렌더 경로를 막지 않게 미룬다.

### A. 프리로더를 홈 라우트로 이동

- `src/app/layout.tsx`에서 `<SceneAssetPreloader />` 제거
- 홈 뷰(`src/views/home/ui/home-page.tsx`) 또는 홈 라우트 레이아웃으로 이동
- 3D를 쓰는 다른 진입점이 있는지 먼저 확인하라:
  ```
  grep -rn "HomeHeroStage\|ContactScene\|SceneProp\|useCharacterInstance" src --include=*.tsx | grep -v test
  ```
  FSD 상 어느 레이어에 두는 게 맞는지 판단하고 PR 문서에 근거를 남길 것.

### B. 프리로드 시점을 늦춘다

지금은 `useEffect`에서 즉시 실행이라 홈의 초기 페인트/하이드레이션과 대역폭을 다툰다.
`requestIdleCallback`(폴백 `setTimeout`)으로 미루거나, 히어로 canvas가 뷰포트에 들어올 때
시작하도록 바꿔라.

판단 기준: **홈 첫 화면이 히어로 3D 씬 자체**라면 지연이 오히려 손해다. 실제 홈 구조
(`src/views/home/ui/home-page.tsx`)를 확인하고 결정하라. 히어로가 첫 화면이면
"idle 지연"만 적용하고 뷰포트 게이팅은 하지 마라.

### C. 소품과 캐릭터의 우선순위 분리 검토

`character.glb`(31.5MB)와 소품 3종(9.3MB)이 지금은 동시에 시작된다.
`src/entities/scene/model/preloadGLB.ts`의 `preloadSceneGlbs`는 배열 순서대로 등록만 하고
동시성 제어가 없다. 캐릭터가 먼저 완료되는 게 체감상 유리한지 확인하고, 그렇다면
캐릭터 → 소품 순차 프리로드를 검토하라. **과설계하지 마라** — 측정해서 차이가 없으면 하지 마라.

## 하지 말 것

- `preloadGLB.ts`의 **경로 정의(`sceneModelPaths`)를 재구조화하지 마라.**
  브랜치 `03`이 이 파일을 `scene-asset-paths.ts`로 재편한다. 소비만 하라.
- 자산 파일(`public/**`) 자체를 건드리지 마라. 브랜치 `01`의 범위다.
- `Suspense` 경계나 로딩 셸(`SceneLoadingShell`) UI를 바꾸지 마라.

## 검증

1. `pnpm run check-types && pnpm run lint && pnpm run test:vitest`
   - `src/entities/scene/ui/scene-asset-preloader.test.tsx`가 있다. 계약이 바뀌면 갱신하라.
   - `src/app/layout.tsx`를 참조하는 테스트가 있는지 확인.
2. **네트워크 탭 검증이 핵심이다.** `pnpm dev` 후 DevTools Network를 `glb`로 필터:
   - `/articles` 진입 → GLB 요청 **0건**이어야 한다
   - `/resume` 진입 → GLB 요청 **0건**
   - `/` 진입 → GLB 4건, 그리고 초기 HTML/JS/폰트 요청을 막지 않는지 확인
   - `/articles` → `/` 클라이언트 네비게이션 시에도 정상 시작되는지
3. `pnpm run test:browser:smoke`
4. 홈 진입 후 3D 씬이 뜨기까지의 체감 시간이 before 대비 나빠지지 않았는지 확인.
   나빠졌다면 B의 지연 전략을 되돌려라.

## 커밋 분할 제안

1. `⚡ perf: 3D 자산 프리로드를 루트 레이아웃에서 홈 라우트로 이동`
2. `⚡ perf: 3D 프리로드를 idle 시점으로 지연`
3. `🧪 test: 프리로더 마운트 범위 계약 테스트 갱신`

`⚡ perf:`는 변형 선택자 없는 U+26A1 `⚡`를 써야 husky 훅을 통과한다.

## PR 문서

`docs/pr/3d-preload-scope.md`. 설계 섹션에 "왜 루트 레이아웃이 아니라 여기인가"와
"지연을 넣었는가 / 안 넣었다면 왜"를 근거와 함께. 라우트별 네트워크 탭 전후 비교를 넣을 것.
```

# 02. 프리로드 범위 축소 — `perf/3d-preload-scope`

> ✅ **완료 — #98로 머지됨** (`perf/3d-preload-scope`)
>
> 아래는 작업 당시의 지시서다. **새 작업의 출발점으로 쓰지 마라** — 그때의 코드·경로 기준으로
> 쓰여 있어 지금과 다르다. 현재 상태는 [README](./README.md)를 본다.

- **효과**: 3D를 쓰지 않는 모든 라우트에서 9.6MB 다운로드 제거
- **의존**: 없음
- **위험도**: 낮음~중간 — 홈 진입 체감 로딩이 나빠지지 않는지가 관건
- **관련 발견**: F-3

---

## 프롬프트

```
`docs/3d-performance/README.md`를 먼저 읽어라. 이 작업은 F-3을 해결한다.

## 배경

`SceneAssetPreloader`가 **루트 레이아웃** `src/app/layout.tsx:30`에 있다.
마운트되면 `preloadSceneGlbs`로 GLB 4개(합계 9.6MB)를 즉시 받기 시작한다.

`/articles`, `/articles/tag/*`, `/resume`, admin 등 3D를 전혀 렌더하지 않는 라우트가
전부 이걸 받는다. PR #93이 총량을 48MB → 9.6MB로 줄여 임팩트는 작아졌지만,
안 쓰는 페이지에서는 여전히 100% 낭비다.

## 목표

### A. 프리로더를 홈 라우트로 이동

- `src/app/layout.tsx`에서 `<SceneAssetPreloader />` 제거
- 홈 뷰(`src/views/home/ui/home-page.tsx`) 또는 홈 라우트 레이아웃으로 이동
- 3D를 쓰는 다른 진입점이 있는지 먼저 확인하라:
```

grep -rn "HomeHeroStage\|ContactScene\|SceneProp\|useCharacterInstance" src --include=\*.tsx | grep -v test

```
FSD상 어느 레이어에 두는 게 맞는지 판단하고 PR 문서에 근거를 남길 것.

> **주의:** `scene-asset-preloader.tsx`는 프리로드만 하는 파일이 아니다.
> 모듈 최상위에서 `useGLTF.setDecoderPath('/decoders/draco/')`를 호출한다(PR #93).
> 컴포넌트를 옮기면 이 부수효과가 언제 평가되는지도 같이 바뀐다.
>
> **당장 깨지지는 않는다** — 파일 주석대로 현재 GLB는 전부 Meshopt라 Draco 디코더가
> 실제로 페치되지 않는다. 이 설정은 "향후 Draco GLB가 들어와도 CDN을 안 때리게" 하는
> 방어적 조치다. 그래서 이 브랜치에서 무언가 즉시 고장 나지는 않는다.
>
> 그래도 **디코더 경로 설정과 프리로드를 분리하는 쪽을 권한다.** 지금은 무해하지만,
> 나중에 Draco 자산이 하나라도 들어오면 "홈에 안 들어온 사용자만 CDN을 때리는"
> 재현 어려운 버그가 된다. 분리하면 그 가능성이 사라지고, 두 관심사가 한 파일에
> 묶여 있을 이유도 없다. 분리하지 않기로 했다면 **그 판단을 PR에 근거와 함께 남겨라.**

### B. 프리로드 시점을 늦춘다

지금은 `useEffect`에서 즉시 실행이라 홈의 초기 페인트/하이드레이션과 대역폭을 다툰다.
`requestIdleCallback`(폴백 `setTimeout`)으로 미루는 것을 검토하라.

판단 기준: **홈 첫 화면이 히어로 3D 씬 자체**라면 지연이 오히려 손해다.
`src/views/home/ui/home-page.tsx` 구조를 확인하고 결정하라. 히어로가 첫 화면이면
지연을 넣지 말고, 넣지 않은 이유를 PR에 남겨라.

> PR #93이 두 캔버스에 `<Preload all />`을 넣어 첫 가시화 전에 셰이더 컴파일과
> 텍스처 업로드를 끝내도록 했다. 프리로드 시점을 바꾸면 이 동작과 상호작용한다 —
> 실제로 첫 화면이 느려지지 않는지 반드시 눈으로 확인하라.

## 하지 말 것

- `preloadGLB.ts`의 **경로 상수를 수정하지 마라.** 브랜치 01이 `.v3`으로 올린다.
- 자산 파일(`public/**`)을 건드리지 마라 (브랜치 01).
- `use-character-instance.ts`의 `useFrame`을 건드리지 마라 (브랜치 03).
- `Suspense` 경계나 `SceneLoadingShell` / `SceneBrowserFallback` UI를 바꾸지 마라.
- `<Preload all />`을 제거하지 마라.

## 검증

1. `pnpm run check-types && pnpm run lint && pnpm run test:vitest`
 - `scene-asset-preloader` 관련 테스트가 있다. 계약이 바뀌면 갱신하라.
2. **네트워크 탭 검증이 핵심이다.** `pnpm dev` 후 DevTools Network를 `glb`로 필터:
 - `/articles` 진입 → GLB 요청 **0건**
 - `/resume` 진입 → GLB 요청 **0건**
 - `/` 진입 → GLB 4건, 초기 HTML/JS/폰트를 막지 않는지
 - `/articles` → `/` 클라이언트 네비게이션에서도 정상 시작되는지
3. **외부 CDN 회귀 확인** — Network에서 `gstatic.com`으로 나가는 요청이 **0건**인지 확인.
 (현재 GLB가 전부 Meshopt라 이 검사는 양쪽 다 통과할 가능성이 높다 — 통과했다고
 디코더 경로 설정이 옳은 자리에 있다는 뜻은 아니다.)
4. 홈 진입 후 3D가 뜨기까지의 체감 시간이 before 대비 나빠지지 않았는지.
 나빠졌다면 B의 지연을 되돌려라.
5. `pnpm run test:browser:smoke`

## 커밋 분할 제안

1. `♻️ refactor: Draco 디코더 경로 설정을 프리로드와 분리` (분리하기로 했다면)
2. `⚡ perf: 3D 자산 프리로드를 루트 레이아웃에서 홈 라우트로 이동`
3. `🧪 test: 프리로더 마운트 범위 계약 테스트 갱신`

`⚡ perf:`는 변형 선택자 없는 U+26A1 `⚡`여야 husky 훅을 통과한다.

## PR 문서

`docs/pr/3d-preload-scope.md`. 설계 섹션에 "왜 루트 레이아웃이 아니라 여기인가",
"디코더 경로 설정을 분리했는가 / 안 했다면 왜"(현재는 무해하지만 판단 근거를 남길 것),
"지연을 넣었는가 / 안 넣었다면 왜"를 쓸 것. 라우트별 네트워크 탭 전후 비교 첨부.
```

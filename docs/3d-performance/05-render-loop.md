# 05. 렌더 루프 정리 — `perf/3d-render-loop`

- **효과**: 오프스크린 GPU/CPU 낭비 제거, 불필요한 MSAA 제거, 배터리 개선
- **의존**: 없음 (브랜치 `04`와 인접하지만 파일이 다름)
- **위험도**: 중간 — `frameloop="demand"`는 갱신 누락을 만들기 쉽다
- **관련 발견**: F-8, F-9

---

## 프롬프트

```
`docs/3d-performance/README.md`를 먼저 읽어라. 이 작업은 그 문서의 F-8, F-9를 해결한다.

## 배경

코드베이스에 `frameloop`, `invalidate()` 참조가 **0건**이다. 홈 페이지에는 canvas가 2개
(hero + contact) 있고 둘 다 항상 60fps로 렌더한다. contact 씬은 캐릭터 idle 외에
움직이는 게 없는 정적 씬인데, 스크롤로 화면을 완전히 벗어나도 계속 그린다.

또 hero canvas는 `gl={{ alpha: true, antialias: true, premultipliedAlpha: false }}`인데
`OutlineEffect`(`src/features/interaction/ui/outline-effect.tsx`)가 `EffectComposer`로
자체 렌더 타깃에 그린다. 이 경우 기본 프레임버퍼의 MSAA는 결과에 기여하지 않고 비용만 든다.

## 목표

### A. `antialias` 정리 (hero canvas만)

- `src/widgets/home-hero-scene/ui/home-hero-stage-canvas.tsx`: 컴포저가 활성일 때
  (`renderQuality.enableOutlineComposer === true`) 기본 MSAA는 낭비다.
- **함정**: `enableOutlineComposer`는 `sceneViewportMode`에 따라 false가 될 수 있다
  (`getHomeHeroSceneRenderQuality` — stacked 모드에서 false). 컴포저가 없을 때는
  AA가 필요하다. `antialias`는 canvas 생성 시점 컨텍스트 속성이라 런타임 토글이 안 되고,
  값을 바꾸면 R3F가 컨텍스트를 재생성한다.
- 따라서 선택지는 둘이다:
  1. `antialias: false`로 고정하고, 컴포저 경로에는 `SMAAEffect`를,
     비컴포저(stacked) 경로에는 별도 AA 대책을 마련
  2. 지금처럼 두되 컴포저의 `multisampling`을 명시적으로 0으로 두어 이중 MSAA만 방지
  **측정 후 결정하라.** stacked 모드는 dpr 상한이 1.25라 AA 없이 계단이 눈에 띌 수 있다.
  `contact-scene-canvas.tsx`는 컴포저가 없으므로 `antialias: true`를 **유지**하라.

### B. contact canvas 오프스크린 정지

`src/widgets/contact-scene/ui/contact-scene-canvas.tsx`는 정적 씬이다.
IntersectionObserver로 뷰포트 밖일 때 렌더를 멈춰라.

- `frameloop="never"` ↔ `"always"` 전환, 또는 `frameloop="demand"` + 명시적 `invalidate()`
- **함정**: 캐릭터 idle 애니메이션이 계속 돌아야 하므로 `demand`로 가면 매 프레임
  `invalidate()`가 필요해져 의미가 없다. 뷰포트 안에서는 `always`, 밖에서는 `never`가 맞다.
- **함정**: 정지 중에도 `AnimationMixer`의 시간은 흐르지 않으므로, 다시 보일 때
  애니메이션이 이어진다. 이게 원하는 동작인지 확인하라 (대체로 맞다).
- `document.visibilityState`가 `hidden`일 때도 멈춰라. 탭 백그라운드에서 rAF는
  브라우저가 이미 억제하지만, 명시적으로 다루는 편이 안전하다.
- AGENTS.md §3의 "Hook and View Split" 규칙: IntersectionObserver 배선은
  전용 훅(`src/widgets/contact-scene/model/`)으로 빼고, 순수 분기는 Node 테스트로.

### C. hero canvas 오프스크린 검토

홈 히어로도 스크롤로 완전히 벗어날 수 있다. 다만 스크롤 시퀀스
(`use-scroll-timeline`, `use-home-hero-scene-transition`)가 스크롤에 반응해야 하므로
**섣불리 멈추면 시퀀스가 깨진다.** 시퀀스가 완전히 끝난(progress === 1) 이후에만
정지하는 식으로 접근하고, 조금이라도 애매하면 **하지 마라.** 이 브랜치의 주 목표는 B다.

### D. 조명 그림자 비용 확인 (선택)

`HomeHeroStageLights`의 `directionalLight castShadow`와 캐릭터 모든 메시의
`castShadow = true`(`prepare-character-instance.ts`, `scene-prop.tsx`)가 있다.
shadow map 해상도가 기본값(512)인지 확인하고, 필요하면 명시하라. **화면이 바뀌면 되돌려라.**

## 하지 말 것

- `use-character-instance.ts`의 믹서 갱신 로직을 건드리지 마라 (브랜치 `04`).
- 자산/경로/프리로드를 건드리지 마라 (브랜치 `01`, `02`, `03`).
- 카메라 레이아웃, `OrbitControls` 파라미터, 스크롤 시퀀스 타이밍을 바꾸지 마라.
- `renderQuality`의 dpr 값들을 바꾸지 마라. 이미 뷰포트별로 조율되어 있다.

## 검증

1. `pnpm run check-types && pnpm run lint && pnpm run test:vitest`
2. **육안 + 계측 둘 다 필요하다.**
   - DevTools Performance로 홈에서 contact 영역이 화면 밖일 때 rAF/GPU 작업이
     실제로 줄었는지 (전/후 프로파일 스크린샷을 PR에 첨부)
   - `renderer.info.render.calls`를 로깅해 정지 여부 확인
3. 확인할 시나리오:
   - contact 영역으로 스크롤 → 벗어남 → 다시 진입. 애니메이션이 정상 재개되는가
   - 탭을 백그라운드로 보냈다가 복귀
   - 리사이즈로 `layoutMode`가 `hidden` ↔ `split`로 바뀔 때
   - stacked(좁은) 뷰포트에서 AA 품질 — A의 결정에 따라 계단이 생기지 않았는지
   - hover outline이 정상 동작하는가 (컴포저 경로)
4. `pnpm run test:browser` (스모크가 아니라 전체 — canvas 상호작용 계약이 걸려 있다)

## 커밋 분할 제안

1. `♻️ refactor: contact 씬 뷰포트 가시성 훅 분리`
2. `⚡ perf: contact canvas를 오프스크린에서 정지`
3. `⚡ perf: 컴포저 사용 시 중복 MSAA 제거`
4. `🧪 test: 가시성 기반 렌더 루프 전환 계약 테스트 추가`

`⚡ perf:`는 변형 선택자 없는 U+26A1 `⚡`를 써야 husky 훅을 통과한다.

## PR 문서

`docs/pr/3d-render-loop.md`. 설계 섹션에 "왜 demand가 아니라 always/never 전환인가"
(idle 애니메이션 때문), "hero canvas는 왜 손대지 않았는가"(스크롤 시퀀스 의존)를
명시하라. 후자는 "의도적으로 안 한 것"으로 남기는 게 리뷰어에게 정보다.
```

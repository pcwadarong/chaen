# 03. 믹서 프레임 가드 수정 — `fix/character-mixer-frame-guard`

- **효과**: 애니메이션 재생 속도 정확화 + 오프스크린 스켈레톤 갱신 제거
- **의존**: 없음
- **위험도**: 중간 — 애니메이션 타이밍이 눈에 보이게 바뀐다 (의도된 변화)
- **관련 발견**: F-4

---

## 프롬프트

```
`docs/3d-performance/README.md`를 먼저 읽어라. 이 작업은 F-4를 해결한다.

## 배경

`src/entities/character/model/use-character-instance.ts:82`:

```ts
useFrame((state, delta) => {
  const currentFrame = state.gl.info.render.frame;
  if (characterCache.lastUpdatedFrame === currentFrame) return;
  characterCache.lastUpdatedFrame = currentFrame;
  // frameloop가 'never'에서 재개될 때 delta가 크게 튀는 것을 방지하기 위해 상한을 둔다.
  const clampedDelta = Math.min(delta, 1 / 30);
  characterCache.mainMixer.update(clampedDelta);
  characterCache.contactMixer.update(clampedDelta);
});
```

가드의 의도는 "한 프레임에 믹서를 한 번만 갱신"이다. 하지만:

1. 홈 페이지에는 hero canvas와 contact canvas가 **동시에** 마운트된다. 각 canvas는
   자기 `WebGLRenderer`를 가지고, `useCharacterInstance`가 각각 호출되어
   **두 개의 독립적인 `useFrame` 루프**가 돈다.
2. `gl.info.render.frame`은 **렌더러별 카운터**다. 두 렌더러의 카운터는 서로 무관하다.
3. contact canvas는 `dynamic({ ssr: false })`로 늦게 마운트되므로 카운터가 어긋난다.

결과: 매 rAF마다 두 캔버스가 각각 두 믹서를 갱신 → `delta` 이중 누적.
반대로 두 카운터가 우연히 일치하는 프레임에는 한쪽 갱신이 통째로 드롭된다.

**PR #93은 `clampedDelta`만 추가했고 가드 자체는 손대지 않았다.**

## 먼저 할 일: 현상 재현

고치기 전에 눈으로 확인하라. 그래야 고쳐졌는지 알 수 있다.

> **#93이 재현을 어렵게 만들었다.** `shared/lib/three/use-render-when-visible.ts`가
> contact 캔버스를 오프스크린/백그라운드에서 `frameloop` 정지시킨다.
> **contact 씬이 뷰포트 안에 있는 상태에서 측정해야 한다.** 화면 밖이면 증상이 안 나타나는데,
> 그건 버그가 없어서가 아니라 두 번째 루프가 안 돌기 때문이다.
>
> 또 클램프(`≤1/30`) 때문에 증상이 단순한 "2배속"이 아니라
> "프레임당 최대 2/30초 진행"으로 나타난다. 60fps에서 `delta ≈ 1/60`이면
> 클램프가 걸리지 않으므로 **정확히 2배**가 되고, 프레임이 떨어지면 배율이 달라진다.

재현 방법:
- `mainMixer.time`을 프레임마다 로깅해 실제 경과 시간 대비 증가율을 측정
- 또는 contact가 보이는 상태 / 안 보이는 상태에서 같은 idle 클립의 한 사이클 길이 비교
- 측정치를 PR 문서에 남길 것. **재현이 안 되면 추측으로 고치지 마라** — 원인을 다시 분석하라.

## 목표

각 믹서가 rAF당 정확히 한 번, 자기 캔버스의 `delta`로 갱신되게 한다.

### 방향 A (권장): 인스턴스별로 자기 믹서만 갱신

`useCharacterInstance`는 이미 `instance`(`'main' | 'contact'`)를 인자로 받는다.
각 훅 호출이 **자기 믹서만** 갱신하게 하면 공유 가드 자체가 불필요해진다.

```
main 인스턴스를 쓰는 캔버스의 useFrame → mainMixer.update(clampedDelta)
contact 인스턴스를 쓰는 캔버스의 useFrame → contactMixer.update(clampedDelta)
```

확인할 것 — 같은 인스턴스를 한 페이지에서 두 번 이상 마운트하는 곳이 있는가?
```
grep -rn "HomeHeroCharacterSeatSet\|useCharacterInstance" src --include=*.tsx | grep -v test
```
없다면 가드를 완전히 제거해도 된다. 있다면 **믹서 단위로** 마지막 갱신을 기록하되,
전역 프레임 번호가 아니라 렌더러 식별자와 프레임 번호의 조합을 키로 써야 한다.

### 반드시 유지할 것

- **`clampedDelta`(`Math.min(delta, 1/30)`)를 제거하지 마라.** `RenderWhenVisible`이
  `frameloop`을 정지·재개하므로, 재개 시 `delta`가 크게 튀는 것을 막는 안전장치다.
  #93이 의도적으로 넣은 것이다.
- 오프스크린 정지 자체는 이미 `use-render-when-visible.ts`가 처리한다.
  여기서 별도 가시성 로직을 추가하지 마라.

### 함께 볼 것

`characterInstanceCache`는 모듈 스코프 싱글턴이다. `lastUpdatedFrame` 필드가 없어지면
캐시 타입도 정리하라. 라우트 이동 후 재마운트 시 캐시 동작에 문제가 보이면
**이 브랜치에서 고치지 말고** PR 후속 섹션에 남겨라.

## 하지 말 것

- 애니메이션 클립, `character-state-machine`, `use-character-animation`의 전환 로직
- `use-render-when-visible.ts`, `frameloop`, `<Preload all />`, 캔버스 설정
- 자산 파일이나 경로 상수 (브랜치 01)
- 프리로더 마운트 위치 (브랜치 02)

## 검증

1. `pnpm run check-types && pnpm run lint && pnpm run test:vitest`
2. **회귀 테스트를 추가하라.** AGENTS.md §3의 계약 서술 규칙을 따를 것.
   - 프레임 갱신 판단을 순수 헬퍼로 뺄 수 있으면 Node 버킷, 훅 배선이면 `test:dom:model`
   - 계약 예: "두 개의 독립적인 렌더러가 각자 프레임을 진행할 때,
     각 믹서는 자신이 속한 렌더러의 delta로 정확히 한 번만 갱신되어야 한다"
3. 재현 절차를 다시 돌려 이중 누적이 사라졌는지 확인 (contact가 **보이는** 상태에서).
4. 확인할 시나리오:
   - 홈 — idle / music / typing / notification 전부
   - contact가 보일 때 / 화면 밖일 때 / 다시 진입할 때 (재개 시 점프 없는지)
   - 좁은 뷰포트 (contact 미마운트)
   - 눈 깜빡임(`use-blink-animation`), 하트(`use-heart-animation`) 타이밍
   - 스크롤 시퀀스 중 애니메이션 전환
   - 탭 백그라운드 → 복귀
5. `pnpm run test:browser`

## 커밋 분할 제안

1. `🧪 test: 캐릭터 믹서 프레임 갱신 계약 테스트 추가` (실패하는 상태로 먼저)
2. `🐛 fix: 렌더러별 프레임 카운터 충돌로 믹서가 이중 갱신되던 문제 수정`

## PR 문서

`docs/pr/character-mixer-frame-guard.md`. 설계 섹션에 "왜 `gl.info.render.frame`을
캔버스 간 가드로 쓸 수 없는가"를 정확히 설명하라 — 렌더러별 카운터라는 사실이 핵심이고
리뷰어가 가장 먼저 의심할 지점이다. 재현 측정치(전/후 사이클 길이)와,
`clampedDelta`를 왜 남겼는지를 함께 쓸 것.
```

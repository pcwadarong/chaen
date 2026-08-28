# 04. 믹서 프레임 가드 수정 — `fix/character-mixer-frame-guard`

- **효과**: 애니메이션 재생 속도 정확화 (현재 약 2배속 추정) + 오프스크린 스켈레톤 갱신 제거
- **의존**: 없음
- **위험도**: 중간 — 애니메이션 타이밍이 눈에 보이게 바뀐다. 의도된 변화지만 확인이 필요
- **관련 발견**: F-7

---

## 프롬프트

```
`docs/3d-performance/README.md`를 먼저 읽어라. 이 작업은 그 문서의 F-7을 해결한다.

## 배경

`src/entities/character/model/use-character-instance.ts:92`:

```ts
useFrame((state, delta) => {
  const currentFrame = state.gl.info.render.frame;
  if (characterCache.lastUpdatedFrame === currentFrame) return;
  characterCache.lastUpdatedFrame = currentFrame;
  characterCache.mainMixer.update(delta);
  characterCache.contactMixer.update(delta);
});
```

이 가드의 의도는 "한 프레임에 믹서를 한 번만 갱신"이다. 하지만:

1. 홈 페이지(`src/views/home/ui/home-page.tsx`)에는 hero canvas와 contact canvas가
   **동시에** 마운트된다. 각 canvas는 자기 `WebGLRenderer`를 가지고,
   `useCharacterInstance`가 각각 한 번씩 호출되어 **두 개의 독립적인 `useFrame` 루프**가 돈다.
2. `gl.info.render.frame`은 **렌더러별 카운터**다. 두 렌더러의 카운터는 서로 무관하다.
3. contact canvas는 `dynamic({ ssr: false })`로 늦게 마운트되므로 카운터가 반드시 어긋난다.

결과: 매 rAF마다 두 캔버스가 각각 두 믹서를 갱신한다 → `delta`가 두 번 누적
→ **애니메이션이 약 2배속으로 재생**된다. 반대로 두 카운터가 우연히 일치하는 프레임에는
한쪽 갱신이 통째로 드롭되어 미세한 끊김이 생긴다.

추가로, 화면 밖에 있는 contact 캐릭터의 스켈레톤이 항상 갱신된다.

## 먼저 할 일: 현상 재현

수정하기 전에 버그를 눈으로 확인하라. 그래야 고쳐졌는지 알 수 있다.

- 홈 페이지(hero + contact 둘 다 마운트)와 contact canvas가 마운트되지 않는 조건
  (`src/widgets/contact-scene/ui/contact-scene.tsx`의 `layoutMode === hidden`, 즉 좁은 뷰포트)에서
  같은 idle 애니메이션의 한 사이클 길이를 비교하라.
- 또는 `mainMixer.time`을 프레임마다 로깅해 `delta` 대비 증가율을 측정하라.
- 재현 결과를 PR 문서에 남길 것. 재현이 안 되면 원인을 다시 분석하고
  **추측으로 고치지 마라.**

## 목표

각 믹서가 rAF당 정확히 한 번, 자기 캔버스의 `delta`로 갱신되게 한다.

### 방향 A (권장): 인스턴스별로 자기 믹서만 갱신

`useCharacterInstance`가 `instance`를 이미 인자로 받는다. 각 훅 호출이 **자기 믹서만**
갱신하게 하면 공유 가드 자체가 필요 없어진다.

```
main 캐릭터를 쓰는 캔버스의 useFrame → mainMixer.update(delta)
contact 캐릭터를 쓰는 캔버스의 useFrame → contactMixer.update(delta)
```

확인할 것: 같은 인스턴스를 **한 페이지에서 두 번 이상** 마운트하는 곳이 있는가?
```
grep -rn "HomeHeroCharacterSeatSet\|useCharacterInstance" src --include=*.tsx | grep -v test
```
없다면 가드는 완전히 제거해도 된다. 있다면 **믹서 단위로** 마지막 갱신 프레임을 기록하되,
전역 프레임 번호가 아니라 렌더러 식별자와 프레임 번호의 조합을 키로 써야 한다.

### 방향 B: 오프스크린 정지

contact 캐릭터가 화면 밖일 때 믹서 갱신을 멈추는 것도 검토하라. 다만 이건
브랜치 `05`(렌더 루프)와 겹친다. **여기서는 하지 말고**, `05`가 canvas 단위로
`frameloop`을 끄면 자연히 해결된다. PR 후속 섹션에 그 연결을 명시할 것.

### 함께 볼 것

`characterInstanceCache`는 모듈 스코프 싱글턴이다. `lastUpdatedFrame` 필드가 없어지면
캐시 타입도 정리하라. 라우트 이동 후 재마운트 시 캐시가 어떻게 되는지도 한 번 확인하고,
문제가 있으면 PR의 후속 섹션에 남겨라 (이 브랜치에서 고치지는 마라).

## 하지 말 것

- 애니메이션 클립 자체나 `character-state-machine`, `use-character-animation`의
  전환 로직을 건드리지 마라.
- `frameloop`, `invalidate`, canvas 설정을 건드리지 마라 (브랜치 `05`).
- 자산 파일이나 경로를 건드리지 마라.

## 검증

1. `pnpm run check-types && pnpm run lint && pnpm run test:vitest`
2. **회귀 테스트를 추가하라.** AGENTS.md §3의 계약 서술 규칙을 따를 것.
   - 대상: 프레임 갱신 로직을 순수 함수/헬퍼로 뺄 수 있으면 Node 버킷,
     훅 배선이면 `test:dom:model`
   - 계약 예: "두 개의 독립적인 렌더러가 각각 프레임을 진행할 때,
     각 믹서는 자신이 속한 렌더러의 delta로 정확히 한 번만 갱신되어야 한다"
3. 재현 절차를 다시 돌려서 2배속이 사라졌는지 확인.
4. 확인할 시나리오:
   - 홈 (hero + contact 동시 마운트) — idle, music, typing, notification 전부
   - 좁은 뷰포트 (contact 미마운트)
   - 눈 깜빡임(`use-blink-animation`)과 하트(`use-heart-animation`) 타이밍
   - 스크롤 시퀀스 중 애니메이션 전환
5. `pnpm run test:browser:smoke`

## 커밋 분할 제안

1. `🧪 test: 캐릭터 믹서 프레임 갱신 계약 테스트 추가` (실패하는 상태로 먼저)
2. `🐛 fix: 캔버스별 렌더러 프레임 카운터 충돌로 믹서가 이중 갱신되던 문제 수정`

## PR 문서

`docs/pr/character-mixer-frame-guard.md`. 설계 섹션에 "왜 `gl.info.render.frame`이
캔버스 간 가드로 쓸 수 없는가"를 정확히 설명하라 — 렌더러별 카운터라는 사실이 핵심이고,
리뷰어가 가장 먼저 의심할 지점이다. 재현 측정치(전/후 사이클 길이)를 포함할 것.
```

---
name: test-strategy
description: chaen에서 어떤 Vitest 버킷에 테스트를 넣을지 정하고, 테스트 설명·셀렉터를 계약 기반으로 쓰는 절차 스킬. "테스트 작성", "테스트 추가", "이거 어느 버킷에", "vitest 버킷", "테스트 리뷰해줘" 요청 시 트리거한다. 버킷 선택 근거와 계약 기반 문장 규칙만 다루고, 컴포넌트/데이터 구현 절차는 다루지 않는다.
---

# Test-Strategy — Vitest 버킷 선택 + 계약 기반 테스트 작성

새/변경 코드에 테스트를 추가할 때 **어느 버킷에 넣을지**와 **테스트 설명·셀렉터를 어떻게 쓸지** 정하는 절차. 컴포넌트 구현은 `component` 스킬, 데이터 흐름은 `data-flow` 스킬을 참조.

> 규칙 기준: `AGENTS.md` §3(테스트 전략). 여기선 **버킷 판별 플로우차트와 실제 스크립트 명령**만 다룬다.

## Step 1: 버킷 판별

파일 하나를 놓고 위에서부터 순서대로 묻는다. 먼저 참인 조건이 그 파일의 버킷이다.

1. **DOM/브라우저 API 없이 순수 로직인가?** (Route Handler, Server Action, 유틸 함수, 쿼리 키 정규화) → `@vitest-environment node` 주석 달고 `test:node` 버킷.
2. **jsdom이 필요하지만 무거운 렌더링은 없는 `*.test.ts`(비-`.tsx`) 파일인가?** (훅 단위 테스트, model 배선 검증) → `test:dom:model` 버킷.
3. **일반적인 React 컴포넌트 렌더링/이벤트 테스트인가?** (`*.test.tsx`) → 기본값 `test:dom:ui` 버킷. **새 컴포넌트 테스트는 특별한 이유가 없는 한 여기로 간다.**
4. **`IntersectionObserver`/`ResizeObserver`/`requestAnimationFrame`/스크롤 컨테이너를 스텁해야 하는가?** → 버킷을 정하기 전에 먼저 멈춘다. 이 스텁이 필요해지는 순간이 **Hook/View Split** 신호다 — 관찰자·rAF 로직을 `model/use-*.ts` 훅으로 뽑아 `test:dom:model`에서 검증하고, 남은 뷰는 얕은 렌더 테스트만 `test:dom:ui`에 둔다.
5. **`scripts/run-vitest-group.mjs`에 이미 등재된 에디터급 무거운 jsdom 스위트인가?** → `test:dom:heavy`. **새로 여기 넣지 않는다** — 반복 전체 실행에서 일관되게 느리다는 게 확인된 후에만 `dom:ui`에서 승격한다.
6. **포커스 관리·포털 레이어링·실제 스크롤/뷰포트·canvas 브라우저 이벤트가 필요한가?** (jsdom으로 재현 불가능) → jsdom 버킷이 아니라 `tests/browser/`에 Playwright 스펙으로 작성, `test:browser` 대상.

```bash
pnpm run test:node
pnpm run test:dom:model
pnpm run test:dom:ui
pnpm run test:dom:heavy   # scripts/run-vitest-group.mjs에 등재된 항목만
pnpm run test:browser
pnpm run test:browser:smoke   # 최소 공개 진입점 스모크
```

버킷은 **비용 단위**지 아키텍처 레이어가 아니다 — "이 파일이 features에 있으니 dom:ui"가 아니라 위 판별 순서를 그대로 따른다.

## Step 2: 계약 기반 테스트 설명

형식: **"[조건/맥락]일 때, [주체]는 [기대 동작/상태 변화]해야 한다."**

- 나쁜 예: `"저장이 된다"`, `"버튼 클릭 시 동작"`, `"정상적으로 렌더된다"` — 조건과 결과가 한 문장에 없다.
- 좋은 예: `"유효한 사용자 데이터가 제출되었을 때, store의 user state는 전달된 payload로 갱신되어야 한다."`
- `"works"`/`"handles click"`/`"shows correctly"`류의 모호한 라벨은 그 자체로 리젝 사유다 — 조건+결과를 풀어 쓴다.

## Step 3: 셀렉터 규율

우선순위: `getByRole` → `getByLabelText` → 화면에 보이는 텍스트. `data-testid`는 다음 경우에만:

- 접근성 트리에 의미 있는 role/label이 없는 구조적 이음새(예: 3D 캔버스 mock, 포털 컨테이너).
- 이 외에는 Panda가 생성한 클래스명이나 우연한 DOM 중첩 구조를 assert하지 않는다 — 이는 레이아웃 구현 세부사항을 테스트가 얼려버리는 것(**UI Constraint Guardrail** 위반)이다.

## Step 4: 산개 방지(Scattering Rule)

기본은 co-located 테스트(`use-browse-articles.test.ts`를 `use-browse-articles.ts` 옆에). 단, 같은 setup 부담(같은 mock provider, 같은 fixture)을 진 1회성 파일이 한 슬라이스에 여러 개 쌓이면 계약 경계 단위로 통합한다. Playwright 스펙은 항상 `tests/browser/` 아래, 사용자 대면 계약 이름으로(`home.smoke.spec.ts`처럼).

## Step 5: CI 패리티

로컬(Asia/Seoul)과 CI(UTC)의 타임존 차이로 날짜 경계 테스트가 로컬에서만 통과하는 착시가 생길 수 있다. 의심되면:

```bash
TZ=UTC pnpm test:vitest
```

## 자가 확인

- [ ] 버킷 판별을 Step 1의 순서(node → dom:model → dom:ui → dom:heavy → browser)대로 했는가? `dom:heavy`에 새로 추가하지 않았는가?
- [ ] `IntersectionObserver`/`ResizeObserver`/rAF 스텁이 필요해졌을 때 Hook/View Split을 먼저 검토했는가?
- [ ] 모든 테스트 설명이 "[조건]일 때 [주체]는 [기대 결과]해야 한다" 형식인가? `"works"`/`"handles click"` 같은 모호한 라벨이 없는가?
- [ ] `getByRole`/`getByLabelText`/텍스트를 우선했고, `data-testid`는 접근성 트리에 의미가 없는 경우로 한정했는가?
- [ ] Panda 클래스명이나 우연한 DOM 구조를 assert하지 않았는가?
- [ ] 날짜/타임존 관련 실패가 의심되면 `TZ=UTC pnpm test:vitest`로 먼저 재현했는가?

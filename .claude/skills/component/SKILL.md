---
name: component
description: chaen에서 새 UI 컴포넌트·화면을 구현할 때의 절차 스킬. "컴포넌트 만들어줘", "화면 구현", "UI 추가", "페이지 만들어줘", "버튼/카드/시트 컴포넌트" 요청 시 트리거한다. FSD 레이어 배치·Panda 토큰·접근성을 강제한다.
---

# Component — UI 컴포넌트·화면 구현

컴포넌트를 만들 때의 레이어 배치·구조·스타일·접근성 절차. 데이터 패칭이 필요하면 **`data-flow` 스킬**과 함께 쓴다.

> 규칙 기준: `AGENTS.md` §1(FSD 아키텍처), §2(프론트엔드·스타일링 규칙), §5(접근성). 여기선 **구현 순서와 패턴**만 다룬다.

## Step 1: 레이어·위치 결정 (FSD)

새 UI를 어디 둘지는 "누가 이걸 소유하는가"로 정한다.

| 대상 | 위치 |
|---|---|
| 재사용 원자 UI(버튼·인풋·시트) | `src/shared/ui/*` |
| 여러 화면이 공유하는 독립 UI 블록 | `src/widgets/{block-name}/ui/*` |
| 사용자 상호작용/비즈니스 로직이 있는 기능 단위 | `src/features/{feature-name}/ui/*` (+ `model/`) |
| 도메인 데이터를 렌더링하는 엔티티 UI | `src/entities/{domain}/ui/*` |
| 페이지 컨테이너(화면 전체 조립) | `src/views/{page-name}/ui/{PageName}.tsx` |

- **기능 그룹핑 규칙**: 같은 도메인·상태 머신·라이프사이클을 공유하는 기능은 하나의 `features/` 슬라이스로 묶는다. 애니메이션 종류별로 슬라이스를 쪼개지 말고(나쁜 예: `play-character-blink`/`play-character-heart`), 상태를 공유하면 `character-animation/model/useBlink.ts`+`useHeart.ts`처럼 한 슬라이스 안에 모은다.
- **`app/`은 라우팅/레이아웃/메타데이터만** — 실제 화면 UI는 위 레이어에 두고 `app/[locale]/{route}/page.tsx`는 해당 `views` 컨테이너를 렌더하는 얇은 진입점으로 유지한다.
- **추출 시점**: 같은 패턴이 3회 이상/거의 동일할 때만 공통화. 그 전엔 인라인(이른 추상화 금지).

## Step 2: Client/Server 결정

- 서버 컴포넌트 기본값 유지. `'use client'`는 다음 중 하나가 실제로 필요할 때만: State/Effect, 브라우저 API, `next/navigation`, 복잡한 포털·포커스 관리.
- 스타일링 전용이거나 `next-intl` 정적 번역만 하는 컴포넌트는 client로 만들지 않는다.

## Step 3: 스타일 — Panda 토큰만

- Emotion·CSS Modules·`*.styles.ts` 금지. `css()`/`cva()`를 컴포넌트 파일에 co-locate.
- 픽셀 하드코딩 금지 — `src/shared/config/responsive.ts`의 `VIEWPORT_BREAKPOINTS`/`viewportMediaQuery`(panda.config.ts와 동기화됨)를 참조하거나 `token('breakpoints.sm')`/반응형 객체(`{base:'...', md:'...'}`) 사용.
- 외부에서 스타일을 얹는 유일한 통로는 `className` prop이다. margin/gap 같은 레이아웃 prop을 컴포넌트가 직접 받지 않는다 — 호출부가 `className`으로 감싼다.
- 조합(로컬 recipe + 외부 className)은 `cx(localRecipe, props.className)` 패턴으로.

```tsx
const styles = cva({ base: { display: 'flex' }, variants: { active: { true: { bg: 'brand.9' } } } });

const Card = ({ active, className }: CardProps) => (
  <div className={cx(styles({ active }), className)} />
);
```

## Step 4: 접근성·마크업

- 불필요한 `div` 금지 — 의미 요소(`section`/`header`/`nav`/`ul`/`li`/`button`/`a`) 우선, 묶음만 필요하면 Fragment.
- 모든 인터랙티브 요소는 키보드(Tab/Enter/Space)로 접근 가능해야 한다.
- 포커스 아웃라인을 제거하지 않는다 — 고대비 포커스 상태를 유지한다.
- 동적 상태 변화는 `aria-live`, 텍스트 없는 콘텐츠는 `alt`/`aria-label`.

## Step 5: 개발 표준

- 모든 함수 선언은 `const` 화살표 함수.
- 모든 함수·훅에 **한국어 JSDoc**을 작성한다(파라미터·반환값 설명 포함).
- `@/...` alias만 사용.

## Step 6: 검증

```bash
pnpm check-types
pnpm lint
```

## 자가 확인

- [ ] 레이어 배치가 FSD 규칙(app/views/widgets/features/entities/shared)을 따르는가?
- [ ] 같은 도메인/라이프사이클을 공유하는 로직이 여러 features 슬라이스로 쪼개지지 않았는가?
- [ ] Panda 토큰만 썼는가(하드코딩 픽셀 없음)? `className` 외 레이아웃 prop을 노출하지 않는가?
- [ ] 의미 요소·`button`/`a`·키보드 접근성·포커스 아웃라인을 지켰는가?
- [ ] 모든 함수·훅에 한국어 JSDoc이 있는가?
- [ ] 불필요한 추상화 없이(3회 미만은 인라인) 작게 만들었는가?

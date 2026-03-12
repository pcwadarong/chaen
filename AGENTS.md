## AGENTS

## Frontend Working Rules

- Next.js App Router 기준으로 작업한다.
- 함수 선언은 특별한 이유가 없으면 모두 `const`로 작성한다.
- 공통 로직은 라우트 파일에 직접 두지 말고 적절한 레이어로 이동한다.
- 경로 alias를 우선 사용하고 상대 경로 체인은 길게 늘리지 않는다.
- SVG, font, style, config는 재사용 가능한 진입점을 먼저 만든다.
- 함수는 JsDoc를 한국어로 꼼꼼히 작성한다.
- 불필요하게 `div` wrapper를 만들어서 감싸지 않는다.

## Styling Rules

- Panda CSS를 기본 스타일 시스템으로 사용하고, Emotion이나 `module.css`는 새로 추가하지 않는다.
- 스타일 선언은 별도 `*.recipe.ts`/`*.styles.ts`로 분리하지 말고 컴포넌트 파일 안에서 `cva()`/`css()`로 co-location 한다.
- 확장 포인트는 `className`만 허용하고, `cx(localRecipeOrClass, props.className)` 패턴으로 합친다.
- `margin`, `gap` 같은 layout prop은 새로 추가하지 않고 필요한 레이아웃 확장은 `className`으로 해결한다.
- `use client`는 상태, effect, 브라우저 API, `next/navigation`, `next-themes`, 포털/포커스 관리처럼 실제 클라이언트 런타임이 필요한 경우에만 선언한다.
- 스타일링이나 단순 번역(`next-intl`)만으로는 `use client`를 붙이지 않는다. 가능하면 server/shared component로 유지하고, locale 제약이 있으면 서버 유틸 또는 상위에서 계산한 props로 푼다.
- 마이그레이션/호환용 임시 코드, alias layer, 보조 스크립트는 작업 종료 시 실제 필요성을 다시 검토하고 제거 대상을 정리한다.

## FSD (Feature-Sliced Design) 아키텍처 규칙

Next.js 공식 best practice를 우선하고, 구조는 FSD 관점을 따릅니다:

- `app/`: Next.js 라우팅 전용 레이어 (레이아웃, 메타데이터, 껍데기 페이지)
- `src/views/`: 실제 페이지의 비즈니스 로직 및 전체 레이아웃 (Container 역할)
  - `src/views/{page-name}/ui/{PageName}.tsx`: 페이지의 메인 엔트리 (Container)

- `src/widgets/`: 독립적으로 동작하는 완성된 UI 블록
- `src/features/`: 사용자 상호작용 및 비즈니스 로직 단위
- `src/entities/`: 도메인 엔터티 및 데이터 모델
- `src/shared/`: 공통 UI 컴포넌트, 유틸리티, SVG 타입 정의

# Quality Bar

- 동작 변경이 있으면 테스트 가능한 단위부터 먼저 정의하고 구현한다.
- 최소 기준은 `pnpm lint`, `pnpm typecheck`, `pnpm test`를 통과하는 것이다.
- UI 작업은 모바일과 데스크톱을 모두 고려한다.
- 접근성, semantic HTML, loading/error/empty 상태를 기본 요구사항으로 본다.
- 임시 로그, 죽은 코드, 사용하지 않는 export는 남기지 않는다.

## PR Working Rules

- 하나의 PR 단위 기능을 구현할 때 모든 테스트를 한 번에 몰아서 작성하지 않는다.
- 테스트 하나 작성 -> 구현 하나 진행 흐름을 기본으로 한다.
- 예를 들어 로그인 기능은 라우팅 테스트/구현, 페이지 테스트/구현, 폼 테스트/구현, 검증 테스트/구현, 요청 테스트/구현, 마지막 통합 테스트처럼 잘게 나누어 순차적으로 진행한다.
- 하나의 대화가 시작되면 루트의 `docs/` 폴더를 확인하고, 없으면 생성한다.
- 해당 작업용 PR 문서를 `docs/` 아래에 markdown으로 생성하거나 기존 문서를 찾아 이어서 갱신한다.
- PR 문서에는 "무엇을 추가했는가"보다 "어떤 문제를 해결했고, 사용자/SEO/성능/운영 관점에서 무엇이 달라졌는가"를 우선 정리한다.
- PR 문서에는 가능한 경우 다음 내용을 포함한다: 작업 목표, 핵심 정책, 판단 근거, 완료된 범위, 남은 검토 포인트
- PR 문서는 가능하면 아래 순서를 기본 골격으로 사용한다.
  - 작업 목표
  - 이번 브랜치에서 한 작업
  - 사용자 관점에서 달라진 점
  - 구현상 눈에 띄는 포인트
  - 검증
- "이번 브랜치에서 한 작업"은 누적 작업 로그처럼 쌓지 말고, 현재 브랜치 기준으로 완료된 작업을 기능 단위로 다시 묶어 정리한다.
- "구현상 눈에 띄는 포인트"는 모든 사소한 구현 내역을 적는 곳이 아니라, 나중에 다시 봤을 때 도움이 되는 설계 판단, tricky한 처리, 주의점만 남긴다.
- 의존성 판단, 처리 방식 같은 구현 원리는 가능하면 이 섹션에 따로 정리한다.
- PR 문서에는 파일 경로를 장황하게 나열하지 말고, 개념 단위로 묶어 설명한다. 파일 언급은 필요한 경우에만 최소화한다.
- PR 문서는 구현 중간에도 현재 결정사항과 보류사항이 드러나도록 계속 갱신하고, 마지막에는 "지금 시점에서 완료된 것과 남은 것"이 한눈에 보이게 정리한다.
- 어떤 명령이 들어와도 작업을 한 번에 끝내지 말고, 의미 있는 커밋 단위로 나눠서 진행한다.
- 각 커밋 단위 작업이 끝날 때마다 다음 단계로 넘어가기 전에 사용자 확인을 받는다.
- 각 커밋 단위 종료 시점에는 추천 커밋 제목(한국어)과 간단한 커밋 메시지(한국어)를 함께 제안한다.

## Accessibility (A11y) 기준

- 가능한 경우 semantic HTML 요소를 우선 사용한다.
- 의미 전달이 필요한 경우 ARIA role / aria-\* attribute를 명확하게 적용한다.
- 모든 인터랙션 요소는 keyboard navigation (Tab / Enter / Space)으로 접근 가능해야 한다.
- 이미지, SVG 아이콘에는 적절한 `alt` 또는 `aria-label`을 제공한다.
- 상태 변경 UI는 screen reader가 인식할 수 있도록 `aria-live` 또는 role을 고려한다.
- 클릭 가능한 요소를 `div`로 구현하는 것을 지양하고 interactive element를 우선 사용한다.
- 색상에만 의존한 정보 전달을 피하고 텍스트 또는 아이콘을 함께 제공한다.
- focus outline을 제거하지 말고 명확한 focus 상태를 유지한다.

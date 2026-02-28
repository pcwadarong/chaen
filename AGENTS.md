# AGENTS

## Frontend Working Rules

- Next.js App Router 기준으로 작업한다.
- 함수 선언은 특별한 이유가 없으면 모두 `const`로 작성한다.
- 공통 로직은 라우트 파일에 직접 두지 말고 적절한 레이어로 이동한다.
- 경로 alias를 우선 사용하고 상대 경로 체인은 길게 늘리지 않는다.
- SVG, font, style, config는 재사용 가능한 진입점을 먼저 만든다.
- 함수는 JsDoc를 한국어로 꼼꼼히 작성한다.

## FSD (Feature-Sliced Design) 아키텍처 규칙

Next.js 공식 best practice를 우선하고, 구조는 FSD 관점을 따릅니다:

- `app/`: Next.js 라우팅 전용 레이어 (레이아웃, 메타데이터, 껍데기 페이지)
- `src/pages/`: 실제 페이지의 비즈니스 로직 및 전체 레이아웃 (Container 역할)
  - `src/pages/{page-name}/ui/{PageName}.tsx`: 페이지의 메인 엔트리 (Container)
- `src/widgets/`: 독립적으로 동작하는 완성된 UI 블록
- `src/features/`: 사용자 상호작용 및 비즈니스 로직 단위
- `src/entities/`: 도메인 엔터티 및 데이터 모델
- `src/shared/`: 공통 UI 컴포넌트, 유틸리티, SVG 타입 정의

## Quality Bar

- 동작 변경이 있으면 테스트 가능한 단위부터 먼저 정의하고 구현한다.
- 최소 기준은 `pnpm lint`, `pnpm typecheck`, `pnpm test`를 통과하는 것이다.
- UI 작업은 모바일과 데스크톱을 모두 고려한다.
- 접근성, semantic HTML, loading/error/empty 상태를 기본 요구사항으로 본다.
- 임시 로그, 죽은 코드, 사용하지 않는 export는 남기지 않는다.

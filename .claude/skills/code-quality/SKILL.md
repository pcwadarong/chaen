---
name: code-quality
description: chaen 코드를 컨벤션 기준으로 점검하고 개선하는 스킬. "코드 개선", "리팩터", "리뷰해줘", "정리해줘", "컨벤션 점검" 요청 시 트리거한다. AGENTS.md 1·2절을 기준으로 검토 후 고친다.
---

# Code-Quality — chaen 코드 점검·개선

변경된 코드가 컨벤션을 지키는지 점검하고, 위반은 `파일:라인`으로 보고한 뒤 고친다.

> 규칙 기준: `AGENTS.md` §1(FSD 아키텍처), §2(프론트엔드·스타일링 규칙)
> 데이터 흐름·컴포넌트 구현 절차는 `data-flow`·`component` 스킬 참조.

## Step 1: 변경 파일 확인

```bash
git diff --name-only HEAD
```

각 파일을 읽고 아래 체크리스트로 점검한다.

## Step 2: 체크리스트 (AGENTS.md §1·§2 quick-reference)

**레이어 배치 (FSD)**
- [ ] `app/`은 라우팅·레이아웃·메타데이터·루트 프로바이더만 담당하는가(로직 없음)?
- [ ] 페이지 컨테이너는 `src/views/{page}/ui/`에 있는가?
- [ ] 여러 화면이 공유하는 독립 UI 블록은 `src/widgets/`에 있는가?
- [ ] 사용자 상호작용/비즈니스 로직 단위는 `src/features/`에 있는가? **같은 도메인·상태 머신·라이프사이클을 공유하는 기능이 여러 슬라이스로 쪼개져 있지 않은가?** (나쁜 예: `features/play-character-blink` + `features/play-character-heart` 분리 / 좋은 예: `features/character-animation/model/useBlink.ts` + `useHeart.ts` 통합)
- [ ] 도메인 엔티티·데이터 모델은 `src/entities/`에 있는가? 기술적 유틸(예: `apply-materials`)은 `entities/{domain}/lib` 또는 `shared/lib`에 있는가?
- [ ] 재사용 가능한 원자 UI·범용 유틸·타입은 `src/shared/`에 있는가?

**개발 표준**
- [ ] 모든 함수 선언이 `const` 화살표 함수인가(`function` 불필요하게 사용하지 않았는가)?
- [ ] 불필요한 `div` 래핑이 없고 의미 요소를 쓰는가?
- [ ] 미사용 export·죽은 코드·임시 `console`이 없는가?
- [ ] `@/...` alias만 쓰는가(상대 경로 `../../` 남용 없는가)?
- [ ] 모든 함수·훅에 **한국어 JSDoc**이 있는가(파라미터·반환값 포함)?

**스타일링 (Panda CSS)**
- [ ] Emotion·CSS Modules·`*.styles.ts` 분리 파일 없이 컴포넌트 파일 내 `css()`/`cva()`로 co-locate했는가?
- [ ] 픽셀 하드코딩 없이 `src/shared/config/responsive.ts`의 `VIEWPORT_BREAKPOINTS`/`viewportMediaQuery` 또는 `token('breakpoints.*')`/반응형 객체(`{base, md, ...}`)를 썼는가?
- [ ] 외부 확장은 `className` prop만 노출하는가(margin/gap 같은 레이아웃 prop을 컴포넌트가 직접 받지 않는가)?
- [ ] 조합은 `cx(localRecipe, props.className)` 패턴을 따르는가?

**Client/Server 경계**
- [ ] `'use client'`는 State/Effect/브라우저 API/`next/navigation`/복잡한 포털-포커스 관리가 있을 때만 붙었는가? 스타일링 전용/정적 번역(`next-intl`) 컴포넌트가 불필요하게 client로 선언되지 않았는가?

**중복**
- [ ] 같은 패턴이 3회 이상/거의 동일하면 공통화했는가? (그 전엔 인라인 유지 — 이른 추상화 금지)

## Step 3: 검증 명령

```bash
pnpm check-types
pnpm lint
pnpm build   # dev 서버가 떠 있으면 충돌하니 그때는 생략
```

실패 시 에러 메시지 전체를 보고에 포함한다.

## Step 4: 수정

점검에서 나온 위반을 컨벤션에 맞게 고친다. 범위가 커지면 무리하지 말고 분리(다음 작업)를 제안한다.

## 자가 확인

- [ ] 모든 지적에 `파일:라인`을 명시했는가?
- [ ] `pnpm check-types`·`pnpm lint`를 실행하고 결과를 포함했는가?
- [ ] 수정이 FSD 레이어 배치·Panda 토큰·JSDoc 기준을 따르는가?

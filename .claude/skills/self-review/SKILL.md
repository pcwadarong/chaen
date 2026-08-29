---
name: self-review
description: chaen에서 열린 PR에 셀프 리뷰를 남기는 절차 스킬. "셀프 리뷰", "셀프리뷰", "PR에 리뷰 남겨줘" 요청 시 트리거한다. 품질 문제는 코멘트가 아니라 직접 수정하고, 결정 배경·고민만 코멘트로 남기는 규칙을 강제한다. 코드 품질 검토 자체의 기준은 다루지 않는다(→ code-quality 스킬).
allowed-tools: Bash, Read, Edit, Write, Glob, Grep
---

# Self-Review — 열린 PR에 셀프 리뷰 남기기

리뷰어(사람 + CodeRabbit)가 빠르게 핵심을 파악하도록 **결정 배경과 고민**을 공유한다.

> 규칙 기준: `AGENTS.md` §4(워크플로우 & PR 규칙). 품질 판단 기준은 `code-quality` 스킬,
> 테스트 계약은 `test-strategy` 스킬, 레이어 배치는 `fsd_architect_reviewer` 에이전트를 참조한다.
> 여기선 **무엇을 코멘트로 쓰고 무엇을 직접 고칠지의 분기**만 다룬다.

## 핵심 분기

| 발견한 것 | 액션 |
|---|---|
| 버그, 타입 에러, 접근성 위반, 컨벤션 위반 | ❌ 코멘트 금지 → **직접 수정 후 커밋** |
| 왜 이 방식을 골랐는지, 대안을 왜 버렸는지 | ✅ 코멘트 |
| 기존 패턴과 다르게 간 자리 | ✅ 코멘트 |
| 감수한 복잡성·트레이드오프 | ✅ 코멘트 |
| 확신이 없어 의견을 구하고 싶은 곳 | ✅ 코멘트 (`@coderabbitai` 태그) |

**모든 코드에 코멘트를 달지 않는다.** 설명이 필요한 자리만.

## Step 1: PR diff 확인

```bash
node .claude/skills/self-review/scripts/get-pr-diff.mjs
```

PR이 없으면 먼저 `pr-workflow` 스킬로 발행한다.

## Step 2: 품질 검사 — 발견하면 직접 고친다

`AGENTS.md` 기준으로 훑는다. 세부 판단이 필요하면 `code-quality` 스킬을 함께 연다.

| 분류 | 체크 항목 |
|---|---|
| **FSD 레이어** | `app → views → widgets → features → entities → shared` 역방향 import가 없는가. feature가 도메인/생명주기 기준으로 묶였는가 |
| **Panda CSS** | 하드코딩 px 없는가(`src/shared/config/responsive.ts` 토큰 사용). `*.styles.ts` 분리 없이 co-location인가. `cx(localRecipe, props.className)` 병합인가 |
| **Server/Client** | `'use client'`가 실제로 state·effect·브라우저 API·`next/navigation` 때문인가. 스타일·정적 번역만이면 서버 컴포넌트로 남아야 한다 |
| **React Query** | 쿼리 키가 기존 팩토리와 정합한가. 뮤테이션 후 무효화 범위가 맞는가 (→ `data-flow` 스킬) |
| **타입 안전성** | optional chaining으로 타입만 무마하지 않았는가. 맥락상 required면 준비 계층에서 검증 후 분기해야 한다 |
| **접근성** | `getByRole`로 잡히는 시맨틱인가. 포커스 링·키보드 경로가 있는가 (→ `a11y_ux_auditor` 에이전트) |
| **선언성** | `useEffect` 최소화. 반복 로직이 훅/유틸로 빠졌는가 |
| **죽은 코드** | 미사용 export, 임시 로그, 참조되지 않는 상수 |

수정했으면 검증:

```bash
pnpm run check-types && pnpm run lint && pnpm run test:vitest
```

## Step 3: 라인 코멘트

```bash
node .claude/skills/self-review/scripts/post-line-comment.mjs <file-path> <line> "<message>"
```

예시:

```bash
node .claude/skills/self-review/scripts/post-line-comment.mjs \
  src/entities/character/model/use-character-instance.ts 92 \
  "믹서 갱신 가드를 렌더러별로 뒀어요. gl.info.render.frame이 렌더러마다 별개 카운터라 캔버스 2개에서는 전역 비교가 안 맞더라고요. 더 나은 방법 있을까요? @coderabbitai"
```

```bash
node .claude/skills/self-review/scripts/post-line-comment.mjs \
  src/features/character-animation/model/use-character-state.ts 40 \
  "기존 feature 패턴과 다르게 상태를 widget으로 올렸어요. contact 씬과 공유해야 해서인데, entities에 두는 게 나을까요?"
```

## Step 4: 전체 리뷰 (선택)

```bash
node .claude/skills/self-review/scripts/post-review.mjs COMMENT "<body>"
node .claude/skills/self-review/scripts/post-review.mjs COMMENT @review-body.md   # 긴 본문
```

## 코멘트 톤

친근한 "~요" 문체.

- ✅ "사용했어요", "해봤어요", "어떨까요?"
- ❌ "사용했습니다", "적용함"
- ❌ "이렇게 했습니다" (통보) → ✅ "이렇게 해봤는데 어떻게 생각하세요?" (의견 요청)

의견을 구하는 **질문형** 코멘트에만 `@coderabbitai`를 태그한다. 단순 설명엔 불필요.

## 계정 주의

스크립트는 `_shared/github-api.mjs`를 통해 `GITHUB_TOKEN`을 지운 환경으로 `gh`를 호출한다.
셸에 회사 계정 토큰이 있어도 개인 계정(`pcwadarong`)으로 나간다. **스크립트를 우회해
`gh api`를 직접 부르지 않는다** — 부를 거면 `env -u GITHUB_TOKEN`을 반드시 붙인다.

## 자가 확인

- [ ] 품질 문제를 코멘트로 떠넘기지 않고 직접 수정했는가?
- [ ] 수정 후 `check-types` / `lint` / `test:vitest`를 통과시켰는가?
- [ ] 코멘트가 "왜 그렇게 했나"·"무엇이 고민인가"에만 달렸는가? 자명한 코드에 달지 않았는가?
- [ ] "~요" 문체인가? 질문형에만 `@coderabbitai`를 태그했는가?
- [ ] `gh`가 개인 계정으로 나갔는가? (`env -u GITHUB_TOKEN gh auth status`)

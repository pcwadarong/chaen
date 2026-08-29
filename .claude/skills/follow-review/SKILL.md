---
name: follow-review
description: chaen에서 PR에 달린 리뷰(CodeRabbit·사람)를 분석하고 타당한 것만 반영하는 절차 스킬. "리뷰 반영해줘", "코드래빗 리뷰 처리해줘", "PR 리뷰 반영" 요청 시 트리거한다. 반영/검토/무시 분류 기준과 답글 규칙을 강제한다. 리뷰 없이 하는 자체 코드 개선은 다루지 않는다(→ code-quality 스킬).
allowed-tools: Bash, Read, Edit, Write, Glob, Grep
---

# Follow-Review — PR 리뷰 반영

이 저장소는 `.coderabbit.yaml`로 CodeRabbit이 붙어 있다. AI 리뷰는 **전부 반영하는 게 아니라
선별하는 것**이 기본값이다.

> 규칙 기준: `AGENTS.md`. 반영할 코드의 품질 판단은 `code-quality`, 테스트는 `test-strategy`,
> 레이어는 `fsd_architect_reviewer` 에이전트를 참조한다. 여기선 **분류 기준과 답글 절차**만 다룬다.

## Step 1: 리뷰 조회

```bash
node .claude/skills/follow-review/scripts/get-reviews.mjs
```

현재 브랜치 PR의 라인 코멘트 + summary 리뷰를 전부 가져온다.

## Step 2: 리뷰어별 기본 태도

| 리뷰어 | 태도 |
|---|---|
| **사람** | 기본적으로 반영. 의문이 있으면 답글로 질문해서 해소 |
| **CodeRabbit** | 타당한 것만 선별. nitpick은 이유를 달고 무시 |

## Step 3: 분류

| 분류 | 기준 | 액션 |
|---|---|---|
| ✅ **반영** | 버그, 타입 에러, 로직 오류, 접근성 위반, 실제 성능 문제, 보안 | 즉시 수정 |
| 🤔 **검토 필요** | 설계 변경, 레이어 이동, 범위를 넓히는 리팩터 | 사용자에게 확인 후 진행 |
| ❌ **무시** | 스타일 nitpick, chaen 컨벤션과 충돌, 과도한 추상화, 현재 스코프 밖 | 이유를 달고 스킵 |

### chaen에서 특히 무시해야 하는 CodeRabbit 제안

- **포맷/스타일** — ESLint·Prettier·`lint-staged`가 이미 관리한다
- **`*.styles.ts`로 스타일 분리 제안** — AGENTS.md §2가 co-location을 강제한다
- **하드코딩 px 도입** — `src/shared/config/responsive.ts` 토큰을 써야 한다
- **`div` 래퍼 추가** — 시맨틱 HTML을 쓰라는 게 컨벤션이다
- **테스트를 구조에 결합시키는 제안** — 클래스명·DOM 중첩 단정은 금지 (`test-strategy`)
- **불필요한 메모이제이션** — 오버엔지니어링·과도한 훅 사용 지양

### 반드시 반영해야 하는 것

- 널 체크 누락, optional chaining으로 타입만 무마한 자리
- FSD 레이어 역방향 import
- 쿼리 키 정합성 / 뮤테이션 후 무효화 누락 (`data-flow`)
- 접근성: 역할 없는 인터랙티브 요소, 포커스 트랩 누락, 키보드 경로 부재
- 타임존 의존 로직 (로컬 KST / CI UTC 차이로 CI에서만 깨진다)

## Step 4: 수정 후 검증

```bash
pnpm run check-types && pnpm run lint && pnpm run test:vitest
```

3D 런타임·브라우저 계약을 건드렸으면:

```bash
pnpm run test:browser:smoke
```

타임존 관련 지적을 반영했으면 CI 패리티까지:

```bash
TZ=UTC pnpm run test:vitest
```

## Step 5: 답글

```bash
node .claude/skills/follow-review/scripts/reply-comment.mjs <comment-id> "<message>"
```

반영했을 때:
```bash
node .claude/skills/follow-review/scripts/reply-comment.mjs 123456 "수정했어요! 준비 계층에서 검증하고 분기하도록 바꿨어요."
```

무시할 때 — **반드시 이유를 단다**:
```bash
node .claude/skills/follow-review/scripts/reply-comment.mjs 123456 "이 프로젝트는 Panda CSS co-location을 컨벤션으로 쓰고 있어서(AGENTS.md §2) 현재 구조를 유지할게요."
```

사람에게 질문할 때:
```bash
node .claude/skills/follow-review/scripts/reply-comment.mjs 123456 "기존 컨벤션과 달라서 확인이 필요해요. A와 B 중 어느 쪽이 좋을까요?"
```

## Step 6: 커밋

리뷰 반영은 하나의 논리 단위로 묶는다. 허용 타입은 `pr-workflow` 스킬의 표를 따른다.

```bash
pnpm commit   # ♻️ refactor: PR 리뷰 피드백 반영 (…)
```

`--no-verify`로 훅을 우회하지 않는다.

## 보고 형식

수정 전에 분류 결과를 먼저 보여주고 확인을 받는다:

```
## 리뷰 분석 결과

### ✅ 반영 (2건)
1. @coderabbitai `src/entities/scene/ui/scene-prop.tsx:78` — 텍스처 dispose 누락
2. @coderabbitai `src/features/.../use-character-state.ts:31` — 널 체크 누락

### 🤔 검토 필요 (1건)
1. @coderabbitai `src/widgets/.../home-hero-stage-canvas.tsx:150` — 컴포넌트 분리 제안
   → 이번 스코프에서 할까요?

### ❌ 무시 (1건)
1. @coderabbitai `src/shared/ui/button.tsx:12` — 스타일 파일 분리 제안
   → 이유: AGENTS.md §2가 co-location 강제

반영을 진행할까요?
```

## 계정 주의

스크립트는 `_shared/github-api.mjs`를 통해 `GITHUB_TOKEN`을 지운 환경으로 `gh`를 호출한다.
**스크립트를 우회해 `gh api`를 직접 부르지 않는다** — 부를 거면 `env -u GITHUB_TOKEN`을 붙인다.

## 자가 확인

- [ ] 분류 결과를 사용자에게 먼저 보여주고 확인받았는가?
- [ ] 무시하는 항목마다 이유를 답글로 남겼는가?
- [ ] "검토 필요"를 임의로 반영하거나 임의로 버리지 않았는가?
- [ ] `check-types` / `lint` / `test:vitest`를 통과시켰는가? 타임존 지적이면 `TZ=UTC`까지 돌렸는가?
- [ ] 커밋 타입이 허용 목록의 정확한 이모지인가? `--no-verify`를 쓰지 않았는가?

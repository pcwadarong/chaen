---
name: pr-workflow
description: chaen에서 커밋 만들기부터 PR 생성까지의 절차 스킬. "커밋해줘", "PR 만들어줘", "커밋 메시지 뭐로 할까", "PR 문서 작성" 요청 시 트리거한다. 허용된 커밋 타입, docs/pr/ 구조, 개인 gh 계정 사용법을 강제한다. 코드 변경 자체의 품질 검토는 다루지 않는다(→ code-quality 스킬).
---

# Pr-Workflow — 커밋 & PR 생성 절차

커밋 메시지 작성부터 `docs/pr/` 문서, gh CLI로 PR을 올리는 순서까지의 절차.

> 규칙 기준: `AGENTS.md` §4(워크플로우 & PR 규칙). 여기선 **허용 타입 검증·문서 템플릿·gh 계정 전환**만 다룬다.

## Step 1: 커밋 단위 확인

의미 있는 논리적 단위인지 먼저 확인한다 — 한 커밋에 서로 다른 관심사(기능 추가 + 무관한 리팩터)를 섞지 않는다. 단위가 애매하면 나누는 안을 먼저 제안하고 사용자 확인을 받는다.

## Step 2: 커밋 타입 — 허용 목록

`.husky/commit-msg`가 정확한 바이트 매치로 검사한다. 허용 타입(variation selector 없는 순수 이모지):

| 타입 | 용도 |
|---|---|
| `✨ feat:` | 새 기능 |
| `🐛 fix:` | 버그 수정 |
| `♻️ refactor:` | 동작 변경 없는 구조 개선 |
| `💄 style:` | 스타일/포맷팅(로직 무변경) |
| `📝 docs:` | 문서 |
| `🔧 chore:` | 잡무(설정, 의존성 등) |
| `🔥 remove:` | 코드/파일 삭제 |
| `🧪 test:` | 테스트 추가/수정 |
| `⚡ perf` | 성능 개선 — **`⚡️`(U+26A1 U+FE0F, variation selector 있음)가 아니라 순수 `⚡`(U+26A1)여야 훅이 통과한다** |
| `⚙️ ci:` | CI 설정 |
| `🧹 lint:` | 린트 규칙/수정 |

**이모지를 직접 타이핑하지 않는다** — 특히 `⚡`는 시각적으로 구분 안 되는 두 바이트 시퀀스가 있어 겉보기엔 맞는데 훅만 조용히 실패할 수 있다. `pnpm commit`(Commitizen, `.cz-config.js` 기반)으로 생성하거나 이 표에서 직접 복사한다.

```bash
pnpm commit
```

커밋 본문은 한국어로 쓴다.

## Step 3: pre-commit 훅 통과

`.husky/pre-commit`은 `pnpm exec lint-staged` → `pnpm run test:staged`(`scripts/run-staged-tests.mjs`) 순으로 실행하고 하나라도 실패하면 커밋을 막는다. 실패 시 `--no-verify`로 우회하지 않고 원인을 고친다.

## Step 4: PR 문서 — `docs/pr/`

PR을 올리기 전 `docs/pr/{작업명}.md`를 아래 구조로 작성한다(모두 한국어):

```markdown
## Goal
{이 PR이 해결하려는 목적 한두 문장}

## Changes
- {변경 사항 1}
- {변경 사항 2}

## User-facing changes
{사용자가 체감하는 변화. 없으면 "없음"이라고 명시}

## Implementation Highlights
{설계상 특이점·트레이드오프. 자명한 내용은 생략}

## Verification results
- `pnpm check-types`: {결과}
- `pnpm lint`: {결과}
- `pnpm test:vitest` / 관련 버킷: {결과}
```

각 섹션을 비워두지 않는다 — 특히 "Verification results"는 실제로 실행한 명령과 결과만 적는다(실행 안 했으면 "미실행"이라고 정직하게 적는다).

## Step 5: PR 생성 — 개인 계정(gh)

이 저장소(chaen)는 개인 계정 `pcwadarong`으로 PR을 올린다. 환경변수의 `GITHUB_TOKEN`이 다른 계정을 가리킬 수 있으므로 반드시 언셋하고 실행한다:

```bash
env -u GITHUB_TOKEN gh pr create --title "{제목}" --body "$(cat docs/pr/{작업명}.md)"
```

PR 제목·요약도 한국어로 작성한다. `gh` 호출 전 `env -u GITHUB_TOKEN gh auth status`로 계정이 `pcwadarong`인지 먼저 확인하는 습관을 들인다.

## Step 6: CI 패리티 사전 확인 (선택, 실패 이력 있을 때)

로컬(Asia/Seoul)과 CI(UTC) 타임존 차이로 날짜 관련 테스트가 로컬에서만 통과할 수 있다. PR 올리기 전 의심되면:

```bash
TZ=UTC pnpm test:vitest
```

## 자가 확인

- [ ] 커밋 메시지가 허용 타입 표의 정확한 이모지(특히 `⚡` variation selector 없음)로 시작하는가? `pnpm commit`으로 생성했는가?
- [ ] 커밋이 하나의 논리적 단위인가? 무관한 변경이 섞이지 않았는가?
- [ ] `pre-commit` 훅을 우회(`--no-verify`)하지 않고 통과시켰는가?
- [ ] `docs/pr/{작업명}.md`가 5개 섹션을 모두 채운 채(빈 섹션 없이) 존재하는가? "Verification results"가 실제 실행 결과인가?
- [ ] `gh` 호출에 `env -u GITHUB_TOKEN`을 붙였는가? 계정이 `pcwadarong`인지 확인했는가?
- [ ] 커밋 본문·PR 제목/요약이 한국어인가?

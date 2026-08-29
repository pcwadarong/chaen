---
name: pr-workflow
description: chaen에서 커밋 만들기부터 PR 생성까지의 절차 스킬. "커밋해줘", "PR 만들어줘", "커밋 메시지 뭐로 할까", "PR 문서 작성" 요청 시 트리거한다. 허용된 커밋 타입, docs/pr/ 본문 구조(목적·설계·Changes·리뷰 포인트·Test plan·후속), PR 제목 형식, 개인 gh 계정 사용법, CodeRabbit 영역 보존을 강제한다. 코드 변경 자체의 품질 검토는 다루지 않는다(→ code-quality 스킬).
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

PR을 올리기 전 `docs/pr/{작업명}.md`를 작성한다(모두 한국어).

> **본문의 1차 독자는 3개월 뒤의 나다.** "무엇을 바꿨나"는 diff가 이미 말해준다.
> 문서가 담아야 하는 건 **왜 그렇게 했나**와 **무엇을 일부러 안 했나**다.

| 섹션 | 답하는 질문 | 필수 |
|---|---|---|
| `## 목적` | 무엇이 왜 바뀌나 — 한 문장 + 전/후 대비표 | ✅ |
| `## 설계` | 결정마다 왜. 대안을 왜 안 골랐나 | 결정이 있었다면 |
| `## Changes` | 무엇을 바꿨나 + **의도적으로 안 바꾼 것** | ✅ |
| `## 리뷰 포인트` | 실제로 봐야 할 것 3~4개 | ✅ |
| `## Test plan` | 어떻게 검증했나 — 체크박스 | ✅ |
| `## 후속` | 이번 범위 밖 + **무엇을 기다리는지** | 있다면 |

→ 전체 템플릿·작성 규칙·CodeRabbit 영역 보존 절차: [references/body-template.md](./references/body-template.md)

핵심 세 가지:

- **`## 설계`가 본체다.** "A로 했다"가 아니라 **"B면 X가 깨져서 A로 했다"**. 결정이 하나도
  없었다면 생략해도 되지만, 대개는 뭔가 빠진 것이다.
- **시행착오를 빼라.** 했다가 되돌린 것, 커밋 재구성, 중간에 틀린 판단은 남기지 않는다.
- **Test plan에 거짓을 쓰지 마라.** 실제 실행한 명령과 결과만. 안 돌렸으면 "미실행"이라고 적는다.

상세 설계 문서가 `docs/`에 따로 있으면 **맨 위에 링크하고 본문은 요약본으로** 둔다.

## Step 5: PR 생성 — 개인 계정(gh)

이 저장소(chaen)는 개인 계정 `pcwadarong`으로 PR을 올린다. 환경변수의 `GITHUB_TOKEN`이 다른 계정을 가리킬 수 있으므로 반드시 언셋하고 실행한다:

```bash
env -u GITHUB_TOKEN gh pr create --title "{제목}" --body "$(cat docs/pr/{작업명}.md)"
```

PR 제목·요약도 한국어로 작성한다. `gh` 호출 전 `env -u GITHUB_TOKEN gh auth status`로 계정이 `pcwadarong`인지 먼저 확인하는 습관을 들인다.

### 제목 형식

최근 PR이 수렴한 형식은 **커밋 타입과 같은 이모지 + 한 줄 요약**이다:

```
♻️ refactor: 3D 파이프라인 최적화 — 에셋 48MB→10MB, 렌더 루프·화면 텍스처 정비
♻️ refactor: API 호출 최적화 — React Query 도입과 서버 캐시 정비
```

- 타입 이모지는 Step 2의 허용 표와 **같은 것**을 쓴다 (커밋과 PR이 일치해야 훑어보기 쉽다)
- `— ` 뒤에 부연을 붙여도 되지만 80자를 넘기지 않는다 (GitHub에서 잘린다)
- 명사형으로 끝낸다. 마침표·"요" 어말 금지

### 이미 PR이 있으면

새로 만들지 않는다. `gh pr edit`으로 갱신하되, **body를 덮어쓰기 전에 CodeRabbit이 채운
release notes를 보존해야 한다** — 절차는 [references/body-template.md](./references/body-template.md)의
마지막 절에 있다.

```bash
env -u GITHUB_TOKEN gh pr edit --title "{제목}"   # 타이틀만 — body 안 건드림, 항상 안전
```

## Step 6: CI 패리티 사전 확인 (선택, 실패 이력 있을 때)

로컬(Asia/Seoul)과 CI(UTC) 타임존 차이로 날짜 관련 테스트가 로컬에서만 통과할 수 있다. PR 올리기 전 의심되면:

```bash
TZ=UTC pnpm test:vitest
```

## 자가 확인

- [ ] 커밋 메시지가 허용 타입 표의 정확한 이모지(특히 `⚡` variation selector 없음)로 시작하는가? `pnpm commit`으로 생성했는가?
- [ ] 커밋이 하나의 논리적 단위인가? 무관한 변경이 섞이지 않았는가?
- [ ] `pre-commit` 훅을 우회(`--no-verify`)하지 않고 통과시켰는가?
- [ ] `docs/pr/{작업명}.md`가 `목적 / 설계 / Changes / 리뷰 포인트 / Test plan / 후속` 구조인가?
- [ ] `## 설계`에 결정마다 **왜**와 **버린 대안**이 적혀 있는가? (결정이 있었는데 비어 있지 않은가)
- [ ] `## Changes`에 **의도적으로 안 바꾼 것**이 이유와 함께 있는가?
- [ ] `## Test plan`이 실제 실행 결과인가? (안 돌렸으면 "미실행"이라고 적었는가)
- [ ] 시행착오·되돌린 시도·커밋 재구성 이야기를 빼고 결과와 근거만 남겼는가?
- [ ] `gh` 호출에 `env -u GITHUB_TOKEN`을 붙였는가? 계정이 `pcwadarong`인지 확인했는가?
- [ ] 커밋 본문·PR 제목/요약이 한국어인가?

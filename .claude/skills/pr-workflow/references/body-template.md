# PR 본문 템플릿

`AGENTS.md` §4의 구조를 실제 문서로 옮긴 것이다. 규칙의 단일 출처는 AGENTS.md이고,
여기는 **템플릿과 작성 예시**만 둔다.

이 저장소는 1인 개인 레포다. 리뷰어는 CodeRabbit뿐일 수 있고, 그러면 본문의 1차 독자는
**3개월 뒤의 나**다. "무엇을 바꿨나"는 diff가 이미 말해준다. 본문이 담아야 하는 건
**왜 그렇게 했나**와 **무엇을 일부러 안 했나**다.

## 척추

| 섹션 | 답하는 질문 | 필수 |
|---|---|---|
| `## 목적` | 무엇이 왜 바뀌나 — 한 문장 + 전/후 대비 | ✅ |
| `## 설계` | 결정마다 왜. 대안을 왜 안 골랐나 | 결정이 있었다면 |
| `## Changes` | 무엇을 바꿨나 + **의도적으로 안 바꾼 것** | ✅ |
| `## 리뷰 포인트` | 실제로 봐야 할 것 3~4개 | ✅ |
| `## Test plan` | 어떻게 검증했나 — 체크박스 | ✅ |
| `## 후속` | 이번 범위 밖 + **무엇을 기다리는지** | 있다면 |

`## 설계`가 가장 중요하다. 결정이 하나도 없었던 PR이면 생략해도 되지만,
생략한다는 건 "그냥 시킨 대로 했다"는 뜻이라 대개는 뭔가 빠진 것이다.

## 템플릿

```markdown
## 목적

<한 문장 요약 — 무엇이 왜 바뀌는지>

| | 전 | 후 |
|---|---|---|
| <축1> | <이랬다> | <이렇게 된다> |
| <축2> | <이랬다> | <이렇게 된다> |

적용 범위: <어디까지 영향을 받는지 한 줄>

## 설계

### 1. <결정 이름> — <한 줄 설명>

<표나 코드블록으로 규칙을 보이고, 산문으로 근거를 설명>

<B로 하면 X가 깨져서 A로 했다 — 이 형태로 쓴다>

### 2. <결정 이름>

> **함정:** <silent failure, 유지해야 하는 예외 등. 나중의 내가 밟을 지뢰>

## Changes

| 커밋 | 내용 |
|---|---|
| `abc1234` | <한 줄> |
| `def5678` | <한 줄> |

**유지 / 의도적 제외**

- <안 바꾼 것> — <왜 안 바꿨는지>

**함께 고친 버그**

- <있으면>

## 리뷰 포인트

- <포인트 1 — 실제로 봐야 할 자리>
- <포인트 2>
- <포인트 3>

## Test plan

- [ ] `pnpm run check-types` / `pnpm run lint` / `pnpm run test:vitest`
      → <결과. 실행 안 했으면 "미실행"이라고 정직하게>
- [ ] <정상 흐름 — 의도된 경로>
      → <기대 결과>
- [ ] <엣지 — 빈 결과 / 네트워크 실패 / 권한 / 타임존>
      → <기대 결과>
- [ ] <회귀 — 변경 밖 자리가 여전히 정상인지>
      → <기대 결과>

## 후속

- <이번 범위 밖 항목> — <왜 지금 못 하는지. 무엇을 기다리는지>
```

## 작성 규칙

- **시행착오를 빼라.** 했다가 되돌린 것, 커밋 재구성, 중간에 틀린 판단은 남기지 않는다.
- **결정의 why를 써라.** "A로 했다"보다 "B면 X가 깨져서 A로 했다".
- **의도적으로 안 한 것도 써라.** 리뷰어의 "이건 왜 안 했지?"를 미리 막는다.
- **후속은 무엇을 기다리는지를 써라.** "나중에 함"이 아니라 "#93이 머지돼야 시작 가능".
- **Test plan에 거짓을 쓰지 마라.** 실제 실행한 명령과 결과만. 안 돌렸으면 "미실행".
- 한국어. 영문은 코드 식별자(`useGLTF`, `roughnessMap`)만.
- 표와 코드블록을 적극적으로 써서 훑어 읽을 수 있게. 코드 블록은 짧게 (PR에 diff가 이미 있다).

### 상세 설계 문서가 따로 있으면

`docs/`에 설계 문서가 있으면 **맨 위에 링크하고 본문은 요약본으로** 둔다.
같은 내용을 두 군데 두면 반드시 한쪽이 낡는다.

```markdown
> 상세 분석: [docs/3d-performance/README.md](docs/3d-performance/README.md)
```

## CodeRabbit 자동 영역 보존

**이 저장소는 `.coderabbit.yaml`로 CodeRabbit이 붙어 있다.** `gh pr edit --body`로 본문을
통째로 덮어쓰면 봇이 채운 release notes가 사라진다.

| 영역 | 마커 |
|---|---|
| release notes | `<!-- This is an auto-generated comment: release notes by coderabbit.ai -->` … `<!-- end of auto-generated comment: release notes by coderabbit.ai -->` |
| review stack | `<!-- review_stack_entry_start -->` … `<!-- review_stack_entry_end -->` |

```bash
# 1) 기존 body 받기
OLD_BODY=$(env -u GITHUB_TOKEN gh pr view --json body -q .body)

# 2) 봇 자동 영역 추출
NOTES=$(echo "$OLD_BODY" | awk '
  /<!-- This is an auto-generated comment: release notes by coderabbit\.ai -->/ { p=1 }
  p { print }
  /<!-- end of auto-generated comment: release notes by coderabbit\.ai -->/ { exit }
')

# 3) 새 body = 우리 척추 + 보존 블록
NEW_BODY="$(cat docs/pr/{작업명}.md)"$'\n\n'"$NOTES"

# 4) 반영
env -u GITHUB_TOKEN gh pr edit --body "$NEW_BODY"
```

> release notes 안에 review stack 마커가 *중첩*되어 있을 수 있다. 그 경우 release notes 추출 1회면 충분하다.

> **마커 인용 주의** — 본문에서 봇 마커를 *예시로* 보여줄 때는 펜스드 코드블록 안에 두거나
> 평문으로 풀어쓴다. 글머리표 안에 인라인 백틱으로 박으면 봇이 **진짜 마커로 인식**해서
> 그 자리를 채우고 렌더링이 깨진다.

- **타이틀만 업데이트**: `env -u GITHUB_TOKEN gh pr edit --title "$TITLE"` — body를 안 건드리므로 항상 안전.

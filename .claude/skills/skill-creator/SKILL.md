---
name: skill-creator
description: chaen 프로젝트용 새 스킬을 만드는 메타 스킬. "스킬 만들어줘", "skill 생성", "새 스킬 추가", "스킬 크리에이터" 요청 시 트리거한다. AGENTS.md를 단일 출처로 참조하는 SKILL.md를 생성한다.
---

# Skill-Creator

`.claude/skills/{name}/SKILL.md`를 일관된 형식으로 작성한다.
chaen 스택(Next.js App Router + FSD + Panda CSS + Supabase + TanStack Query) 기준으로만 만든다. WIMC·MSW·Tailwind·Redux 같은 다른 스택 가정을 넣지 않는다.

## 핵심 원칙

- **컨벤션은 복제하지 않는다.** 단일 출처는 `AGENTS.md`("코드 컨벤션", "데이터 계층 패턴" 등)다. 스킬은 표를 옮겨 적지 않고 `> 규칙 기준: AGENTS.md "{섹션}"`으로 참조한다.
- 스킬은 **절차·예시 코드·체크리스트**만 자체 보유한다.

## Step 1: 정보 확인

| 항목     | 규칙                                              |
| -------- | ------------------------------------------------- |
| 이름     | kebab-case (예: `code-quality`)                   |
| 위치     | `.claude/skills/{name}/SKILL.md`                  |
| 트리거   | 사용자가 부를 자연어 문구 3개 이상                 |
| 참조     | 의존하는 `AGENTS.md` 섹션 목록                     |

`name`은 frontmatter와 디렉토리명이 반드시 일치한다.

## Step 2: frontmatter

```markdown
---
name: {name}
description: {한 줄 역할}. "{문구1}", "{문구2}", "{문구3}" 요청 시 트리거한다. {하지 않는 일}.
---
```

- 한국어로 쓴다. 트리거 문구를 따옴표로 나열한다(자동 선택 근거).
- 트리거하지 않는 경우/하지 않는 일을 명시한다.

## Step 3: 본문

한국어 명령형(`~한다`), 구조는 표·`Step N`·예시 코드(fenced)·체크리스트.

- 첫 문단에 스킬 범위를 적는다.
- 예시는 추상 코드 대신 **실제 파일 패턴**을 인용한다 (예: `src/shared/lib/query/query-keys.ts`, `src/features/browse-articles/model/use-browse-articles.ts`).
- 마지막에 `## 자가 확인` 체크리스트로 결과를 스스로 검증하게 한다.

## Step 4: 일관성 점검

기존 스킬(`code-quality`, `data-flow`, `component`)과 형식이 어긋나지 않는지 확인한다. 절차 스킬은 컨벤션을 복제하지 말고 `AGENTS.md` 섹션을 참조하되, **실제 파일 템플릿·단계**는 자체 보유한다(`data-flow`의 읽기 5단계처럼).

## 자가 확인

- [ ] `name`이 디렉토리명과 일치하는가?
- [ ] `description`에 트리거 문구가 3개 이상 있는가?
- [ ] 컨벤션을 복제하지 않고 `AGENTS.md` 섹션을 참조했는가?
- [ ] 예시가 실제 chaen 코드 패턴을 인용하는가?
- [ ] 자가 확인 체크리스트가 있는가?

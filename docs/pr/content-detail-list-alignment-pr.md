## 📝 작업 내용

> article/project 상세 아카이브 목록과 project 목록 API를 현재 content schema 기준으로 정리합니다.

1. article/project detail-list에서 남아 있던 `shadow` 명명과 불필요한 keyset 후처리를 제거합니다.
2. article detail-list는 상세 본문과 같은 locale fallback 체인을 공유하도록 맞춥니다.
3. project 목록의 다음 페이지 keyset 조건과 상세 페이지 data loader의 에러 처리 방식을 articles 쪽 기준으로 통일합니다.

<br/>

## 🚨 주요 고민 및 해결 과정

### 문제

- detail-list API는 현재 cursor가 없는데도 `limit + 1` 조회 후 keyset builder를 다시 태우는 레거시 흔적이 남아 있었습니다.
- article 상세 본문은 다단계 fallback을 쓰는데, 좌측 아카이브 목록은 `locale -> ko`만 타고 있어 같은 화면 안에서 정책이 달랐습니다.
- article/project 상세 페이지 data loader는 아카이브 목록 조회 에러를 빈 배열로 삼켜 실제 장애를 숨기고 있었습니다.
- project 목록의 keyset cursor 조건도 articles와 같은 종류의 조인 컬럼 실수가 있었습니다.

### 해결 과정

- detail-list는 정렬을 DB에 맡기고 `DETAIL_LIST_LIMIT`만 직접 적용하도록 단순화했습니다.
- article detail-list는 공용 locale fallback 체인을 사용해 본문과 같은 순서로 후보 locale을 탐색합니다.
- 상세 페이지 loader는 아카이브 목록 조회 실패를 그대로 surface하도록 바꿨습니다.
- project list는 `projects.created_at desc, id desc` 기준 cursor 조건으로 바로잡았습니다.

<br/>

## 📑 참고 문서/ ADR

- [get-article-detail-list.ts](/home/chaen/programming/chaen/src/entities/article/api/get-article-detail-list.ts)
- [get-project-detail-list.ts](/home/chaen/programming/chaen/src/entities/project/api/get-project-detail-list.ts)
- [get-projects.ts](/home/chaen/programming/chaen/src/entities/project/api/get-projects.ts)
- [GitHub PR template](/home/chaen/programming/chaen/.github/pull_request_template.md)

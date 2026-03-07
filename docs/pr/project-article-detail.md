## 📝 작업 내용

> 이번 PR에서 작업한 내용을 설명해주세요 (이미지 첨부 가능)

1. 프로젝트/아티클 상세 페이지를 좌측 아카이브 리스트와 우측 본문 중심의 공용 디테일 레이아웃으로 개편했습니다.
2. 아티클 전용 `view_count` 증가 API, 공유하기 버튼, 아티클 목록 서버 검색을 추가했습니다.
3. 썸네일/프로젝트 미디어 섹션을 제거하고, 번역/테스트/SQL 실행 문서를 함께 정리했습니다.

<br/>

## 🚨 주요 고민 및 해결 과정

> 주요 고민이나 문제 해결 과정 공유

### 문제

- 기존 상세 페이지는 `PageShell` 폭 제약과 섹션 구성이 강해서 아카이브형 2열 레이아웃을 자연스럽게 담기 어려웠습니다.
- 저장소에 전용 migration 디렉터리가 없어 조회수 컬럼 추가 이력을 어떤 방식으로 남길지 결정이 필요했습니다.
- 디테일 검색 요구가 중간에 변경되어, 상세 검색이 아니라 아티클 목록 검색으로 서버 조회 흐름을 다시 정리해야 했습니다.

### 해결 과정

- 상세 전용 공용 UI(`DetailPageShell`, `DetailMetaBar`)를 새로 만들고, 프로젝트/아티클 상세는 각각 필요한 메타/태그만 주입하는 구조로 분리했습니다.
- 조회수 컬럼 추가는 아티클 전용으로 `docs/sql/20260307_add_view_count_columns.sql`에 관리하고, 앱 코드는 migration 전후 모두 안전하게 `0`을 기본값으로 처리하도록 구성했습니다.
- 아티클 검색은 `getArticles`와 `/api/articles`에 직접 연결해 초기 SSR과 무한 스크롤이 같은 검색어를 유지하도록 맞췄습니다.

<br/>

## 📑 참고 문서/ ADR

> 참고한 외부 문서, 레퍼런스, 기술 블로그, 공식 문서 등의 링크

- [.github/pull_request_template.md](/home/chaen/programming/chaen/.github/pull_request_template.md)
- [docs/sql/20260307_add_view_count_columns.sql](/home/chaen/programming/chaen/docs/sql/20260307_add_view_count_columns.sql)

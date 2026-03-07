## 📝 작업 내용

> 이번 PR에서 작업한 내용을 설명해주세요 (이미지 첨부 가능)

1. 아티클 목록 뷰 개편 작업을 커밋 단위로 분리해서 진행한다.
2. 1차 범위는 검색 입력의 런타임 오류 원인 확인과 검색 input 상호작용 정리로 제한한다.
3. 2차 범위는 태그를 제외한 2단 레이아웃과 좌측 와이드 리스트 전환까지로 제한한다.
4. 태그 패널은 사용자 확인 후 다음 커밋에서 별도로 추가한다.
5. 프로젝트 카드와 아티클 와이드 리스트 모두 제목/설명이 길어질 때 최대 2줄까지만 노출되도록 clamp를 맞춘다.

<br/>

## 🚨 주요 고민 및 해결 과정

> 주요 고민이나 문제 해결 과정 공유

### 문제

- `/ko/articles` 검색 시 `search_articles` RPC에서 `operator does not exist: text < uuid` 오류가 발생하며 application error 화면으로 전환됨
- Supabase OpenAPI 기준 `search_articles.cursor_id`는 아직 `uuid`인데, 실제 `articles.id`는 `text`라서 함수 시그니처와 테이블 타입이 어긋남
- 현재 함수 목록에서도 `search_articles` 반환 타입이 `TABLE(id uuid, ...)`로 남아 있어 `ra.id < cursor_id` 비교 시 `text < uuid` 충돌이 재현됨
- `type="search"`의 브라우저 기본 삭제 버튼과 커스텀 삭제 버튼이 동시에 노출됨
- 아티클 목록을 카드 그리드에서 좌측 와이드 리스트 + 우측 검색 패널 구조로 재배치해야 함
- `ContentCard`는 현재 project 전용 사용이지만, 순수 표현 컴포넌트라 shared 유지 여부를 작업 중 검토해야 함

### 해결 과정

- 1차 커밋에서는 검색 UX가 깨지는 런타임 이슈의 실제 원인을 SQL 시그니처 불일치로 확정한다.
- 임시 fallback으로 relevance를 포기하지 않고, 현재 PL/pgSQL 함수 본문을 유지한 채 `cursor_id`와 반환 `id`를 `text`로 맞춘 수정 스크립트를 [fix-search-articles-rpc.sql](/Users/chaen/Programming/chaen/docs/sql/fix-search-articles-rpc.sql)에 정리한다.
- 입력은 `type="text" + role="searchbox"`로 바꾸고, 명시적 clear 버튼만 유지해 브라우저별 native cancel 차이를 없앤다.
- `불러오는 중입니다` 문구는 화면에서는 숨기고, 필요할 때만 screen reader에 상태를 전달한다.
- 2차 커밋에서는 태그를 건드리지 않고, 좌측 피드를 와이드 리스트 아이템으로 바꾸고 우측에 검색 패널만 먼저 배치한다.

<br/>

## 📑 참고 문서/ ADR

> 참고한 외부 문서, 레퍼런스, 기술 블로그, 공식 문서 등의 링크

- `.github/pull_request_template.md`

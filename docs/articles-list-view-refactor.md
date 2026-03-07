# Articles List View 최종 정리

## 목적

아티클 목록 화면을 카드 그리드에서 읽기 중심의 와이드 리스트로 바꾸고, 검색과 태그 필터를 같은 화면 안에서 처리하도록 정리했습니다.  
동시에 content/tag 스키마를 canonical 구조로 옮겨, 더 이상 locale row 기반 legacy 테이블이나 `text[] tags` fallback에 의존하지 않도록 마무리했습니다.

## 최종 결과

### UI 구조

- 데스크톱에서는 `좌측 아티클 리스트 + 우측 검색/태그 패널`의 2단 레이아웃을 사용합니다.
- 모바일에서는 패널이 위에서 아래로 자연스럽게 접히고, 작은 폭에서는 썸네일을 생략해 텍스트 리듬을 우선합니다.
- 아티클 목록은 카드 대신 와이드 리스트 아이템으로 렌더링합니다.
- 첫 번째 아이템에는 상단 border를 두지 않았습니다.
- 제목과 설명은 프로젝트 카드와 동일하게 최대 2줄까지만 노출합니다.
- 날짜는 [format-year-month-day.ts](/Users/chaen/Programming/chaen/src/shared/lib/date/format-year-month-day.ts)를 기준으로 `YYYY-MM-DD` 형식으로 통일했습니다.

### 검색 경험

- 검색은 다른 페이지로 이동하지 않고 현재 리스트의 결과만 갱신합니다.
- 입력은 작은 검색창 + 아이콘 버튼 조합으로 정리했습니다.
- 검색 버튼 텍스트는 화면에서는 아이콘으로만 보이고, screen reader용 label은 유지합니다.
- 검색 진행 상태는 시각적으로 과하게 드러내지 않고, 필요한 경우에만 보조기기에 전달합니다.
- 기존 `search_articles`의 `text < uuid` 타입 충돌 구간은 제거했고, 현재 검색은 translation 기반 RPC를 전제로 동작합니다.

### 태그 필터

- 태그 필터는 검색어와 별도 query param인 `tag`를 사용합니다.
- 우측 패널에는 locale 기준 인기 태그를 빈도순으로 노출합니다.
- 태그를 클릭하면 같은 리스트 뷰 안에서 해당 태그가 붙은 글만 다시 나열합니다.
- 인기 태그와 상세 태그 조회는 relation table 기준으로만 집계합니다.

### 접근성 / i18n

- 검색 input은 semantic form 안에서 동작하고 keyboard submit이 가능합니다.
- 검색 상태와 버튼 label은 보조기기에서 읽을 수 있게 유지했습니다.
- 아티클 링크 `aria-label`과 검색 관련 텍스트는 locale 메시지로 분리했습니다.
- 이 페이지의 하드코딩된 한국어 label을 줄이고 locale 메시지를 우선 사용하도록 정리했습니다.

## 데이터 구조 최종 상태

현재 런타임은 아래 canonical 스키마를 기준으로 읽습니다.

- `articles`
- `article_translations`
- `article_tags`
- `projects`
- `project_translations`
- `project_tags`
- `tags`
- `tag_translations`

의미는 아래와 같습니다.

- `articles`, `projects`는 공통 메타를 가진 base entity
- `article_translations`, `project_translations`는 locale별 번역 데이터
- `article_tags`, `project_tags`는 locale 없는 relation table
- `tags`, `tag_translations`는 canonical slug와 locale label 사전

즉, 예전의 “언어별 포스터를 전부 원본처럼 들고 있던 상태”에서 “원본은 하나이고 번역 포스터만 별도로 붙는 상태”로 정리됐습니다.

## 제거된 의존성

이번 작업을 통해 아래 legacy 의존성을 걷어냈습니다.

- `articles.tags`, `projects.tags`의 `text[]` 기반 필터
- `article_tags`, `project_tags`의 locale row fallback
- `articles`, `projects` locale row 테이블 직접 조회 fallback
- `search_articles` RPC fallback
- `get_popular_article_tags` RPC fallback

현재 앱은 canonical content schema와 relation schema를 전제로 동작합니다.

## 📝 작업 내용

> 이번 PR에서 작업한 내용을 설명해주세요 (이미지 첨부 가능)

1. 아티클 상세 조회에 locale fallback 체인을 도입하고, 반복 조회 대신 DB RPC 한 번으로 우선순위를 계산하도록 바꿨습니다.
2. 관련 테스트와 migration을 추가해 `ko -> en -> ja -> fr` 규칙과 `en -> ko` 예외를 검증할 수 있게 했습니다.
3. `content-shadow-schema.ts`, `shadow`, `canonical` 같은 과거 용어를 제거하고, 현재 구조에 맞는 파일명/함수명/에러 메시지로 정리했습니다.
4. article/project/tag API 전반의 Supabase 리소스 접근 방식을 다른 도메인 API와 같은 스타일로 맞췄습니다.

<br/>

## 🚨 주요 고민 및 해결 과정

> 주요 고민이나 문제 해결 과정 공유

### 문제

- `article_translations`는 `ko/en/ja/fr`를 지원하지만 상세 조회 코드는 `요청 locale -> ko`까지만 확인하고 있었습니다.
- 현재 스키마에는 아티클별 기본 locale 컬럼이 없어 “기본 locale 우선”을 DB만으로 결정할 수 없습니다.
- 마지막 fallback까지 번역이 없을 때 현재 코드는 `null`을 반환해 라우트에서 `notFound()`로 끝났습니다.
- locale fallback을 애플리케이션 `for` 루프로 돌리면 locale 수만큼 DB round-trip이 늘어납니다.
- 과거 cutover 전략에서 남은 `shadow` 용어가 현재 구조를 잘못 설명해 에러 해석을 어렵게 만들고 있었습니다.
- 현재 워크트리에는 기능 변경과 명칭 정리, 구조 정리가 섞여 있어 적절한 커밋 분리가 필요합니다.

### 해결 과정

- 첫 단위에서는 현재 런타임에서 확실히 알 수 있는 값인 요청 locale을 첫 후보로 보고 `ko -> en -> ja -> fr`를 중복 없이 이어 붙이는 규칙을 적용했습니다.
- `en` 요청은 요구사항에 맞춰 `en -> ko`까지만 조회하도록 별도 처리했습니다.
- 최종 상세 조회는 `get_article_translation_with_fallback` RPC에서 `array_position`으로 fallback 우선순위를 정렬해 한 번에 첫 번역을 고르도록 바꿨습니다.
- 상세 조회에서 fallback 후보 전체가 비어 있으면 원인을 바로 식별할 수 있도록 명시적 에러 메시지를 던지도록 바꿨습니다.
- article/project 계층의 에러 메시지와 테스트 이름도 `content schema`, `번역 조회`, `검색 조회`처럼 실제 실패 원인을 드러내는 표현으로 정리했습니다.
- 커밋은 기능 추가, Supabase 접근 정리, 용어/이름 정리로 나눠야 리뷰 포인트가 명확해집니다.

<br/>

## 🧩 권장 커밋 분리

### 1. 아티클 상세 locale fallback 기능

- 추천 제목: `feat(article): 상세 번역 locale fallback RPC 도입`
- 커밋 메시지: `아티클 상세 조회에 locale fallback 규칙과 단일 RPC 조회를 추가한다`
- 목적:
  - 실제 동작 변경인 locale fallback 규칙과 미조회 오류 처리를 먼저 분리합니다.
  - DB migration과 런타임 코드, 테스트를 한 묶음으로 유지합니다.
- 포함 파일:
  - [src/entities/article/api/get-article.ts](/home/chaen/programming/chaen/src/entities/article/api/get-article.ts)
  - [src/entities/article/api/get-article.test.ts](/home/chaen/programming/chaen/src/entities/article/api/get-article.test.ts)
  - [src/entities/article/model/locale-fallback.ts](/home/chaen/programming/chaen/src/entities/article/model/locale-fallback.ts)
  - [src/entities/article/model/locale-fallback.test.ts](/home/chaen/programming/chaen/src/entities/article/model/locale-fallback.test.ts)
  - [supabase/migrations/20260309032000_create_get_article_translation_with_fallback.sql](/home/chaen/programming/chaen/supabase/migrations/20260309032000_create_get_article_translation_with_fallback.sql)
- 메모:
  - 가능하면 이 커밋에는 naming 정리와 `content-shadow-schema.ts` 제거를 섞지 않는 편이 좋습니다.

### 2. Supabase 리소스 접근 방식 통일

- 추천 제목: `refactor(api): content schema 상수 의존성을 제거한다`
- 커밋 메시지: `article project tag api의 테이블명과 rpc 이름 사용 방식을 통일한다`
- 목적:
  - `content-shadow-schema.ts` 제거와 직접 문자열 사용 방식을 guestbook/article-comment와 동일하게 맞춥니다.
  - 런타임 동작보다 접근 패턴 통일에 초점을 둡니다.
- 포함 파일:
  - [src/entities/article/api/get-articles.ts](/home/chaen/programming/chaen/src/entities/article/api/get-articles.ts)
  - [src/entities/article/api/get-article-detail-list.ts](/home/chaen/programming/chaen/src/entities/article/api/get-article-detail-list.ts)
  - [src/entities/article/api/get-popular-article-tags.ts](/home/chaen/programming/chaen/src/entities/article/api/get-popular-article-tags.ts)
  - [src/entities/project/api/get-project.ts](/home/chaen/programming/chaen/src/entities/project/api/get-project.ts)
  - [src/entities/project/api/get-projects.ts](/home/chaen/programming/chaen/src/entities/project/api/get-projects.ts)
  - [src/entities/project/api/get-project-detail-list.ts](/home/chaen/programming/chaen/src/entities/project/api/get-project-detail-list.ts)
  - [src/entities/tag/api/query-tags.ts](/home/chaen/programming/chaen/src/entities/tag/api/query-tags.ts)
  - [src/shared/lib/supabase/content-shadow-schema.ts](/home/chaen/programming/chaen/src/shared/lib/supabase/content-shadow-schema.ts)
- 메모:
  - 이 커밋에서는 직접 문자열 사용이 다른 도메인 API와 동일한지 설명하는 게 좋습니다.

### 3. 명칭과 에러 메시지 정리

- 추천 제목: `refactor(content): shadow canonical 용어를 제거한다`
- 커밋 메시지: `translation mapper와 에러 메시지의 레거시 용어를 현재 구조에 맞게 정리한다`
- 목적:
  - 리뷰어가 동작 변경과 이름 정리를 구분해서 볼 수 있게 합니다.
  - 파일명 rename, mapper 함수 rename, 테스트 이름 변경을 한 묶음으로 정리합니다.
- 포함 파일:
  - [src/entities/article/api/map-article-translation.ts](/home/chaen/programming/chaen/src/entities/article/api/map-article-translation.ts)
  - [src/entities/project/api/map-project-translation.ts](/home/chaen/programming/chaen/src/entities/project/api/map-project-translation.ts)
  - [src/entities/article/api/get-articles.test.ts](/home/chaen/programming/chaen/src/entities/article/api/get-articles.test.ts)
  - [src/entities/article/api/get-article-detail-list.test.ts](/home/chaen/programming/chaen/src/entities/article/api/get-article-detail-list.test.ts)
  - [src/entities/article/api/get-popular-article-tags.test.ts](/home/chaen/programming/chaen/src/entities/article/api/get-popular-article-tags.test.ts)
  - [src/entities/project/api/get-project.test.ts](/home/chaen/programming/chaen/src/entities/project/api/get-project.test.ts)
  - [src/entities/project/api/get-projects.test.ts](/home/chaen/programming/chaen/src/entities/project/api/get-projects.test.ts)
  - [src/entities/project/api/get-project-detail-list.test.ts](/home/chaen/programming/chaen/src/entities/project/api/get-project-detail-list.test.ts)
- 메모:
  - 실제로는 일부 런타임 파일에도 메시지 문자열 변경이 섞여 있으니 `git add -p`로 잘라 담는 편이 안전합니다.

<br/>

## 📦 PR 제외 대상

- [docs/articles](/home/chaen/programming/chaen/docs/articles)
- 이유:
  - 현재 작업 주제와 무관한 untracked 문서이며, 이 PR에 섞이면 리뷰 범위를 흐립니다.

<br/>

## 📑 참고 문서/ ADR

> 참고한 외부 문서, 레퍼런스, 기술 블로그, 공식 문서 등의 링크

- [GitHub PR template](/home/chaen/programming/chaen/.github/pull_request_template.md)

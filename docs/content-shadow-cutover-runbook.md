# Content Shadow Cutover Runbook

## 목적

이 문서는 maintenance window에서 content shadow schema를 canonical schema로 전환할 때
실제로 수행할 순서를 짧고 명확하게 정리한 실행용 체크리스트입니다.

설계 배경과 SQL 초안 설명은 아래 문서를 참고합니다.

- [content-shadow-cutover.md](/Users/chaen/Programming/chaen/docs/content-shadow-cutover.md)
- [content-shadow-cutover.sql](/Users/chaen/Programming/chaen/docs/sql/content-shadow-cutover.sql)

## 사전 조건

아래가 모두 끝난 상태여야 합니다.

- shadow runtime 읽기 경로 검증 완료
- `article_translations.fts_vector`와 `search_article_translations` 적용 완료
- `articles_v2`, `projects_v2`, `article_tags_v2`, `project_tags_v2` row count 확인 완료
- 앱 코드가 [content-shadow-schema.ts](/Users/chaen/Programming/chaen/src/shared/lib/supabase/content-shadow-schema.ts)만 통해 schema 이름을 읽도록 정리 완료

## Maintenance Window 순서

### 1. 사전 확인

아래 쿼리를 SQL Editor에서 먼저 확인합니다.

```sql
select count(*) from public.articles_v2;
select count(*) from public.article_translations;
select count(*) from public.projects_v2;
select count(*) from public.project_translations;
select count(*) from public.article_tags_v2;
select count(*) from public.project_tags_v2;
```

```sql
select count(*) from public.article_translations where fts_vector is null;
```

```sql
select *
from public.search_article_translations(
  'react',
  'ko',
  12,
  null,
  null,
  null
);
```

### 2. Cutover SQL 실행

아래 파일 전체를 SQL Editor에서 실행합니다.

- [content-shadow-cutover.sql](/Users/chaen/Programming/chaen/docs/sql/content-shadow-cutover.sql)

이 단계에서 일어나는 일:

- `articles` -> `articles_legacy`
- `projects` -> `projects_legacy`
- `article_tags` -> `article_tags_legacy`
- `project_tags` -> `project_tags_legacy`
- `articles_v2` -> `articles`
- `projects_v2` -> `projects`
- `article_tags_v2` -> `article_tags`
- `project_tags_v2` -> `project_tags`
- `search_article_translations`를 canonical `articles` 기준으로 재정의

### 3. 앱 코드 전환

[content-shadow-schema.ts](/Users/chaen/Programming/chaen/src/shared/lib/supabase/content-shadow-schema.ts)에서 아래 타깃 값만 바꿉니다.

변경 전:

```ts
export const CONTENT_SCHEMA_TARGET = 'shadow' as const;
```

변경 후:

```ts
export const CONTENT_SCHEMA_TARGET = 'canonical' as const;
```

그 뒤 앱을 배포합니다.

### 4. Smoke Test

배포 직후 아래 흐름을 확인합니다.

- 아티클 목록
- 아티클 검색
- 아티클 태그 필터
- 아티클 상세
- 프로젝트 목록
- 프로젝트 상세

SQL로도 최소 확인을 합니다.

```sql
select to_regclass('public.articles');
select to_regclass('public.projects');
select to_regclass('public.article_tags');
select to_regclass('public.project_tags');
select to_regclass('public.articles_legacy');
select to_regclass('public.projects_legacy');
```

```sql
select *
from public.search_article_translations(
  'react',
  'ko',
  12,
  null,
  null,
  null
);
```

### 5. 안정화 이후 Cleanup

바로 drop하지 않습니다.

- `articles_legacy`
- `projects_legacy`
- `article_tags_legacy`
- `project_tags_legacy`

를 잠시 유지한 뒤, 충분히 안정화되면 별도 cleanup SQL로 제거합니다.

## Rollback 관점

이 단계는 “전시장 이름표 교체”에 가깝습니다.

- SQL cutover 전: shadow 주소
- SQL cutover 후: canonical 주소
- 앱 전환: 주소록 한 줄 변경

즉 rollback도 같은 축으로 보면 됩니다.

1. SQL이 아직 실행되지 않았다면 앱 코드는 그대로 둡니다.
2. SQL이 실행됐지만 앱 배포 전이면 [content-shadow-schema.ts](/Users/chaen/Programming/chaen/src/shared/lib/supabase/content-shadow-schema.ts)를 canonical로 바꿔 배포합니다.
3. 더 큰 rollback이 필요하면 `_legacy` 테이블을 기준으로 별도 복구 SQL을 준비해야 합니다.

## 한 줄 요약

실행 순서는 `사전 검증 -> cutover SQL -> 상수 한 줄 전환 -> 배포 -> smoke test` 입니다.

# Content Shadow Schema Cutover

## 목적

현재 상태는 아래와 같습니다.

- `articles/projects/article_tags/project_tags`가 canonical 이름으로 전환됨
- `articles_legacy/projects_legacy/article_tags_legacy/project_tags_legacy`가 rollback 용도로 남아 있음
- 앱 런타임은 [content-shadow-schema.ts](/Users/chaen/Programming/chaen/src/shared/lib/supabase/content-shadow-schema.ts)에서 `canonical` 타깃을 읽음
- 아티클 검색은 `search_article_translations` RPC 기준으로 동작함
- 태그 필터와 인기 태그는 더 이상 `text[] tags`나 `get_popular_article_tags` RPC에 의존하지 않음

즉 지금은 “새 캔버스로 전시 교체는 끝났고, 창고에 옛 액자만 남아 있는 상태”입니다.  
이 문서는 남은 정리와 검증 포인트를 정리합니다.

## 결론

남은 순서는 아래가 맞습니다.

1. 운영 환경 smoke test와 모니터링으로 canonical 전환 상태를 검증
2. `_legacy` 테이블 유지 기간을 거친 뒤 cleanup SQL 실행
3. 필요하면 rollback 절차를 별도 문서로 고정

## 현재 남아 있는 제약

### 1. `_legacy` 테이블 잔존

현재 DB에는 아래 테이블이 rollback 안전장치로 남아 있습니다.

- `articles_legacy`
- `projects_legacy`
- `article_tags_legacy`
- `project_tags_legacy`

의미:

- canonical 전환 이후 문제가 생겼을 때 원본 데이터를 바로 확인할 수 있습니다.

정리 시점:

- 운영 안정화와 smoke test가 충분히 끝난 뒤

## cutover 전에 확인해야 하는 것

### 데이터 검증

```sql
select count(*) from public.articles;
select count(*) from public.article_translations;
select count(*) from public.projects;
select count(*) from public.project_translations;
select count(*) from public.article_tags;
select count(*) from public.project_tags;
```

### translation 중복 확인

```sql
select article_id, locale, count(*)
from public.article_translations
group by article_id, locale
having count(*) > 1;

select project_id, locale, count(*)
from public.project_translations
group by project_id, locale
having count(*) > 1;
```

### relation 중복 확인

```sql
select article_id, tag_id, count(*)
from public.article_tags
group by article_id, tag_id
having count(*) > 1;

select project_id, tag_id, count(*)
from public.project_tags
group by project_id, tag_id
having count(*) > 1;
```

### search shadow schema 확인

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

## 코드 기준 남은 작업

cutover 이후 남은 작업은 아래 정도입니다.

### 필수

1. `_legacy` cleanup SQL 초안 확정
2. rollback 기준과 보존 기간 확정

### 권장

1. `*_legacy`를 참조하는 운영 점검 쿼리 세트 분리
2. revalidate 태그와 캐시 키가 cutover 뒤에도 변하지 않는지 재확인

## 권장 실행 순서

### 1단계. smoke test

확인 대상:

- 아티클 목록
- 아티클 검색
- 아티클 태그 필터
- 아티클 상세
- 프로젝트 목록
- 프로젝트 상세

### 2단계. 충분한 안정화 이후 legacy 테이블 제거

즉시 drop하지 않고, 잠시 `_legacy` 상태로 남겨두는 편이 안전합니다.

## 실행용 SQL

실행한 cutover SQL과 runbook은 아래 파일에 정리합니다.

- [content-shadow-cutover.sql](/Users/chaen/Programming/chaen/docs/sql/content-shadow-cutover.sql)
- [content-shadow-legacy-cleanup.sql](/Users/chaen/Programming/chaen/docs/sql/content-shadow-legacy-cleanup.sql)
- [content-shadow-rollback.sql](/Users/chaen/Programming/chaen/docs/sql/content-shadow-rollback.sql)
- [content-shadow-cutover-runbook.md](/Users/chaen/Programming/chaen/docs/content-shadow-cutover-runbook.md)

이미 실행된 cutover는 단순 rename만 하지 않습니다.

- `articles_v2/projects_v2/article_tags_v2/project_tags_v2`를 canonical 이름으로 바꿉니다.
- `search_article_translations`가 더 이상 `articles_v2`를 보지 않도록 canonical `articles` 기준으로 다시 정의합니다.
- legacy `search_articles`, `get_popular_article_tags` RPC를 정리합니다.

안정화 기간이 끝나면 `_legacy` 테이블 제거는 아래 SQL로 분리해 수행합니다.

- [content-shadow-legacy-cleanup.sql](/Users/chaen/Programming/chaen/docs/sql/content-shadow-legacy-cleanup.sql)

rollback이 필요하면 아래 SQL로 canonical 이름을 shadow + legacy 상태로 되돌립니다.

- [content-shadow-rollback.sql](/Users/chaen/Programming/chaen/docs/sql/content-shadow-rollback.sql)

## 한 줄 요약

지금은 “주소 변경은 끝났고, 옛집 정리만 남은 상태”입니다.

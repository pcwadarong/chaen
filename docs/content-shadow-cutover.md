# Content Shadow Schema Cutover

## 목적

현재 상태는 아래와 같습니다.

- `articles_v2`, `projects_v2`, `article_translations`, `project_translations` shadow schema가 생성됨
- `article_tags_v2`, `project_tags_v2` relation table이 backfill됨
- 읽기 경로는 shadow schema 우선으로 동작함
- 아티클 검색은 `search_article_translations` RPC 기준으로 동작함
- 태그 필터와 인기 태그는 더 이상 `text[] tags`나 `get_popular_article_tags` RPC에 의존하지 않음

즉 지금은 “새 캔버스만 실제로 보고 있고, 주소만 아직 임시 이름을 쓰는 상태”입니다.  
이 문서는 그 임시 이름을 언제, 어떤 순서로 걷어낼지 정리합니다.

## 결론

다음 순서가 맞습니다.

1. 운영 환경에서 shadow runtime을 충분히 검증
2. 코드에서 `*_v2` 직접 참조를 canonical 이름으로 치환할 준비를 마무리
3. 그 다음에만 DB cutover SQL 실행
4. 마지막으로 legacy RPC / legacy relation table 정리

즉, **지금 바로 rename cutover SQL을 실행하면 안 됩니다.**

이유:

- 현재 런타임은 여전히 `articles_v2`, `projects_v2`, `article_tags_v2`, `project_tags_v2`를 직접 읽습니다.
- 현재 런타임은 더 이상 legacy fallback 없이 shadow schema만 읽습니다.
- 이 상태에서 canonical rename 전에는 코드가 `*_v2` 이름에 직접 결합되어 있으므로, rename 순서를 건너뛰면 런타임 오류가 날 수 있습니다.

## 현재 남아 있는 제약

### 1. shadow 테이블 이름 직접 참조

현재 런타임은 아래 이름을 직접 읽습니다.

- `articles_v2`
- `projects_v2`
- `article_tags_v2`
- `project_tags_v2`
- `article_translations`
- `project_translations`

의미:

- cutover 전까지는 shadow schema 이름이 런타임 계약 자체입니다.

해결 시점:

- rename cutover SQL을 실행하면서 canonical 이름으로 전환할 때

## cutover 전에 확인해야 하는 것

### 데이터 검증

```sql
select count(*) from public.articles_v2;
select count(*) from public.article_translations;
select count(*) from public.projects_v2;
select count(*) from public.project_translations;
select count(*) from public.article_tags_v2;
select count(*) from public.project_tags_v2;
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
from public.article_tags_v2
group by article_id, tag_id
having count(*) > 1;

select project_id, tag_id, count(*)
from public.project_tags_v2
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

DB cutover 전에 아래 코드 정리 커밋이 먼저 필요합니다.

### 필수

1. `articles_v2`, `projects_v2`, `article_tags_v2`, `project_tags_v2` 직접 참조를 canonical 이름으로 바꾸기
2. cutover 이후 `_legacy` cleanup 순서 점검

### 권장

1. `*_legacy`를 참조하는 테스트 fixture 추가
2. revalidate 태그와 캐시 키가 cutover 뒤에도 변하지 않는지 점검

## 권장 실행 순서

### 1단계. 코드 cleanup 커밋

이 단계에서:

- shadow schema만 읽게 변경
- canonical schema rename을 받을 수 있게 참조 이름만 정리
- runtime이 canonical schema cutover를 받을 준비 완료

### 2단계. maintenance window에 cutover SQL 실행

이 단계에서:

- 기존 locale-row 테이블은 `_legacy`로 rename
- `*_v2` 테이블은 canonical 이름으로 rename
- 남아 있는 legacy view/table cleanup

### 3단계. smoke test

확인 대상:

- 아티클 목록
- 아티클 검색
- 아티클 태그 필터
- 아티클 상세
- 프로젝트 목록
- 프로젝트 상세

### 4단계. 충분한 안정화 이후 legacy 테이블 제거

즉시 drop하지 않고, 잠시 `_legacy` 상태로 남겨두는 편이 안전합니다.

## 실행용 SQL

최종 cutover SQL 초안은 아래 파일에 정리합니다.

- [content-shadow-cutover.sql](/Users/chaen/Programming/chaen/docs/sql/content-shadow-cutover.sql)

## 한 줄 요약

지금은 “이사 짐을 새 집에 옮겨둔 상태”이고,  
이 문서의 cutover는 “주소 변경과 옛집 정리” 단계입니다.

begin;

-- 주의:
-- 이 SQL은 canonical schema 전환이 충분히 안정화된 뒤에만 실행합니다.
-- 아래 테이블을 drop하면 locale-row 기준 rollback 재료도 함께 사라집니다.
--
-- 권장 사전 확인:
-- select to_regclass('public.articles_legacy');
-- select to_regclass('public.projects_legacy');
-- select to_regclass('public.article_tags_legacy');
-- select to_regclass('public.project_tags_legacy');

drop table if exists public.article_tags_legacy;
drop table if exists public.project_tags_legacy;
drop table if exists public.articles_legacy;
drop table if exists public.projects_legacy;

commit;

-- 실행 후 확인 예시
--
-- select to_regclass('public.articles_legacy');
-- select to_regclass('public.projects_legacy');
-- select to_regclass('public.article_tags_legacy');
-- select to_regclass('public.project_tags_legacy');
--
-- 모두 null 이면 cleanup이 끝난 상태입니다.

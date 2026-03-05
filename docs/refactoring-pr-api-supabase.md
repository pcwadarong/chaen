## 📝 작업 내용

1. 프로젝트/아티클 목록 조회 API를 단일 함수로 통합했습니다.

- `getProjects`, `getArticles`가 `cursor/limit/locale`을 받아 `{ items, nextCursor }`를 반환하도록 변경
- 기존 `get-projects-page`, `get-articles-page` 분리 제거
- 적용 경로: `home`, `work`, `articles` route + `/api/projects`, `/api/articles`

2. 홈 프로젝트 미리보기 조회를 서버 단계에서 `3개`로 제한했습니다.

- `[locale]/(home)/page.tsx`에서 `getProjects({ locale, limit: 3 })` 호출
- 더 이상 route에서 `slice(0, 3)` 하지 않음

3. 공통화 범위를 방명록까지 확장했습니다.

- guestbook client/hook fetch·에러 처리 공통화 (`requestJsonApiClient`, `getErrorMessage`)
- guestbook thread 조회의 cursor/limit 파싱을 shared parser로 통일
  - `parseOffsetCursor`, `parseOffsetLimit`

4. 무한 스크롤 공통 구조를 프로젝트/아티클에 적용했습니다.

- 공통 훅: `useOffsetPaginationFeed`
- 도메인 훅/UI: `useProjectFeed`/`ProjectFeed`, `useArticleFeed`/`ArticleFeed`
- i18n 상태 문구(`loading`, `loadError`, `retry`, `loadMoreEnd`) 4개 로케일 반영

5. 테스트/검증을 리팩토링 순서대로 유지했습니다.

- 선실행 -> 커버리지 보강 -> 구현 -> 재실행
- 최종 검증: `pnpm lint`, `pnpm typecheck`, `pnpm test` 모두 통과

6. 미사용으로 확인된 `src/lib/supabase/browser.ts` 삭제

7. 방명록 보안/캐시/실패 복구 경로를 보강했습니다.

- 비밀번호 해시 검증에 `scrypt` 비용 파라미터(`N/r/p`)와 `maxmem`을 명시 적용
- `guestbook:replies:{parentId}` 캐시 태그를 추가하고, POST/PATCH/DELETE에서 부모 답글 캐시도 무효화
- 새 글 작성 낙관적 업데이트 실패 시 롤백 동작을 `GuestbookBoard` 테스트로 고정
- 원댓글 삭제 UX를 규칙화: 답댓글이 있으면 `"삭제된 글입니다."`로 자리 유지, 답댓글이 없으면 목록에서 제거
- 삭제된 원댓글 상태에서는 `수정/삭제/답신` 액션을 노출하지 않도록 처리
- 관련 테스트 추가: `password.test.ts`, `guestbook-board.test.tsx`, route/get-threads 확장 케이스

8. FSD 경계 정리를 위해 app route의 데이터 조합 로직을 views/model loader로 이동했습니다.

- 대상: `home`, `articles`, `work`, `resume` route
- 추가: `getHomePageData`, `getArticlesPageData`, `getWorkListPageData`, `getResumePageData`
- route는 loader 호출 + view 렌더만 수행하도록 단순화
- loader 단위 테스트 4개 추가 및 기존 route 테스트를 loader mock 기준으로 갱신

9. Supabase 공통 코드 경계를 `shared/lib/supabase`로 단일화했습니다.

- `src/lib/supabase/*`를 `src/shared/lib/supabase/*`로 이동
- import/mock 경로를 `@/shared/lib/supabase/*`로 통일
- `config`, `public-server`, `server`, `service-role`, `middleware` 모듈을 shared로 일원화

<br/>

## 🚨 주요 고민 및 해결 과정

- app 라우트 파일이 엔터티 API/번역/파일 URL 조합까지 직접 처리해 레이어 경계가 흐려져 있었습니다.

### 문제

- 목록 조회 로직이 `get`/`get-page`로 분리되어 있어 호출 경로가 중복되고, home/work/articles에서 사용 방식이 달랐습니다.
- 홈에서만 클라이언트/route 단에서 `slice(0, 3)` 처리되어 조회 책임이 분산되어 있었습니다.
- 방명록은 fetch/에러는 일부 공통화됐지만 cursor/limit 파싱 기준이 article/project와 일치하지 않았습니다.
- 리팩토링 이후 남아 있는 파일 중 실제 참조되지 않는 파일을 정리할 필요가 있었습니다.
- 방명록의 비밀번호 파생키 비용 설정, 답글 단위 캐시 무효화, 낙관적 실패 롤백 검증이 부족했습니다.
- Supabase 인프라 코드가 `lib/supabase`와 `shared/lib/supabase`로 분산되어 import 기준이 혼재되어 있었습니다.

### 해결 과정

- 목록 조회를 `getProjects`/`getArticles` 단일 진입점으로 통합하고, 페이지 응답 형태를 표준화했습니다.
- home은 `limit: 3` 1페이지 조회로 변경해 데이터 절단 책임을 API 계층으로 이동했습니다.
- 방명록 thread 조회에서 `parseOffsetCursor`, `parseOffsetLimit`를 사용하도록 변경해 pagination 파싱 기준을 통일했습니다.
- 루트/테스트/설정 파일까지 포함해 참조를 재검증한 뒤, 실제 미사용 파일만 삭제했습니다.
- `scrypt` 옵션을 명시해 비밀번호 검증 강도를 고정했고, 답글 캐시 태그를 추가해 부모/답글 수정·삭제 시 무효화 범위를 명확히 했습니다.
- `GuestbookBoard` 실패 경로 테스트를 추가해 낙관적 생성 후 API 실패 시 `removeThreadById` 롤백을 보장했습니다.
- 서버 데이터 조합 책임을 `views/*/model` loader로 이동해 app을 라우팅 전용 계층으로 정리했습니다.
- Supabase 관련 공통 코드를 `shared/lib/supabase`로 이동해 레이어 경계를 명확히 하고 import 일관성을 확보했습니다.

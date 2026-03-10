## 📝 작업 내용

> 이번 PR에서 작업한 내용을 설명해주세요 (이미지 첨부 가능)

1. Unit 1: stable 호환 `useCache`, `zod`, 공통 Server Action 계약 준비
2. Unit 1: `useOffsetPaginationFeed`를 함수 주입형 구조로 리팩터링
3. Unit 1: Supabase 서버 클라이언트의 쿠키 읽기/쓰기 테스트 추가
4. Unit 2: auth/guestbook를 Server Action + `useActionState` 구조로 전환
5. Unit 2: guestbook API Route 제거 및 관련 테스트 이관
6. Unit 3: article comments/feed/archive/view count를 Server Action 기반으로 전환
7. Unit 3: articles/projects/comments/view API Route 제거 및 테스트 이관
8. Unit 4: 주요 entities 조회 함수를 `use cache` + tag 기반으로 전환
9. Unit 4: 더 이상 쓰지 않는 `requestJsonApiClient` 제거
10. Follow-up: 남아 있던 `revalidate` API route와 HTTP 에러 응답 헬퍼 제거
11. Follow-up: `getPopularArticleTags`도 `use cache` 패턴으로 통일

<br/>

## 🚨 주요 고민 및 해결 과정

> 주요 고민이나 문제 해결 과정 공유

### 문제

- API Route 제거 전에 공통 action 계약과 검증 방식이 먼저 필요했습니다.
- 이후 Unit에서 Server Action으로 옮길 수 있도록 무한 스크롤 훅이 endpoint 문자열에 고정되어 있었습니다.
- Supabase 서버 클라이언트가 Server Action 안에서 쿠키를 정상 반영하는지 먼저 고정할 필요가 있었습니다.
- `next@15.5.3` stable에서는 `dynamicIO`가 canary 전용 제약에 걸려 대체 설정이 필요했습니다.

### 해결 과정

- `ActionResult`와 Zod 검증 헬퍼를 먼저 추가해 이후 action 구현의 기반을 마련합니다.
- `useOffsetPaginationFeed`는 `loadPage` 함수를 주입받도록 바꿔 API fetch 의존을 분리합니다.
- `createServerSupabaseClient`가 `cookies().getAll()`과 `setAll()`을 통해 최신 세션 쿠키를 읽고 쓸 수 있는지 테스트로 보장합니다.
- `dynamicIO`는 보류하고 stable에서 동작하는 `experimental.useCache`로 기반 설정만 먼저 맞춥니다.
- 로그인/로그아웃은 Server Action 내부에서 직접 Supabase auth를 호출하고 성공 시 server redirect로 이동합니다.
- 방명록 작성/비밀글 검증은 `form action={serverAction}` + `useActionState`로 구성해 JS가 없어도 기본 제출이 가능하게 맞춥니다.
- 방명록 수정/삭제 모달은 JS 의존을 유지하되 API Route 대신 Server Action 직접 호출로 전환합니다.
- 댓글 작성 폼은 루트/답글 각각 `useActionState`를 사용하고 `form action={serverAction}` 기반으로 바꿉니다.
- 댓글 수정/삭제 모달은 API client 대신 Server Action 직접 호출로 전환하고, 실패 메시지는 `ActionResult`로 통일합니다.
- 아티클/프로젝트 목록, 상세 아카이브, 조회수 증가는 `/api/...` fetch 대신 entity action을 직접 호출하도록 바꿉니다.
- `getArticles`, `getArticle`, `getArticleDetailList`, `getProjects`, `getProject`, `getProjectDetailList`, `getGuestbookThreads`, `getArticleComments`는 `unstable_cache` 대신 함수 내부 `'use cache'`와 `unstable_cacheTag`를 사용하도록 정리합니다.
- 마지막으로 남아 있던 `getPopularArticleTags`도 같은 방식으로 옮겨 article 조회 계층의 캐시 전략을 하나로 맞춥니다.
- 쓰기 action이 이미 호출하던 `revalidateTag`가 실제 읽기 캐시 태그와 맞물리도록 댓글/방명록 캐시 태그를 세분화합니다.
- 남은 HTTP 전용 유틸(`requestJsonApiClient`)은 앱 코드에서 사용처가 사라졌으므로 제거합니다.
- 더 이상 호출되지 않는 `src/app/api/revalidate/...` route와 `createApiErrorResponse`도 함께 제거해 dead HTTP surface를 정리합니다.

<br/>

## 📑 참고 문서/ ADR

> 참고한 외부 문서, 레퍼런스, 기술 블로그, 공식 문서 등의 링크

- https://nextjs.org/docs/app/api-reference/config/next-config-js/useCache
- https://nextjs.org/docs/15/app/api-reference/directives/use-cache
- https://nextjs.org/docs/app/api-reference/functions/updateTag

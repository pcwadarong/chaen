## 📝 작업 내용

> 이번 PR에서 작업한 내용을 설명해주세요 (이미지 첨부 가능)

1. cache 관련 테스트명이 실제 검증 범위를 벗어나지 않도록 정리하고 Supabase server test의 mock 초기화를 보강했습니다.
2. article/project entity 조회 로직에서 빈 태그 집계 조기 반환, 프로젝트 schema missing 오분류 방지, article list item 레이아웃 정리를 반영했습니다.
3. guestbook server action에서 URL 정규화, nullable cursor 허용, 내부 에러 메시지 비노출 처리를 추가하고 테스트를 확장했습니다.
4. guestbook와 article comment server action이 locale 기반 번역 메시지를 직접 반환하도록 확장하고, 클라이언트 폼/조회 액션에서 locale 전달 경로를 추가했습니다.

<br/>

## 🚨 주요 고민 및 해결 과정

> 주요 고민이나 문제 해결 과정 공유

### 문제

- review finding 중 일부는 실제 버그이고 일부는 테스트 서술 문제여서 현재 코드 기준으로 다시 분류가 필요했습니다.
- guestbook action은 business error와 내부 인프라 오류가 같은 경로로 흘러 사용자에게 raw message를 노출하고 있었습니다.
- 프로젝트 상세 목록은 DB 권한 오류도 schema missing처럼 취급할 여지가 있었습니다.
- progressive enhancement를 유지한 채 server action 실패 메시지를 locale별로 내려주려면, 클라이언트 폼과 JS 직접 호출 경로 모두에서 locale을 일관되게 전달해야 했습니다.

### 해결 과정

- 테스트는 실제 검증 범위에 맞게 이름을 좁히고, observable behavior를 보장해야 하는 케이스만 별도 테스트로 추가했습니다.
- guestbook action에 사용자 메시지 매퍼를 두어 알려진 비즈니스 에러만 노출하고 나머지는 고정 fallback으로 숨겼습니다.
- schema missing 판정은 PostgreSQL relation missing 신호(`42P01`, `does not exist`)가 있는 경우로만 제한했습니다.
- server action 전용 locale resolver와 번역 helper를 추가하고, guestbook/comment 작성·수정·삭제·조회 액션이 locale별 메시지를 반환하도록 연결했습니다.

<br/>

## 📑 참고 문서/ ADR

> 참고한 외부 문서, 레퍼런스, 기술 블로그, 공식 문서 등의 링크

- https://www.postgresql.org/docs/current/errcodes-appendix.html
- https://zod.dev/

## 📝 작업 내용

1. 다국어 SEO 공통 인프라를 추가하고 앱 기본 locale(`ko`)과 SEO 기준 locale(`en`)을 분리한다.
2. 절대 URL, canonical, hreflang, JSON-LD, robots, sitemap 생성을 위한 공용 유틸과 엔트리를 추가한다.
3. 이후 커밋 단위에서 아티클/프로젝트/태그/OG/pagination/related posts까지 순차적으로 연결한다.

<br/>

## 🚨 주요 고민 및 해결 과정

### 문제

- 앱 기본 locale은 `ko`가 맞지만, canonical과 `x-default`는 `en` 중심으로 계산해야 한다.
- 메타데이터, sitemap, 구조화 데이터, OG, pagination SEO가 페이지 계층에 아직 연결되지 않았다.
- Supabase 번역 fallback 구조가 이미 존재하므로, 실제 번역 존재 여부와 SEO canonical 정책을 분리해서 설계해야 한다.

### 해결 과정

- 먼저 route/middleware/absolute URL/robots/sitemap/JSON-LD 공통층을 추가하고, 앱 locale 기본값과 SEO locale 기준값을 분리한다.
- canonical/hreflang 계산은 공통 helper로 추출해 라우트별 `generateMetadata()`에서 재사용 가능하게 설계한다.
- sitemap은 locale별 URL을 전부 생성하되, 실제 컨텐츠 존재 여부는 Supabase translation 테이블 기준으로 판단하는 방향으로 구성한다.

<br/>

## 📑 참고 문서/ ADR

## 📝 작업 내용

1. 다국어 SEO 공통 인프라를 추가하고 앱 기본 locale(`ko`)과 SEO 기준 locale(`en`)을 분리한다.
2. 절대 URL, canonical, hreflang, JSON-LD, robots, sitemap 생성을 위한 공용 유틸과 엔트리를 추가한다.
   수동 XML 파일 대신 Next.js Dynamic Sitemap API와 Supabase 데이터를 연동하는 방식으로 구성한다.
3. 아티클/프로젝트 상세 `generateMetadata()`를 추가하고 fallback 결과 기반 canonical 판단으로 정리한다.
4. 아티클/프로젝트 상세 본문에 JSON-LD(`BlogPosting`, `CreativeWork`, `BreadcrumbList`)를 주입한다.
5. 아티클/프로젝트 상세 메타데이터에 placeholder 기반 OG 이미지 URL을 연결하고 `/api/og/[type]/[id]` 엔드포인트를 추가한다.

<br/>

## 🚨 주요 고민 및 해결 과정

### 문제

- 앱 기본 locale은 `ko`가 맞지만, canonical과 `x-default`는 `en` 중심으로 계산해야 한다.
- 메타데이터, sitemap, 구조화 데이터, OG, pagination SEO가 페이지 계층에 아직 연결되지 않았다.
- sitemap/robots는 수동 XML/설정 파일이 아니라 App Router 코드 레벨에서 관리하는 편이 현재 스택에 더 적합하다.
- Supabase 번역 fallback 구조가 이미 존재하므로, 실제 번역 존재 여부와 SEO canonical 정책을 분리해서 설계해야 한다.

### 해결 과정

- 먼저 route/middleware/absolute URL/robots/sitemap/JSON-LD 공통층을 추가하고, 앱 locale 기본값과 SEO locale 기준값을 분리한다.
- canonical/hreflang 계산은 공통 helper로 추출해 라우트별 `generateMetadata()`에서 재사용 가능하게 설계한다.
- sitemap은 수동 XML을 만들지 않고 `src/app/sitemap.ts`에서 Next.js Dynamic Sitemap API로 생성한다.
- 실제 URL 목록은 Supabase translation 테이블을 읽어 locale별 경로를 동적으로 조합한다.

<br/>

## 📑 참고 문서/ ADR

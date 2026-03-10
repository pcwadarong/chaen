## 📝 작업 내용

App Router 구조 위에 "검색엔진이 실제로 읽을 수 있는 다국어 HTML"을 안정적으로 공급하는 SEO 기반을 만드는 데 초점을 맞췄다.

1. locale별 고유 URL 체계를 기준으로 다국어 라우팅을 정리했다.
2. canonical, `hreflang`, `x-default`를 공통 규칙으로 계산하도록 만들었다.
3. 페이지 메타데이터를 상세 페이지 중심에서 홈/이력서/프로젝트 목록 페이지까지 연결했다.
4. sitemap / robots를 코드 레벨에서 생성해 배포 환경에 종속되지 않게 만들었다.
5. JSON-LD와 breadcrumb를 통해 문서 구조를 검색엔진이 이해할 수 있게 했다.
6. 아티클 목록은 crawl 가능한 pagination을 가지도록 바꿨다.
7. 상세 페이지 하단에는 내부 링크 분산을 위한 related articles 영역을 추가했다.
8. 검색 대상 페이지와 제외 페이지를 나누고, 관리자/게스트북 라우트는 색인되지 않도록 route metadata에서 명시적으로 차단했다.

<br/>

## 🎯 이번 SEO 작업의 핵심

### 1. 다국어 URL을 검색엔진 관점에서 정리

`next-intl` 기반 locale 라우팅을 유지하되, 검색엔진이 각 언어를 서로 다른 문서로 인식할 수 있도록 locale prefix URL을 기준 구조로 삼았다.

- `/ko/...`, `/en/...`, `/ja/...`, `/fr/...`가 각각 독립적인 접근 경로를 가진다.
- locale 감지는 middleware에서 처리하되, Supabase 세션 갱신 흐름을 깨지 않도록 함께 동작하게 정리했다.
- 앱 기본 locale은 `ko`로 유지하고, SEO 기본 locale만 `en`으로 분리했다.

이 분리는 UX와 SEO의 목적이 다르기 때문에 필요했다.

- 사용자는 `ko`를 기본 언어로 진입한다.
- 검색엔진 canonical과 `x-default`는 `en`을 기준으로 계산한다.

### 2. 번역 fallback과 canonical 정책을 분리

기존 데이터 조회는 "보여줄 수 있는 번역 하나를 찾는 것"에 가까웠다. 하지만 SEO에서는 "현재 locale에 실제 번역이 존재하는가"가 더 중요하다.

그래서 이번 작업에서는:

- 화면 렌더링은 기존 fallback 체계를 유지한다.
- canonical은 `resolvedLocale`를 기준으로 별도 판단한다.

정책은 다음과 같다.

- 요청 locale에 실제 번역이 있으면 self-canonical
- 요청 locale 번역이 없고 fallback으로 렌더링되면 SEO 기본 locale인 `en`으로 canonical

이 방식으로 duplicate content 가능성을 줄이면서도, 사용자에게는 fallback 콘텐츠를 계속 제공할 수 있게 했다.

### 3. `hreflang` / `x-default`를 페이지별로 통일

검색엔진이 언어별 대응 페이지를 정확히 연결할 수 있도록, locale별 alternate URL과 `x-default`를 공통 helper에서 생성하도록 정리했다.

효과는 다음과 같다.

- 각 상세 페이지가 어떤 locale 문서와 대응되는지 검색엔진이 이해할 수 있다.
- 영어 문서를 전역 `x-default`로 지정해 기본 탐색 지점을 일관되게 제공한다.
- 절대 URL을 사용해 메타데이터가 환경에 따라 흔들리지 않게 했다.

### 4. 메타데이터를 실제 주요 페이지로 연결

이번 범위에서 메타데이터가 연결된 페이지는 다음 성격의 라우트들이다.

- 홈
- 이력서
- 프로젝트 목록
- 아티클 목록
- 아티클 상세
- 프로젝트 상세
- 게스트북
- 관리자 / 관리자 로그인

여기서 중요한 점은 단순히 `<title>`만 추가한 것이 아니라, 페이지 역할에 맞는 메타 구성을 나눴다는 점이다.

- 홈/이력서는 페이지 자체를 소개하는 메타를 사용한다.
- 프로젝트 목록은 프로젝트 아카이브 랜딩 페이지로서 자체 메타를 가진다.
- 아티클/프로젝트 상세는 콘텐츠 제목, 설명, canonical, alternates, OG/Twitter를 함께 생성한다.
- 게스트북과 관리자 라우트는 아예 `noindex,nofollow`를 고정한다.

### 5. sitemap / robots를 App Router 코드로 관리

정적 XML 파일을 수동으로 두는 대신, Next.js Metadata API를 이용해 sitemap과 robots를 코드에서 생성하도록 만들었다.

이 방식의 장점은:

- Supabase 데이터와 실제 URL 구조를 바로 반영할 수 있다.
- locale가 늘거나 데이터가 바뀌어도 sitemap이 자동으로 최신 상태를 유지한다.
- 배포 환경 설정 없이도 코드만으로 robots/sitemap 정책을 추적할 수 있다.

현재 sitemap에는 다음이 포함된다.

- locale별 홈 URL
- locale별 이력서 URL
- locale별 프로젝트 목록 URL
- locale별 아티클 상세 URL
- locale별 프로젝트 상세 URL

### 6. 구조화 데이터(JSON-LD)로 문서 의미를 강화

검색엔진이 단순 텍스트가 아니라 "이 페이지가 무엇인지"를 이해할 수 있도록 상세 페이지에 구조화 데이터를 주입했다.

- 아티클 상세: `BlogPosting`
- 프로젝트 상세: `CreativeWork`
- 공통 breadcrumb: `BreadcrumbList`

이로써 검색엔진은:

- 문서 타입
- 제목/설명/게시 시점
- 페이지 계층 구조

를 HTML 파싱 외의 방식으로도 명확하게 해석할 수 있다.

### 7. 무한 스크롤을 crawl 가능한 pagination으로 보완

아티클 목록은 UX 측면에서 계속 스크롤하는 경험을 유지하되, 검색엔진 입장에서는 페이지 단위로 접근 가능한 구조가 필요했다.

그래서 이번 작업에서:

- 서버가 `?page=`를 해석하도록 만들고
- `rel="prev"` / `rel="next"` metadata를 생성하고
- 페이지 번호 기반 href를 만들 수 있게 정리했다.

즉 사용자 경험은 유지하면서도, 봇은 정적인 페이지 링크를 따라갈 수 있는 구조를 갖게 됐다.

### 8. 내부 링크 분산을 위한 related articles 추가

상세 페이지 하단에는 related articles 영역을 추가했다.

초기에는 vector / FTS 기반 유사도 탐색을 검토했지만, 현재 스키마와 운영 복잡도를 고려하면 과하다고 판단했다. 따라서 최종적으로 공통 태그가 겹치는 글을 우선 노출하고 일치 항목이 없으면 최근 글로 fallback 하는 구조로 정리했다.

- 관련 문서 간 internal linking 증가
- 상세 페이지 체류 흐름 개선
- 고립된 문서 감소

### 9. 관리자 라우트는 검색 결과에서 배제

관리자 페이지와 로그인 페이지는 공개 색인 대상이 아니므로, route metadata에서 `robots.index = false`, `robots.follow = false`를 명시했다.

이는 robots.txt만 믿는 것보다 더 직접적인 페이지 단위 제어다.

### 10. 검색 대상 페이지와 제외 페이지를 분리

이번 작업에서 검색 유입을 노리는 페이지와 그렇지 않은 페이지를 분리했다.

검색 대상으로 유지하는 페이지:

- 홈
- 이력서
- 프로젝트 목록
- 아티클 목록
- 아티클 상세
- 프로젝트 상세

검색 대상으로 보지 않는 페이지:

- 게스트북
- 관리자 페이지
- 관리자 로그인

이 결정에 맞춰 sitemap, route metadata, robots 정책이 서로 충돌하지 않도록 정리했다.

<br/>

## 🚨 판단 근거

### 왜 `ko` 기본 locale과 `en` SEO locale을 분리했는가

서비스 사용자는 한국어 진입이 자연스럽지만, 다국어 문서 간 canonical 기준을 잡을 때는 하나의 기준 locale이 필요하다.

현재는:

- UX 기본값: `ko`
- SEO 기준값: `en`

으로 나눠 두었고, 이 구조 덕분에 locale fallback과 검색엔진 중복 제어를 동시에 만족시킬 수 있다.

### 왜 tag 전용 페이지를 빼고 현재 구조를 유지했는가

초기 구상에서는 `/[locale]/tag/[slug]` 형태의 topic cluster 페이지를 둘 수 있었지만, 현재 제품 UX에서는 아티클 목록 내부 태그 필터가 이미 자연스럽게 동작하고 있다.

그래서 현 단계에서는:

- 태그 필터 UX는 유지
- 별도 tag archive route는 보류

로 정리했다.

즉, 지금은 "검색엔진용 별도 랜딩"보다 "현재 UX를 해치지 않는 명확한 SEO 기반"을 우선했다.

### 왜 related articles를 vector가 아니라 태그 기반으로 정리했는가

현재 스키마에는 실사용 가능한 vector embedding 컬럼이 없고, `fts_vector`만으로 semantic recommendation까지 풀려고 하면 구현과 운영이 과해진다.

그래서 이번엔:

- 현재 데이터에서 안정적으로 동작할 것
- SQL/RPC 의존성을 불필요하게 늘리지 않을 것
- 실제 internal linking 효과를 얻을 수 있을 것

을 기준으로 단순한 태그 기반 매칭을 채택했다.

<br/>

## ✅ 현재 기준 완료된 범위

OG 이미지를 실제 `next/og` 생성으로 바꾸는 일은 제외하면, 이번 작업으로 이미 갖춰진 SEO 기반은 다음과 같다.

- 다국어 locale URL 체계
- canonical / `hreflang` / `x-default`
- 절대 URL 기반 metadata 생성
- 동적 sitemap / robots
- 아티클/프로젝트 상세 JSON-LD + breadcrumb
- 아티클 목록 crawlable pagination
- 프로젝트 목록 metadata + placeholder OG
- 홈/이력서 placeholder OG metadata
- 이력서/프로젝트 목록 sitemap 포함
- 게스트북 noindex / nofollow
- 관리자 noindex / nofollow
- related articles 기반 internal linking

<br/>

## 🔍 추가 검토 포인트

### 1. robots.txt의 locale prefix 경로 정책

기존 robots 설정은 `/admin/` 중심이었기 때문에 locale prefix가 붙는 `/ko/admin`, `/en/admin` 같은 실제 경로를 더 명시적으로 다루는 편이 안전했다.

이번 작업에서는 locale별 admin/login/callback 경로를 disallow 목록에 추가해 정책을 보강했다.

### 2. 프로젝트 목록의 렌더링 전략

프로젝트 목록은 SEO 메타데이터를 갖추게 됐지만, 현재 페이지 자체는 포트폴리오 signed URL을 함께 조합하기 때문에 여전히 `force-dynamic`이다.

즉 검색엔진이 읽을 메타는 갖췄지만, 장기적으로는 다음을 다시 볼 수 있다.

- signed URL과 페이지 HTML 생성을 분리할지
- ISR 또는 더 정적인 전달 방식으로 옮길지

### 3. tag archive / topic cluster 전략

이건 버그라기보다 의도적으로 보류한 콘텐츠 전략이다.

현재는 아티클 목록 내부 태그 필터만 유지하고 있으며, 검색엔진용 tag archive route는 넣지 않았다.

향후 필요 조건은 다음과 같다.

- 태그별 검색 유입을 실제로 노릴 때
- 태그별 고유 설명/H1/메타를 운영할 때
- topic cluster 랜딩을 별도로 관리할 때
  <br/>

## 📌 정리

현재 기준으로 실제로 남은 핵심 구현은:

- 실제 브랜드 OG 이미지 생성
- 프로젝트 목록의 정적화 가능성 재검토
- tag archive / topic cluster 재도입 여부 판단

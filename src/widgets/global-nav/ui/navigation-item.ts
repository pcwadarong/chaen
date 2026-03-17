/** 전역 내비게이션에서 허용하는 정적 라우트 목록입니다. */
export type GlobalNavHref = '/' | '/resume' | '/project' | '/articles' | '/guest' | '/admin';

/** 전역 내비게이션 링크 한 건의 표현 모델입니다. */
export type GlobalNavItem = {
  href: GlobalNavHref;
  label: string;
};

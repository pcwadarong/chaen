export type ArticleItem = {
  id: string;
  title: string;
  description: string;
  tags: string[];
};

export const articleItems: ArticleItem[] = [
  {
    id: 'typography-rhythm',
    title: 'Typography rhythm across Korean and Japanese copy',
    description:
      '다국어 환경에서 행간과 폰트 선택이 레이아웃 밀도에 미치는 영향을 정리한 글입니다.',
    tags: ['typography', 'i18n', 'design-system'],
  },
  {
    id: 'svgr-turbopack',
    title: 'Running SVGR consistently in Webpack and Turbopack',
    description: '개발/빌드 환경이 달라도 같은 SVG import 경험을 유지하는 설정 메모입니다.',
    tags: ['nextjs', 'svg', 'build-tooling'],
  },
  {
    id: 'supabase-ssr-boundary',
    title: 'Mapping Supabase SSR boundaries before feature work',
    description: '클라이언트, 서버, 미들웨어 책임을 어떻게 나눌지 먼저 정리한 구조 문서입니다.',
    tags: ['supabase', 'ssr', 'architecture'],
  },
];

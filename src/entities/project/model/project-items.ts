export type ProjectItem = {
  id: string;
  category: string;
  headline: string;
  summary: string;
  year: string;
  deliverables: string[];
};

export const projectItems: ProjectItem[] = [
  {
    id: 'motion-library',
    category: 'Design Engineering',
    headline: 'Motion-first component library',
    summary:
      '브랜드 인터랙션을 컴포넌트 단위에서 재사용할 수 있도록 모션 토큰과 UI 규칙을 정리한 프로젝트입니다.',
    year: '2026',
    deliverables: ['Motion tokens', 'Interaction spec', 'Storybook foundation'],
  },
  {
    id: 'supabase-editorial',
    category: 'Fullstack',
    headline: 'Editorial platform with Supabase',
    summary:
      '콘텐츠 작성과 퍼블리싱 흐름을 Supabase 기반으로 설계하고 App Router에 맞게 SSR 경계를 정리한 프로젝트입니다.',
    year: '2025',
    deliverables: ['Auth flow', 'Storage strategy', 'Publishing dashboard'],
  },
  {
    id: 'guest-campaign',
    category: 'Growth',
    headline: 'Guest onboarding campaign site',
    summary:
      '광고 유입 사용자를 제품 경험으로 자연스럽게 연결하기 위한 랜딩 경험과 전환 흐름을 설계한 프로젝트입니다.',
    year: '2024',
    deliverables: ['Landing narrative', 'CTA experiment', 'Analytics hooks'],
  },
];

export const findProjectItem = (id: string) => projectItems.find(project => project.id === id);

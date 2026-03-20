export type TechStackCategory = 'frontend' | 'backend' | 'infra' | 'collaboration';

export type TechStack = {
  category: TechStackCategory;
  id: string;
  name: string;
  slug: string;
};

export const TECH_STACK_CATEGORY_ORDER: TechStackCategory[] = [
  'frontend',
  'backend',
  'infra',
  'collaboration',
];

export const TECH_STACK_CATEGORY_LABEL: Record<TechStackCategory, string> = {
  backend: '백엔드',
  collaboration: '협업',
  frontend: '프론트',
  infra: '인프라',
};

/**
 * 프로젝트에서 사용하는 기술 스택의 분류 집합입니다.
 * UI 정렬과 번역 라벨 매핑의 기준 키로 사용합니다.
 */
export type TechStackCategory = 'frontend' | 'backend' | 'infra' | 'collaboration';

/**
 * 기술 스택 풀과 프로젝트 relation에서 공통으로 사용하는 기술 스택 모델입니다.
 *
 * @property category 기술 스택이 속한 분류 키입니다.
 * @property id 기술 스택 row를 식별하는 UUID 또는 고유 문자열입니다.
 * @property name 화면에 표시할 공식 기술 이름입니다.
 * @property slug relation 저장과 조회에 사용하는 안정적인 식별자입니다.
 */
export type TechStack = {
  category: TechStackCategory;
  id: string;
  name: string;
  slug: string;
};

/**
 * 기술 스택을 화면에 묶어 보여줄 때 사용하는 카테고리 우선순위입니다.
 */
export const TECH_STACK_CATEGORY_ORDER: TechStackCategory[] = [
  'frontend',
  'backend',
  'infra',
  'collaboration',
];

/**
 * 카테고리 키를 next-intl 번역 키로 연결하는 매핑입니다.
 */
export const TECH_STACK_CATEGORY_LABEL: Record<
  TechStackCategory,
  `TechStack.category.${TechStackCategory}`
> = {
  backend: 'TechStack.category.backend',
  collaboration: 'TechStack.category.collaboration',
  frontend: 'TechStack.category.frontend',
  infra: 'TechStack.category.infra',
};

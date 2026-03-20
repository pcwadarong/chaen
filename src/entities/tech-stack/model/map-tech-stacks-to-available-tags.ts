import type { TechStack } from '@/entities/tech-stack/model/types';

/**
 * 기술 스택 풀을 공용 TagSelector 입력 shape로 변환합니다.
 */
export const mapTechStacksToAvailableTags = (techStacks: TechStack[]) =>
  techStacks.map(techStack => ({
    group: techStack.category,
    id: techStack.id,
    label: techStack.name,
    slug: techStack.slug,
  }));

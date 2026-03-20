import type { Project } from '@/entities/project/model/types';
import {
  TECH_STACK_CATEGORY_LABEL,
  TECH_STACK_CATEGORY_ORDER,
  type TechStack,
  type TechStackCategory,
} from '@/entities/tech-stack/model/types';
import {
  formatProjectPeriod,
  type ProjectPeriodSource,
} from '@/shared/lib/date/format-project-period';

type ProjectDisplayMetaSource = ProjectPeriodSource & Pick<Project, 'tech_stacks'>;

export type ProjectTechStackGroup = {
  category: TechStackCategory;
  items: TechStack[];
  label: string;
};

export type ProjectDisplayMeta = {
  periodText: string;
  techStackGroups: ProjectTechStackGroup[];
};

type ProjectDisplayMetaInput = {
  categoryLabels?: Record<TechStackCategory, string>;
  item: ProjectDisplayMetaSource;
  locale: string;
  ongoingLabel: string;
};

/**
 * 프로젝트 카드와 상세에서 공통으로 쓰는 표시용 메타 데이터를 계산합니다.
 */
export const getProjectDisplayMeta = ({
  categoryLabels,
  item,
  locale,
  ongoingLabel,
}: ProjectDisplayMetaInput): ProjectDisplayMeta => {
  const techStacks = item.tech_stacks ?? [];
  const techStackGroups = TECH_STACK_CATEGORY_ORDER.map(category => ({
    category,
    items: techStacks.filter(techStack => techStack.category === category),
    label: categoryLabels?.[category] ?? TECH_STACK_CATEGORY_LABEL[category],
  })).filter(group => group.items.length > 0);

  return {
    periodText: formatProjectPeriod(item, locale, ongoingLabel),
    techStackGroups,
  };
};

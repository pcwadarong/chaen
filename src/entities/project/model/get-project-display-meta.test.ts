import { getProjectDisplayMeta } from '@/entities/project/model/get-project-display-meta';

describe('getProjectDisplayMeta', () => {
  it('기간 문자열과 기술 스택 그룹을 카드/상세 공용 형태로 계산한다', () => {
    const result = getProjectDisplayMeta({
      categoryLabels: {
        backend: 'Backend',
        collaboration: 'Collaboration',
        frontend: 'Frontend',
        infra: 'Infra',
      },
      item: {
        created_at: '2025-12-01T00:00:00.000Z',
        period_end: '2026-02-01T00:00:00.000Z',
        period_start: '2025-12-01T00:00:00.000Z',
        tech_stacks: [
          { category: 'backend', id: '2', name: 'NestJS', slug: 'nestjs' },
          { category: 'frontend', id: '1', name: 'React', slug: 'react' },
        ],
      },
      locale: 'ko',
      ongoingLabel: '진행 중',
    });

    expect(result.periodText).toBe('2025년 12월 - 2026년 2월');
    expect(result.techStackGroups).toEqual([
      {
        category: 'frontend',
        items: [{ category: 'frontend', id: '1', name: 'React', slug: 'react' }],
        label: 'Frontend',
      },
      {
        category: 'backend',
        items: [{ category: 'backend', id: '2', name: 'NestJS', slug: 'nestjs' }],
        label: 'Backend',
      },
    ]);
  });
});

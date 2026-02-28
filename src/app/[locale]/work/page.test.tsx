import { isValidElement } from 'react';
import { vi } from 'vitest';

import { projectItems } from '@/entities/project/model/project-items';

import WorkRoute from './page';

vi.mock('@/views/work-list', () => ({
  WorkListPage: function WorkListPage() {
    return null;
  },
}));

describe('WorkRoute', () => {
  it('프로젝트 목록 뷰 엔트리와 프로젝트 배열을 반환한다', () => {
    const element = WorkRoute();

    expect(isValidElement(element)).toBe(true);
    expect(element.type.name).toBe('WorkListPage');
    expect(element.props.items).toBe(projectItems);
  });
});

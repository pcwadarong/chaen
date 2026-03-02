import { isValidElement } from 'react';
import { vi } from 'vitest';

import { getProjects } from '@/entities/project/api/get-projects';

import HomeRoute from './page';

vi.mock('@/entities/project/api/get-projects', () => ({
  getProjects: vi.fn(async () => []),
}));

vi.mock('@/views/home', () => ({
  HomePage: function HomePage() {
    return null;
  },
}));

describe('HomeRoute', () => {
  it('홈 뷰 엔트리와 프로젝트 미리보기 데이터를 반환한다', async () => {
    const element = await HomeRoute();

    expect(isValidElement(element)).toBe(true);
    expect(element.type.name).toBe('HomePage');
    expect(getProjects).toHaveBeenCalledTimes(1);
    expect(element.props.items).toEqual([]);
  });
});

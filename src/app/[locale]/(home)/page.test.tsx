import { isValidElement } from 'react';
import { vi } from 'vitest';

import { getHomePageData } from '@/views/home';

import HomeRoute from './page';

vi.mock('@/views/home', () => ({
  getHomePageData: vi.fn(async () => ({
    items: [],
  })),
  HomePage: function HomePage() {
    return null;
  },
}));

describe('HomeRoute', () => {
  it('홈 뷰 엔트리와 프로젝트 미리보기 데이터를 반환한다', async () => {
    const element = await HomeRoute({
      params: Promise.resolve({
        locale: 'ko',
      }),
    });

    expect(isValidElement(element)).toBe(true);
    expect(element.type.name).toBe('HomePage');
    expect(getHomePageData).toHaveBeenCalledWith({ locale: 'ko' });
    expect(element.props.items).toEqual([]);
  });
});

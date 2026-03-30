/* @vitest-environment node */

import type { ProjectListItem } from '@/entities/project/model/types';
import { getMonitorOverlayScreenData } from '@/features/monitor-overlay/model/get-monitor-overlay-screen-data';

/**
 * `getMonitorOverlayScreenData` 순수 함수 테스트에 사용할 기본 프로젝트 fixture를 생성합니다.
 *
 * `overrides`에 `Partial<ProjectListItem>`를 넘기면 기본 샘플 값을 같은 키로 덮어씁니다.
 * 예: `createItem({ title: 'Only One' })`
 *
 * @param overrides - 기본 프로젝트 필드를 부분적으로 덮어쓸 값입니다.
 * @returns monitor overlay 계산에 바로 사용할 `ProjectListItem` fixture를 반환합니다.
 */
const createItem = (overrides?: Partial<ProjectListItem>): ProjectListItem => ({
  description: '설명',
  id: 'project-1',
  period_end: null,
  period_start: '2025-01-01',
  publish_at: '2025-02-01',
  slug: 'project-1',
  thumbnail_url: 'https://example.com/thumb.png?download=1',
  title: 'Over the Rainbow',
  ...overrides,
});

describe('getMonitorOverlayScreenData', () => {
  it('프로젝트가 있을 때 overlay screen data는 항상 3개 카드를 반환해야 한다', () => {
    const screenData = getMonitorOverlayScreenData({
      items: [
        createItem({ id: '1', title: 'One', description: 'first' }),
        createItem({ id: '2', title: 'Two', description: 'second' }),
        createItem({ id: '3', title: 'Three', description: 'third' }),
        createItem({ id: '4', title: 'Four', description: 'fourth' }),
      ],
      locale: 'en',
      ongoingLabel: 'Ongoing',
    });

    expect(screenData.projects).toHaveLength(3);
    expect(screenData.projects.map(p => p.title)).toEqual(['One', 'Two', 'Three']);
    expect(screenData.projects[0].description).toBe('first');
    expect(screenData.projects[0].thumbnailSrc).toBe('https://example.com/thumb.png');
    expect(screenData.projects[0].periodLabel).toBe('January 2025 - Ongoing');
  });

  it('프로젝트가 없을 때 overlay screen data는 기본 문구로 채운 3개 카드를 반환해야 한다', () => {
    const screenData = getMonitorOverlayScreenData({
      items: [],
      locale: 'en',
      ongoingLabel: 'Ongoing',
    });

    expect(screenData.projects).toHaveLength(3);
    expect(screenData.projects.every(p => p.title === 'No project')).toBe(true);
    expect(screenData.projects.every(p => p.periodLabel === 'Ongoing')).toBe(true);
    expect(screenData.projects.every(p => p.thumbnailSrc === null)).toBe(true);
  });

  it('프로젝트가 1개뿐일 때 나머지는 기본값으로 채워야 한다', () => {
    const screenData = getMonitorOverlayScreenData({
      items: [createItem({ title: 'Only One' })],
      locale: 'en',
      ongoingLabel: 'Ongoing',
    });

    expect(screenData.projects).toHaveLength(3);
    expect(screenData.projects[0].title).toBe('Only One');
    expect(screenData.projects[1].title).toBe('No project');
    expect(screenData.projects[2].title).toBe('No project');
  });
});

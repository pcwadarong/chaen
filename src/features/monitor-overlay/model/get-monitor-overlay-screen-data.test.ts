import type { ProjectListItem } from '@/entities/project/model/types';
import { getMonitorOverlayScreenData } from '@/features/monitor-overlay/model/get-monitor-overlay-screen-data';

const createItem = (overrides?: Partial<ProjectListItem>): ProjectListItem => ({
  description: '설명',
  id: 'project-1',
  period_end: null,
  period_start: '2025-01-01',
  publish_at: '2025-02-01',
  slug: 'project-1',
  tech_stacks: [
    {
      category: 'frontend',
      id: 'react',
      name: 'React',
      slug: 'react',
    },
  ],
  thumbnail_url: 'https://example.com/thumb.png?download=1',
  title: 'Over the Rainbow',
  ...overrides,
});

describe('getMonitorOverlayScreenData', () => {
  it('프로젝트가 있을 때 overlay screen data는 최대 3개 제목과 대표 프로젝트 정보를 반환해야 한다', () => {
    const screenData = getMonitorOverlayScreenData({
      items: [
        createItem({ id: '1', title: 'One', description: 'first' }),
        createItem({ id: '2', title: 'Two', description: 'second' }),
        createItem({ id: '3', title: 'Three', description: 'third' }),
        createItem({ id: '4', title: 'Four', description: 'fourth' }),
      ],
      locale: 'en',
      ongoingLabel: 'Ongoing',
      title: 'Selected Projects',
    });

    expect(screenData.overlayTitle).toBe('Selected Projects');
    expect(screenData.primaryProject.title).toBe('One');
    expect(screenData.primaryProject.description).toBe('first');
    expect(screenData.primaryProject.thumbnailSrc).toBe('https://example.com/thumb.png');
    expect(screenData.primaryProject.techStackNames).toEqual(['React']);
    expect(screenData.secondaryProjects.map(item => item.title)).toEqual(['Two', 'Three']);
    expect(screenData.projectCountLabel).toBe('3 projects');
  });

  it('프로젝트가 없을 때 overlay screen data는 기본 문구를 반환해야 한다', () => {
    const screenData = getMonitorOverlayScreenData({
      items: [],
      locale: 'en',
      ongoingLabel: 'Ongoing',
      title: '',
    });

    expect(screenData.overlayTitle).toBe('Project Archive');
    expect(screenData.primaryProject.title).toBe('No project selected');
    expect(screenData.primaryProject.description).toBe('Overlay texture mount is active.');
    expect(screenData.secondaryProjects).toEqual([]);
    expect(screenData.projectCountLabel).toBe('0 projects');
  });
});

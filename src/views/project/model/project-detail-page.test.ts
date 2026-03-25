// @vitest-environment node

import { resolveProjectExternalLinkItems } from '@/views/project/model/project-detail-page';

describe('project-detail-page helpers', () => {
  it('프로젝트 외부 링크 라벨은 locale과 무관하게 영문으로 만든다', () => {
    expect(
      resolveProjectExternalLinkItems({
        githubUrl: 'https://github.com/example/project-1',
        websiteUrl: 'https://project-1.example.com',
      }),
    ).toEqual([
      {
        href: 'https://project-1.example.com/',
        key: 'website',
        label: 'Website',
      },
      {
        href: 'https://github.com/example/project-1',
        key: 'github',
        label: 'GitHub',
      },
    ]);
  });

  it('http/https가 아닌 project 외부 링크는 제외한다', () => {
    expect(
      resolveProjectExternalLinkItems({
        githubUrl: 'javascript:alert(1)',
        websiteUrl: 'ftp://project-1.example.com',
      }),
    ).toEqual([]);
  });
});

import { findProjectItem, projectItems } from './project-items';

describe('projectItems', () => {
  it('id로 프로젝트를 찾는다', () => {
    expect(findProjectItem('motion-library')).toEqual(projectItems[0]);
  });

  it('알 수 없는 id에는 undefined를 반환한다', () => {
    expect(findProjectItem('unknown-project')).toBeUndefined();
  });
});

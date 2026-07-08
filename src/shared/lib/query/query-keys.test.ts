// @vitest-environment node

import {
  articleComments,
  articles,
  detailArchive,
  editor,
  og,
  pdf,
  projects,
  tags,
} from '@/shared/lib/query/query-keys';

describe('articles 쿼리 키', () => {
  it('동일한 locale/검색어/태그 조합이면 호출마다 동일한 키를 반환한다', () => {
    const first = articles.feed({ locale: 'ko', q: 'react', tag: 'frontend' });
    const second = articles.feed({ locale: 'ko', q: 'react', tag: 'frontend' });

    expect(first).toEqual(second);
  });

  it('검색어 앞뒤 공백만 다르면 정규화되어 동일한 키를 반환한다', () => {
    const withoutSpaces = articles.feed({ locale: 'ko', q: 'react', tag: null });
    const withSpaces = articles.feed({ locale: 'ko', q: '  react  ', tag: null });

    expect(withSpaces).toEqual(withoutSpaces);
  });

  it('태그 대소문자·공백만 다르면 정규화되어 동일한 키를 반환한다', () => {
    const lowerCaseTag = articles.feed({ locale: 'ko', q: null, tag: 'frontend' });
    const mixedCaseTag = articles.feed({ locale: 'ko', q: null, tag: '  FrontEnd  ' });

    expect(mixedCaseTag).toEqual(lowerCaseTag);
  });

  it('검색어가 있으면 get-articles.ts와 동일하게 태그를 무시해 태그 값과 무관하게 동일한 키를 반환한다', () => {
    const withTagA = articles.feed({ locale: 'en', q: 'hello', tag: 'tag-a' });
    const withTagB = articles.feed({ locale: 'en', q: 'hello', tag: 'tag-b' });

    expect(withTagA).toEqual(['articles', 'feed', { locale: 'en', q: 'hello', tag: '' }]);
    expect(withTagA).toEqual(withTagB);
  });

  it('locale이 다르면 서로 다른 키를 반환한다', () => {
    const koKey = articles.feed({ locale: 'ko', q: null, tag: null });
    const enKey = articles.feed({ locale: 'en', q: null, tag: null });

    expect(koKey).not.toEqual(enKey);
  });

  it('popularTags 키는 articles 네임스페이스 접두사를 포함한다', () => {
    expect(articles.popularTags('ko')).toEqual(['articles', 'popularTags', 'ko']);
  });
});

describe('articleComments 쿼리 키', () => {
  it('page 키는 scope 키를 접두사로 포함해 scope로 무효화하면 모든 페이지가 함께 걸린다', () => {
    const scopeKey = articleComments.scope('article-1');
    const pageKey = articleComments.page('article-1', 'latest', 2);

    expect(pageKey.slice(0, scopeKey.length)).toEqual(scopeKey);
  });

  it('articleId가 다르면 scope 키가 달라 서로 다른 글의 댓글 캐시가 섞이지 않는다', () => {
    const scopeA = articleComments.scope('article-a');
    const scopeB = articleComments.scope('article-b');

    expect(scopeA).not.toEqual(scopeB);
  });

  it('정렬 또는 페이지가 다르면 서로 다른 키를 반환한다', () => {
    const latestPage1 = articleComments.page('article-1', 'latest', 1);
    const oldestPage1 = articleComments.page('article-1', 'oldest', 1);
    const latestPage2 = articleComments.page('article-1', 'latest', 2);

    expect(latestPage1).not.toEqual(oldestPage1);
    expect(latestPage1).not.toEqual(latestPage2);
  });
});

describe('projects 쿼리 키', () => {
  it('feed와 preview는 서로 다른 하위 키를 가진다', () => {
    expect(projects.feed('ko')).toEqual(['projects', 'feed', 'ko']);
    expect(projects.preview('ko', 3)).toEqual(['projects', 'preview', 'ko', 3]);
  });

  it('limit이 다르면 preview 키가 달라진다', () => {
    expect(projects.preview('ko', 3)).not.toEqual(projects.preview('ko', 5));
  });
});

describe('tags 쿼리 키', () => {
  it('locale별로 서로 다른 키를 반환한다', () => {
    expect(tags.all('ko')).not.toEqual(tags.all('en'));
  });
});

describe('pdf 쿼리 키', () => {
  it('options 키는 all 접두사를 포함해 업로드 후 prefix invalidate가 가능하다', () => {
    const optionsKey = pdf.options('resume', 'resume-page');

    expect(optionsKey.slice(0, pdf.all.length)).toEqual(pdf.all);
  });

  it('kind 또는 source가 다르면 서로 다른 options 키를 반환한다', () => {
    const resumeOnResumePage = pdf.options('resume', 'resume-page');
    const portfolioOnResumePage = pdf.options('portfolio', 'resume-page');
    const resumeOnProjectPage = pdf.options('resume', 'project-page');

    expect(resumeOnResumePage).not.toEqual(portfolioOnResumePage);
    expect(resumeOnResumePage).not.toEqual(resumeOnProjectPage);
  });

  it('adminAvailability는 파라미터 없이 고정된 키를 갖는다', () => {
    expect(pdf.adminAvailability).toEqual(['pdf', 'adminAvailability']);
  });
});

describe('detailArchive 쿼리 키', () => {
  it('domain이 다르면 서로 다른 키를 반환해 글/프로젝트 아카이브 캐시가 섞이지 않는다', () => {
    const articleFeed = detailArchive.feed('article', 'ko', null);
    const projectFeed = detailArchive.feed('project', 'ko', null);

    expect(articleFeed).not.toEqual(projectFeed);
  });

  it('seedKey가 null이든 커서 문자열이든 그대로 키에 반영된다', () => {
    expect(detailArchive.feed('article', 'ko', null)).toEqual([
      'detailArchive',
      'feed',
      'article',
      'ko',
      null,
    ]);
    expect(detailArchive.feed('article', 'ko', 'cursor-1')).toEqual([
      'detailArchive',
      'feed',
      'article',
      'ko',
      'cursor-1',
    ]);
  });
});

describe('og 쿼리 키', () => {
  it('url이 다르면 서로 다른 키를 반환한다', () => {
    expect(og.preview('https://a.example.com')).not.toEqual(og.preview('https://b.example.com'));
  });
});

describe('editor 쿼리 키', () => {
  it('excludeId를 생략하면 null을 넣은 것과 동일한 키를 반환한다', () => {
    const withoutExcludeId = editor.slugCheck('article', 'my-slug');
    const withNullExcludeId = editor.slugCheck('article', 'my-slug', null);

    expect(withoutExcludeId).toEqual(withNullExcludeId);
  });

  it('type/slug/excludeId 중 하나라도 다르면 서로 다른 키를 반환한다', () => {
    const articleSlug = editor.slugCheck('article', 'my-slug');
    const projectSlug = editor.slugCheck('project', 'my-slug');
    const editingExisting = editor.slugCheck('article', 'my-slug', 'content-id-1');

    expect(articleSlug).not.toEqual(projectSlug);
    expect(articleSlug).not.toEqual(editingExisting);
  });
});

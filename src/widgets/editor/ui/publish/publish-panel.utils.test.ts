import {
  buildPublishSettings,
  createDefaultPublishSettings,
  shouldShowPublishCommentsSetting,
  toScheduledPublishUtcIso,
  validatePublishSettings,
} from '@/widgets/editor/ui/publish/publish-panel.utils';

describe('publish-panel utils', () => {
  it('로컬 날짜와 시간을 UTC ISO 문자열로 변환한다', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-13T00:00:00+09:00'));

    expect(toScheduledPublishUtcIso('2026-03-20', '10:00')).toBe('2026-03-20T01:00:00.000Z');

    vi.useRealTimers();
  });

  it('예약 발행이 아니면 publishAt을 null로 정리한다', () => {
    expect(
      buildPublishSettings({
        allowComments: true,
        dateInput: '2026-03-20',
        githubUrl: ' https://github.com/example/repo ',
        publishMode: 'immediate',
        slug: 'demo-post',
        thumbnailUrl: ' https://example.com/thumb.png ',
        timeInput: '10:00',
        visibility: 'public',
        websiteUrl: ' https://example.com ',
      }),
    ).toEqual({
      allowComments: true,
      githubUrl: 'https://github.com/example/repo',
      publishAt: null,
      slug: 'demo-post',
      thumbnailUrl: 'https://example.com/thumb.png',
      visibility: 'public',
      websiteUrl: 'https://example.com',
    });
  });

  it('article일 때만 댓글 허용 제어를 노출한다', () => {
    expect(shouldShowPublishCommentsSetting('project')).toBe(false);
    expect(shouldShowPublishCommentsSetting('resume')).toBe(false);
    expect(shouldShowPublishCommentsSetting('article')).toBe(true);
  });

  it('project 기본 발행 설정은 댓글 허용을 false로 고정한다', () => {
    expect(
      createDefaultPublishSettings({
        contentType: 'project',
        initialSettings: {
          allowComments: true,
          githubUrl: '',
          publishAt: null,
          slug: 'demo-post',
          thumbnailUrl: '',
          visibility: 'public',
          websiteUrl: '',
        },
        slug: 'demo-post',
      }),
    ).toEqual({
      allowComments: false,
      githubUrl: '',
      publishAt: null,
      slug: 'demo-post',
      thumbnailUrl: '',
      visibility: 'public',
      websiteUrl: '',
    });
  });

  it('한국어 제목, slug 형식, 링크 URL, 예약 시간 과거 여부를 검증한다', () => {
    const errors = validatePublishSettings({
      editorState: {
        dirty: true,
        slug: '',
        tags: [],
        translations: {
          en: { content: '', description: '', title: '' },
          fr: { content: '', description: '', title: '' },
          ja: { content: '', description: '', title: '' },
          ko: { content: '본문만 있음', description: '', title: '' },
        },
      },
      now: new Date('2026-03-13T00:00:00.000Z'),
      settings: {
        allowComments: true,
        githubUrl: 'github.com/example/repo',
        publishAt: '2026-03-12T23:59:59.000Z',
        slug: '!!!',
        thumbnailUrl: '',
        visibility: 'public',
        websiteUrl: 'example.com',
      },
    });

    expect(errors).toEqual({
      githubUrl: '깃허브 주소는 http:// 또는 https://로 시작해야 합니다.',
      koTitle: '한국어 제목을 입력해주세요',
      publishAt: '발행 시간은 현재 시간 이후여야 합니다',
      slug: '슬러그는 영문 소문자, 숫자, 하이픈만 사용 가능합니다',
      websiteUrl: '웹사이트 주소는 http:// 또는 https://로 시작해야 합니다.',
    });
  });
});

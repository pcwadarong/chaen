import {
  buildPublishSettings,
  toScheduledPublishUtcIso,
  validatePublishSettings,
} from '@/widgets/editor/model/publish-panel.utils';

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
        publishMode: 'immediate',
        slug: 'demo-post',
        thumbnailUrl: ' https://example.com/thumb.png ',
        timeInput: '10:00',
        visibility: 'public',
      }),
    ).toEqual({
      allowComments: true,
      publishAt: null,
      slug: 'demo-post',
      thumbnailUrl: 'https://example.com/thumb.png',
      visibility: 'public',
    });
  });

  it('한국어 제목, slug 형식, 예약 시간 과거 여부를 검증한다', () => {
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
        publishAt: '2026-03-12T23:59:59.000Z',
        slug: 'Bad Slug',
        thumbnailUrl: '',
        visibility: 'public',
      },
    });

    expect(errors).toEqual({
      koTitle: '한국어 제목을 입력해주세요',
      publishAt: '발행 시간은 현재 시간 이후여야 합니다',
      slug: '슬러그는 영문 소문자, 숫자, 하이픈만 사용 가능합니다',
    });
  });
});

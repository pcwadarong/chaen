// @vitest-environment node

import {
  createVideoEmbedMarkdown,
  createYoutubeEmbedMarkdown,
  extractVideoEmbedReference,
  extractYoutubeId,
} from '@/features/edit-markdown/model/video-embed';

describe('video embed helpers', () => {
  it('유효한 YouTube URL이 주어지면, extractVideoEmbedReference는 provider와 video id를 반환해야 한다', () => {
    expect(extractVideoEmbedReference('  https://youtu.be/dQw4w9WgXcQ  ')).toEqual({
      provider: 'youtube',
      videoId: 'dQw4w9WgXcQ',
    });
    expect(extractVideoEmbedReference('https://youtube.com/watch?v=dQw4w9WgXcQ')).toEqual({
      provider: 'youtube',
      videoId: 'dQw4w9WgXcQ',
    });
    expect(
      extractVideoEmbedReference('https://www.youtube.com/shorts/dQw4w9WgXcQ?feature=share'),
    ).toEqual({
      provider: 'youtube',
      videoId: 'dQw4w9WgXcQ',
    });
  });

  it('유효하지 않은 입력이 주어지면, extractVideoEmbedReference는 null을 반환해야 한다', () => {
    expect(extractVideoEmbedReference('')).toBeNull();
    expect(extractVideoEmbedReference('not-a-url')).toBeNull();
    expect(extractVideoEmbedReference('https://notyoutube.com/watch?v=dQw4w9WgXcQ')).toBeNull();
  });

  it('유효한 YouTube URL이 주어지면, extractYoutubeId는 video id만 반환해야 한다', () => {
    expect(extractYoutubeId('https://www.youtube.com/embed/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
  });

  it('provider와 video id가 주어지면, createVideoEmbedMarkdown는 provider 정보를 포함한 Video 문법을 반환해야 한다', () => {
    expect(
      createVideoEmbedMarkdown({
        provider: 'youtube',
        videoId: 'dQw4w9WgXcQ',
      }),
    ).toBe('<Video provider="youtube" id="dQw4w9WgXcQ" />');
  });

  it('유효한 YouTube id가 주어지면, createYoutubeEmbedMarkdown는 YouTube provider를 포함한 Video 문법을 반환해야 한다', () => {
    expect(createYoutubeEmbedMarkdown('abc"def')).toBe(
      '<Video provider="youtube" id="abc&quot;def" />',
    );
  });
});

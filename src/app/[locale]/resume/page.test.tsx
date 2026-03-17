import { isValidElement } from 'react';
import { vi } from 'vitest';

import ResumeRoute, { generateMetadata } from '@/app/[locale]/resume/page';
import { getResumePageData } from '@/views/resume';

vi.mock('@/views/resume', () => ({
  getResumePageData: vi.fn(async () => ({
    content: {
      locale: 'ko',
      title: '안녕하세요 박채원입니다.',
      description: '서버 내용',
      body: '본문',
      download_button_label: '이력서 다운로드',
      download_unavailable_label: '이력서 준비 중',
      updated_at: '2026-03-02T00:00:00.000Z',
    },
    downloadOptions: [
      {
        assetKey: 'resume-ko',
        fileName: '박채원_이력서.pdf',
        href: '/api/pdf/file/resume-ko?source=resume-page',
        locale: 'ko',
      },
      {
        assetKey: 'resume-en',
        fileName: 'ParkChaewon-Resume.pdf',
        href: '/api/pdf/file/resume-en?source=resume-page',
        locale: 'en',
      },
    ],
  })),
  ResumePage: function ResumePage() {
    return null;
  },
}));

describe('ResumeRoute', () => {
  const originalSiteUrl = process.env.NEXT_PUBLIC_SITE_URL;

  beforeEach(() => {
    process.env.NEXT_PUBLIC_SITE_URL = 'https://chaen.dev';
  });

  afterEach(() => {
    process.env.NEXT_PUBLIC_SITE_URL = originalSiteUrl;
  });

  it('이력서 뷰 엔트리와 다운로드 경로를 반환한다', async () => {
    const element = await ResumeRoute({
      params: Promise.resolve({
        locale: 'ko',
      }),
    });

    expect(isValidElement(element)).toBe(true);
    expect(element.type.name).toBe('ResumePage');
    expect(getResumePageData).toHaveBeenCalledWith({ locale: 'ko' });
    expect(element.props.downloadOptions).toHaveLength(2);
    expect(element.props.downloadOptions[0].href).toBe(
      '/api/pdf/file/resume-ko?source=resume-page',
    );
    expect(element.props.content.title).toBe('안녕하세요 박채원입니다.');
  });

  it('이력서 메타데이터에 placeholder OG 이미지와 alternates를 포함한다', async () => {
    await expect(
      generateMetadata({
        params: Promise.resolve({
          locale: 'ko',
        }),
      }),
    ).resolves.toMatchObject({
      alternates: {
        canonical: 'https://chaen.dev/ko/resume',
        languages: {
          'x-default': 'https://chaen.dev/en/resume',
          en: 'https://chaen.dev/en/resume',
          fr: 'https://chaen.dev/fr/resume',
          ja: 'https://chaen.dev/ja/resume',
          ko: 'https://chaen.dev/ko/resume',
        },
      },
      description: '서버 내용',
      openGraph: {
        images: ['https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=1200'],
        url: 'https://chaen.dev/ko/resume',
      },
      title: '안녕하세요 박채원입니다.',
      twitter: {
        images: ['https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=1200'],
      },
    });
  });
});

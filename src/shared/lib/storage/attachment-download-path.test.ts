// @vitest-environment node

import {
  buildAttachmentDownloadPath,
  parseAttachmentStoragePath,
  resolveAttachmentDownloadHref,
} from '@/shared/lib/storage/attachment-download-path';

describe('attachment-download-path', () => {
  const originalSupabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  beforeEach(() => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://demo.supabase.co';
  });

  afterEach(() => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = originalSupabaseUrl;
  });

  it('유효한 article public URL이 주어질 때, parseAttachmentStoragePath는 bucketName과 filePath를 반환해야 한다', () => {
    expect(
      parseAttachmentStoragePath(
        'https://demo.supabase.co/storage/v1/object/public/article/attachments/demo%20resume.pdf',
      ),
    ).toEqual({
      bucketName: 'article',
      filePath: 'demo resume.pdf',
    });
  });

  it('origin이 다르거나 attachments 경로가 아닌 storage URL이 주어질 때, parseAttachmentStoragePath는 null을 반환해야 한다', () => {
    expect(
      parseAttachmentStoragePath(
        'https://other.example.com/storage/v1/object/public/article/attachments/demo.pdf',
      ),
    ).toBeNull();
    expect(
      parseAttachmentStoragePath(
        'https://demo.supabase.co/storage/v1/object/public/unknown/article/attachments/demo.pdf',
      ),
    ).toBeNull();
    expect(
      parseAttachmentStoragePath(
        'https://demo.supabase.co/storage/v1/object/public/file/article/attachments/demo.pdf',
      ),
    ).toBeNull();
    expect(
      parseAttachmentStoragePath(
        'https://demo.supabase.co/storage/v1/object/public/article/images/demo.pdf',
      ),
    ).toBeNull();
  });

  it('유효한 버킷/파일명 정보가 주어지면 buildAttachmentDownloadPath는 내부 다운로드 경로를 반환해야 한다', () => {
    expect(
      buildAttachmentDownloadPath({
        bucketName: 'article',
        fileName: 'resume.pdf',
        filePath: 'demo resume.pdf',
      }),
    ).toBe(
      '/api/attachments/download?bucket=article&fileName=resume.pdf&path=attachments%2Fdemo+resume.pdf',
    );
  });

  it('콘텐츠 버킷 첨부 public URL이 주어지면 resolveAttachmentDownloadHref는 내부 다운로드 route로 변환해야 한다', () => {
    expect(
      resolveAttachmentDownloadHref({
        fileName: 'resume.pdf',
        href: 'https://demo.supabase.co/storage/v1/object/public/resume/attachments/demo.pdf',
      }),
    ).toBe(
      '/api/attachments/download?bucket=resume&fileName=resume.pdf&path=attachments%2Fdemo.pdf',
    );
  });

  it('외부 URL이 주어지면 resolveAttachmentDownloadHref는 원본 href를 그대로 반환해야 한다', () => {
    expect(
      resolveAttachmentDownloadHref({
        fileName: 'resume.pdf',
        href: 'https://example.com/resume.pdf',
      }),
    ).toBe('https://example.com/resume.pdf');
  });
});

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

  it('콘텐츠 버킷의 public URL에서 storage path를 추출한다', () => {
    expect(
      parseAttachmentStoragePath(
        'https://demo.supabase.co/storage/v1/object/public/article/attachments/demo%20resume.pdf',
      ),
    ).toEqual({
      bucketName: 'article',
      filePath: 'attachments/demo resume.pdf',
    });
  });

  it('같은 origin이 아니거나 허용되지 않은 storage 경로면 null을 반환한다', () => {
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
  });

  it('내부 첨부 파일 다운로드 경로를 생성한다', () => {
    expect(
      buildAttachmentDownloadPath({
        bucketName: 'article',
        fileName: 'resume.pdf',
        filePath: 'attachments/demo resume.pdf',
      }),
    ).toBe(
      '/api/attachments/download?bucket=article&fileName=resume.pdf&path=attachments%2Fdemo+resume.pdf',
    );
  });

  it('콘텐츠 버킷 첨부 public URL이면 bucket query를 포함한 내부 다운로드 route로 변환한다', () => {
    expect(
      resolveAttachmentDownloadHref({
        fileName: 'resume.pdf',
        href: 'https://demo.supabase.co/storage/v1/object/public/resume/attachments/demo.pdf',
      }),
    ).toBe(
      '/api/attachments/download?bucket=resume&fileName=resume.pdf&path=attachments%2Fdemo.pdf',
    );
  });

  it('일반 외부 URL은 원본 href를 유지한다', () => {
    expect(
      resolveAttachmentDownloadHref({
        fileName: 'resume.pdf',
        href: 'https://example.com/resume.pdf',
      }),
    ).toBe('https://example.com/resume.pdf');
  });
});

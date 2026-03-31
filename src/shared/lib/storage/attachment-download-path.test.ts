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

  it('file 버킷의 public URL에서 storage path를 추출한다', () => {
    expect(
      parseAttachmentStoragePath(
        'https://demo.supabase.co/storage/v1/object/public/file/article/attachments/demo%20resume.pdf',
      ),
    ).toBe('article/attachments/demo resume.pdf');
  });

  it('같은 origin이 아니거나 file 버킷이 아니면 null을 반환한다', () => {
    expect(
      parseAttachmentStoragePath(
        'https://other.example.com/storage/v1/object/public/file/article/attachments/demo.pdf',
      ),
    ).toBeNull();
    expect(
      parseAttachmentStoragePath(
        'https://demo.supabase.co/storage/v1/object/public/article/article/attachments/demo.pdf',
      ),
    ).toBeNull();
  });

  it('내부 첨부 파일 다운로드 경로를 생성한다', () => {
    expect(
      buildAttachmentDownloadPath({
        fileName: 'resume.pdf',
        filePath: 'article/attachments/demo resume.pdf',
      }),
    ).toBe(
      '/api/attachments/download?fileName=resume.pdf&path=article%2Fattachments%2Fdemo+resume.pdf',
    );
  });

  it('Supabase public URL이면 내부 다운로드 route로 변환한다', () => {
    expect(
      resolveAttachmentDownloadHref({
        fileName: 'resume.pdf',
        href: 'https://demo.supabase.co/storage/v1/object/public/file/article/attachments/demo.pdf',
      }),
    ).toBe('/api/attachments/download?fileName=resume.pdf&path=article%2Fattachments%2Fdemo.pdf');
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

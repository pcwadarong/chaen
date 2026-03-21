import { createUniqueStorageFileName } from '@/shared/lib/storage/create-unique-storage-file-name';

describe('createUniqueStorageFileName', () => {
  beforeEach(() => {
    vi.spyOn(crypto, 'randomUUID').mockReturnValue('uuid-fixed');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('공백이 있는 영문 파일명을 storage-safe 형식으로 정리한다', () => {
    expect(createUniqueStorageFileName('Test Image 01.PNG')).toBe('uuid-fixed-test-image-01.png');
  });

  it('한글과 특수문자가 섞인 파일명도 ASCII basename으로 정리한다', () => {
    expect(createUniqueStorageFileName('ChatGPT Image 2026년 3월 20일 오후 09_07_36.webp')).toBe(
      'uuid-fixed-chatgpt-image-2026-3-20-09-07-36.webp',
    );
  });

  it('basename이 전부 제거되면 기본 파일명으로 대체한다', () => {
    expect(createUniqueStorageFileName('한글파일명.webp')).toBe('uuid-fixed-file.webp');
  });
});

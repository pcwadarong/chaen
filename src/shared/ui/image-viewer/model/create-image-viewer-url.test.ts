import { createImageViewerUrl } from '@/shared/ui/image-viewer/model/create-image-viewer-url';

describe('createImageViewerUrl', () => {
  it('download 쿼리를 제거해서 이미지 뷰 URL을 만든다', () => {
    const result = createImageViewerUrl(
      'https://example.com/storage/v1/object/sign/images/demo.jpg?token=abc&download=file.jpg',
    );

    expect(result).toBe('https://example.com/storage/v1/object/sign/images/demo.jpg?token=abc');
  });

  it('상대 경로도 baseUrl 기준으로 안전하게 변환한다', () => {
    const result = createImageViewerUrl('/images/demo.jpg?download=1', 'https://chaen.dev');

    expect(result).toBe('https://chaen.dev/images/demo.jpg');
  });

  it('URL 파싱이 불가능하면 원본 문자열을 그대로 반환한다', () => {
    const result = createImageViewerUrl('https://[invalid-url', 'https://chaen.dev');

    expect(result).toBe('https://[invalid-url');
  });

  it('baseUrl 없이 상대경로면 입력 문자열을 그대로 반환한다', () => {
    const result = createImageViewerUrl('/images/demo.jpg?download=1');

    expect(result).toBe('/images/demo.jpg?download=1');
  });
});

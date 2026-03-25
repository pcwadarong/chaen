import {
  optimizeThumbnailImageFile,
  resolveThumbnailOptimizationDimensions,
} from '@/shared/lib/image/optimize-thumbnail-image-file';

describe('optimizeThumbnailImageFile', () => {
  const originalCreateElement = document.createElement.bind(document);
  const originalCreateObjectUrl = URL.createObjectURL;
  const originalRevokeObjectUrl = URL.revokeObjectURL;
  const originalImage = globalThis.Image;

  afterEach(() => {
    vi.restoreAllMocks();
    URL.createObjectURL = originalCreateObjectUrl;
    URL.revokeObjectURL = originalRevokeObjectUrl;
    globalThis.Image = originalImage;
  });

  it('최대 크기 안으로 비율을 유지해 축소한다', () => {
    expect(
      resolveThumbnailOptimizationDimensions({
        height: 1200,
        width: 2400,
      }),
    ).toEqual({
      height: 400,
      width: 800,
    });
  });

  it('최적화 대상이 아닌 형식은 원본 파일을 그대로 반환한다', async () => {
    const file = new File(['gif'], 'thumb.gif', { type: 'image/gif' });

    await expect(optimizeThumbnailImageFile(file)).resolves.toBe(file);
  });

  it('지원하는 래스터 이미지는 webp로 축소·압축한다', async () => {
    const drawImage = vi.fn();
    const canvas = {
      getContext: vi.fn().mockReturnValue({ drawImage }),
      height: 0,
      toBlob: vi.fn((callback: BlobCallback) => {
        callback(new Blob(['optimized-thumbnail'], { type: 'image/webp' }));
      }),
      width: 0,
    } as unknown as HTMLCanvasElement;

    vi.spyOn(document, 'createElement').mockImplementation(((tagName: string) => {
      if (tagName === 'canvas') {
        return canvas;
      }

      return originalCreateElement(tagName);
    }) as typeof document.createElement);

    URL.createObjectURL = vi.fn().mockReturnValue('blob:thumbnail');
    URL.revokeObjectURL = vi.fn();

    class MockImage {
      naturalHeight = 1200;
      naturalWidth = 2400;
      onerror: null | (() => void) = null;
      onload: null | (() => void) = null;

      set src(_value: string) {
        this.onload?.();
      }
    }

    globalThis.Image = MockImage as unknown as typeof Image;

    const file = new File(['original-thumbnail-source'], 'thumb.png', {
      type: 'image/png',
    });
    const optimizedFile = await optimizeThumbnailImageFile(file);

    expect(optimizedFile).not.toBe(file);
    expect(optimizedFile.name).toBe('thumb.webp');
    expect(optimizedFile.type).toBe('image/webp');
    expect(canvas.width).toBe(800);
    expect(canvas.height).toBe(400);
    expect(drawImage).toHaveBeenCalled();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:thumbnail');
  });

  it('압축 결과가 원본보다 크면 원본 파일을 반환한다', async () => {
    const drawImage = vi.fn();
    const canvas = {
      getContext: vi.fn().mockReturnValue({ drawImage }),
      height: 0,
      toBlob: vi.fn((callback: BlobCallback) => {
        callback(new Blob(['x'.repeat(64)], { type: 'image/webp' }));
      }),
      width: 0,
    } as unknown as HTMLCanvasElement;

    vi.spyOn(document, 'createElement').mockImplementation(((tagName: string) => {
      if (tagName === 'canvas') {
        return canvas;
      }

      return originalCreateElement(tagName);
    }) as typeof document.createElement);

    URL.createObjectURL = vi.fn().mockReturnValue('blob:thumbnail');
    URL.revokeObjectURL = vi.fn();

    class MockImage {
      naturalHeight = 200;
      naturalWidth = 200;
      onerror: null | (() => void) = null;
      onload: null | (() => void) = null;

      set src(_value: string) {
        this.onload?.();
      }
    }

    globalThis.Image = MockImage as unknown as typeof Image;

    const file = new File(['tiny'], 'thumb.png', {
      type: 'image/png',
    });

    await expect(optimizeThumbnailImageFile(file)).resolves.toBe(file);
  });
});

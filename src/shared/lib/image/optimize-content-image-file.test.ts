import {
  optimizeContentImageFile,
  resolveContentOptimizationDimensions,
} from '@/shared/lib/image/optimize-content-image-file';

describe('optimizeContentImageFile', () => {
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

  it('본문 이미지는 최대 1600px 안으로 비율을 유지해 축소한다', () => {
    expect(
      resolveContentOptimizationDimensions({
        height: 2400,
        width: 3200,
      }),
    ).toEqual({
      height: 1200,
      width: 1600,
    });
  });

  it('지원하는 래스터 이미지는 webp로 축소·압축한다', async () => {
    const drawImage = vi.fn();
    const canvas = {
      getContext: vi.fn().mockReturnValue({ drawImage }),
      height: 0,
      toBlob: vi.fn((callback: BlobCallback) => {
        callback(new Blob(['optimized-content'], { type: 'image/webp' }));
      }),
      width: 0,
    } as unknown as HTMLCanvasElement;

    vi.spyOn(document, 'createElement').mockImplementation(((tagName: string) => {
      if (tagName === 'canvas') {
        return canvas;
      }

      return originalCreateElement(tagName);
    }) as typeof document.createElement);

    URL.createObjectURL = vi.fn().mockReturnValue('blob:content');
    URL.revokeObjectURL = vi.fn();

    class MockImage {
      naturalHeight = 1800;
      naturalWidth = 2400;
      onerror: null | (() => void) = null;
      onload: null | (() => void) = null;

      set src(_value: string) {
        this.onload?.();
      }
    }

    globalThis.Image = MockImage as unknown as typeof Image;

    const file = new File(['original-content-source'], 'content.png', {
      type: 'image/png',
    });
    const optimizedFile = await optimizeContentImageFile(file);

    expect(optimizedFile).not.toBe(file);
    expect(optimizedFile.name).toBe('content.webp');
    expect(optimizedFile.type).toBe('image/webp');
    expect(canvas.width).toBe(1600);
    expect(canvas.height).toBe(1200);
    expect(drawImage).toHaveBeenCalled();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:content');
  });
});

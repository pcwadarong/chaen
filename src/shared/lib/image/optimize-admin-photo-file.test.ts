import { optimizeAdminPhotoFile } from '@/shared/lib/image/optimize-admin-photo-file';

describe('optimizeAdminPhotoFile', () => {
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

  it('HEIC 파일은 그대로 유지한다', async () => {
    const file = new File(['heic'], 'photo.heic', { type: 'image/heic' });

    await expect(optimizeAdminPhotoFile(file)).resolves.toBe(file);
  });

  it('작고 충분히 가벼운 JPEG는 원본을 그대로 유지한다', async () => {
    URL.createObjectURL = vi.fn().mockReturnValue('blob:small-photo');
    URL.revokeObjectURL = vi.fn();

    class MockImage {
      naturalHeight = 1200;
      naturalWidth = 1600;
      onerror: null | (() => void) = null;
      onload: null | (() => void) = null;

      set src(_value: string) {
        this.onload?.();
      }
    }

    globalThis.Image = MockImage as unknown as typeof Image;

    const file = new File(['small-jpeg'], 'small.jpg', { type: 'image/jpeg' });

    await expect(optimizeAdminPhotoFile(file)).resolves.toBe(file);
  });

  it('너무 큰 JPEG는 같은 포맷으로 축소 압축한다', async () => {
    const drawImage = vi.fn();
    const canvas = {
      getContext: vi.fn().mockReturnValue({ drawImage }),
      height: 0,
      toBlob: vi.fn((callback: BlobCallback, type?: string) => {
        callback(new Blob(['optimized-jpeg'], { type }));
      }),
      width: 0,
    } as unknown as HTMLCanvasElement;

    vi.spyOn(document, 'createElement').mockImplementation(((tagName: string) => {
      if (tagName === 'canvas') {
        return canvas;
      }

      return originalCreateElement(tagName);
    }) as typeof document.createElement);

    URL.createObjectURL = vi.fn().mockReturnValue('blob:big-photo');
    URL.revokeObjectURL = vi.fn();

    class MockImage {
      naturalHeight = 3200;
      naturalWidth = 4800;
      onerror: null | (() => void) = null;
      onload: null | (() => void) = null;

      set src(_value: string) {
        this.onload?.();
      }
    }

    globalThis.Image = MockImage as unknown as typeof Image;

    const file = new File([new Uint8Array(6 * 1024 * 1024)], 'big.jpg', { type: 'image/jpeg' });
    const optimizedFile = await optimizeAdminPhotoFile(file);

    expect(optimizedFile).not.toBe(file);
    expect(optimizedFile.name).toBe('big.jpg');
    expect(optimizedFile.type).toBe('image/jpeg');
    expect(canvas.width).toBe(2400);
    expect(canvas.height).toBe(1600);
    expect(drawImage).toHaveBeenCalled();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:big-photo');
  });
});

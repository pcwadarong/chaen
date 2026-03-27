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

  it('입력 파일이 HEIC일 때, optimizeAdminPhotoFile은 원본 파일을 그대로 반환해야 한다', async () => {
    const file = new File(['heic'], 'photo.heic', { type: 'image/heic' });

    await expect(optimizeAdminPhotoFile(file)).resolves.toBe(file);
  });

  it('입력 파일이 작은 JPEG일 때, optimizeAdminPhotoFile은 원본 파일을 그대로 반환해야 한다', async () => {
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

  it('입력 파일이 매우 큰 JPEG일 때, optimizeAdminPhotoFile은 같은 포맷의 축소 이미지를 반환해야 한다', async () => {
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

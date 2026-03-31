// @vitest-environment jsdom

import { uploadEditorVideo } from '@/entities/editor/api/upload-editor-video';

type ProgressHandler =
  | ((event: { lengthComputable: boolean; loaded: number; total: number }) => void)
  | null;

class FakeXMLHttpRequest {
  static instances: FakeXMLHttpRequest[] = [];

  upload: { onprogress: ProgressHandler } = {
    onprogress: null,
  };

  status = 200;
  responseText = '';
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  onabort: (() => void) | null = null;

  constructor() {
    FakeXMLHttpRequest.instances.push(this);
  }

  open() {}

  send() {}

  abort() {
    this.onabort?.();
  }

  dispatchProgress(loaded: number, total: number) {
    this.upload.onprogress?.({
      lengthComputable: true,
      loaded,
      total,
    });
  }

  respond(status: number, body: Record<string, unknown>) {
    this.status = status;
    this.responseText = JSON.stringify(body);
    this.onload?.();
  }
}

describe('uploadEditorVideo', () => {
  const originalXMLHttpRequest = globalThis.XMLHttpRequest;

  beforeEach(() => {
    FakeXMLHttpRequest.instances = [];
    vi.stubGlobal('XMLHttpRequest', FakeXMLHttpRequest);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  afterAll(() => {
    globalThis.XMLHttpRequest = originalXMLHttpRequest;
  });

  it('업로드 진행 이벤트가 발생하면, uploadEditorVideo는 백분율 진행률을 콜백으로 전달해야 한다', async () => {
    const onProgress = vi.fn();
    const promise = uploadEditorVideo({
      contentType: 'article',
      file: new File(['binary'], 'demo.mp4', { type: 'video/mp4' }),
      onProgress,
    });
    const request = FakeXMLHttpRequest.instances[0];

    request.dispatchProgress(25, 100);
    request.dispatchProgress(100, 100);
    request.respond(200, {
      url: 'https://example.com/videos/demo.mp4',
    });

    await expect(promise).resolves.toBe('https://example.com/videos/demo.mp4');
    expect(onProgress).toHaveBeenNthCalledWith(1, 25);
    expect(onProgress).toHaveBeenNthCalledWith(2, 100);
  });

  it('AbortSignal이 취소되면, uploadEditorVideo는 AbortError를 던져야 한다', async () => {
    const controller = new AbortController();
    const promise = uploadEditorVideo({
      contentType: 'project',
      file: new File(['binary'], 'demo.mp4', { type: 'video/mp4' }),
      signal: controller.signal,
    });

    controller.abort();

    await expect(promise).rejects.toMatchObject({
      name: 'AbortError',
    });
  });

  it('서버가 실패 응답을 반환하면, uploadEditorVideo는 응답 메시지를 포함한 예외를 던져야 한다', async () => {
    const promise = uploadEditorVideo({
      contentType: 'resume',
      file: new File(['binary'], 'demo.mp4', { type: 'video/mp4' }),
    });
    const request = FakeXMLHttpRequest.instances[0];

    request.respond(500, {
      error: 'Video upload failed on server',
    });

    await expect(promise).rejects.toThrow('Video upload failed on server');
  });
});

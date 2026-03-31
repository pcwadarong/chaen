// @vitest-environment node

import {
  isAllowedEditorVideoExtension,
  isAllowedEditorVideoFile,
} from '@/entities/editor/model/editor-video-policy';

describe('editor video policy', () => {
  it('허용된 영상 확장자가 주어지면, isAllowedEditorVideoExtension은 true를 반환해야 한다', () => {
    expect(isAllowedEditorVideoExtension('demo.mp4')).toBe(true);
    expect(isAllowedEditorVideoExtension('demo.webm')).toBe(true);
    expect(isAllowedEditorVideoExtension('folder/demo.MOV')).toBe(true);
  });

  it('허용되지 않은 영상 확장자가 주어지면, isAllowedEditorVideoExtension은 false를 반환해야 한다', () => {
    expect(isAllowedEditorVideoExtension('demo.exe')).toBe(false);
    expect(isAllowedEditorVideoExtension('.gitignore')).toBe(false);
    expect(isAllowedEditorVideoExtension('demo')).toBe(false);
  });

  it('허용된 영상 파일이 주어지면, isAllowedEditorVideoFile은 true를 반환해야 한다', () => {
    const file = new File(['binary'], 'demo.mp4', { type: 'video/mp4' });

    expect(isAllowedEditorVideoFile(file)).toBe(true);
  });

  it('허용되지 않은 영상 파일이 주어지면, isAllowedEditorVideoFile은 false를 반환해야 한다', () => {
    const file = new File(['binary'], 'demo.pdf', { type: 'application/pdf' });

    expect(isAllowedEditorVideoFile(file)).toBe(false);
  });
});

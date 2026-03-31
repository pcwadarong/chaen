// @vitest-environment node

import {
  isAllowedEditorAttachmentExtension,
  isAllowedEditorAttachmentFile,
} from '@/entities/editor/model/editor-attachment-policy';

describe('editor-attachment-policy', () => {
  it('hwpx 확장자가 주어지면 isAllowedEditorAttachmentExtension은 true를 반환해야 한다', () => {
    expect(isAllowedEditorAttachmentExtension('proposal.hwpx')).toBe(true);
    expect(isAllowedEditorAttachmentExtension('folder/report.final.hwpx')).toBe(true);
  });

  it('dotfile이나 마지막 확장자가 허용 목록이 아니면 isAllowedEditorAttachmentExtension은 false를 반환해야 한다', () => {
    expect(isAllowedEditorAttachmentExtension('.gitignore')).toBe(false);
    expect(isAllowedEditorAttachmentExtension('archive.tar.gz')).toBe(false);
  });

  it('hwpx MIME가 주어지면 isAllowedEditorAttachmentFile은 true를 반환해야 한다', () => {
    const file = new File(['binary'], 'proposal.hwpx', {
      type: 'application/vnd.hancom.hwpx',
    });

    expect(isAllowedEditorAttachmentFile(file)).toBe(true);
  });

  it('HWPX 호환 MIME가 주어지면 isAllowedEditorAttachmentFile은 true를 반환해야 한다', () => {
    const file = new File(['binary'], 'proposal.hwpx', {
      type: 'application/hwp+zip',
    });

    expect(isAllowedEditorAttachmentFile(file)).toBe(true);
  });
});

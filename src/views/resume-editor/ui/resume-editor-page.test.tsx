import { isValidElement } from 'react';

import { createDefaultResumeEditorContentMap } from '@/entities/resume/model/resume-editor.utils';
import { ResumeEditorPage } from '@/views/resume-editor/ui/resume-editor-page';

vi.mock('@/widgets/admin-console', () => ({
  AdminConsoleShell: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

describe('ResumeEditorPage', () => {
  it('client wrapper에 resume editor 초기 props를 전달한다', () => {
    const initialContents = createDefaultResumeEditorContentMap();
    const element = ResumeEditorPage({
      hideAppFrameFooter: true,
      initialContents,
      onDraftSave: vi.fn().mockResolvedValue(undefined),
    });

    expect(isValidElement(element)).toBe(true);
    expect(element.props.hideAppFrameFooter).toBe(true);
    expect(element.props.initialContents).toEqual(initialContents);
  });
});

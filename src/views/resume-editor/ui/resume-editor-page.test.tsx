import { isValidElement } from 'react';

import { createDefaultResumeEditorContentMap } from '@/entities/resume/model/resume-editor.utils';
import { ResumeEditorPage } from '@/views/resume-editor/ui/resume-editor-page';

describe('ResumeEditorPage', () => {
  it('client wrapper에 resume editor 초기 props를 전달한다', () => {
    const element = ResumeEditorPage({
      hideAppFrameFooter: true,
      initialContents: createDefaultResumeEditorContentMap(),
      initialPublishSettings: {
        downloadFileName: 'ParkChaewon-Resume.pdf',
        downloadPath: '/api/pdf/resume',
        filePath: 'ParkChaewon-Resume.pdf',
        isPdfReady: false,
      },
    });

    expect(isValidElement(element)).toBe(true);
    expect(element.props.hideAppFrameFooter).toBe(true);
    expect(element.props.initialPublishSettings).toEqual({
      downloadFileName: 'ParkChaewon-Resume.pdf',
      downloadPath: '/api/pdf/resume',
      filePath: 'ParkChaewon-Resume.pdf',
      isPdfReady: false,
    });
  });
});

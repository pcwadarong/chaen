import {
  createDefaultResumeEditorContentMap,
  getResumeEditorSavedAt,
  isResumeEditorContentMapEqual,
  normalizeResumeEditorContentMap,
  toResumeEditorContent,
  validateResumePublishState,
} from '@/entities/resume/model/resume-editor.utils';

describe('resume-editor.utils', () => {
  it('dirty 비교는 locale별 텍스트 필드 기준으로 수행한다', () => {
    const left = createDefaultResumeEditorContentMap();
    const right = normalizeResumeEditorContentMap(left);

    expect(isResumeEditorContentMapEqual(left, right)).toBe(true);

    right.ko.body = '변경된 본문';

    expect(isResumeEditorContentMapEqual(left, right)).toBe(false);
  });

  it('저장 시각은 default timestamp를 제외하고 가장 최신 updated_at을 반환한다', () => {
    expect(
      getResumeEditorSavedAt([
        { updated_at: '1970-01-01T00:00:00.000Z' },
        { updated_at: '2026-03-12T08:00:00.000Z' },
        { updated_at: '2026-03-12T09:30:00.000Z' },
      ]),
    ).toBe('2026-03-12T09:30:00.000Z');
  });

  it('게시 검증은 한국어 제목 본문과 pdf 준비 상태를 확인한다', () => {
    const contents = createDefaultResumeEditorContentMap();

    contents.ko.title = '';
    contents.ko.body = '';

    expect(
      validateResumePublishState({
        contents,
        settings: {
          downloadFileName: 'Resume.pdf',
          downloadPath: '/api/pdf/resume',
          filePath: 'ParkChaewon-Resume.pdf',
          isPdfReady: false,
        },
      }),
    ).toEqual({
      koBody: '한국어 본문을 입력해주세요',
      koTitle: '한국어 제목을 입력해주세요',
      pdf: '이력서 PDF를 업로드해주세요',
    });
  });

  it('pdf row에서 편집 필드만 추린다', () => {
    expect(
      toResumeEditorContent({
        body: '본문',
        description: '설명',
        download_button_label: '다운로드',
        download_unavailable_label: '준비 중',
        title: '제목',
      }),
    ).toEqual({
      body: '본문',
      description: '설명',
      download_button_label: '다운로드',
      download_unavailable_label: '준비 중',
      title: '제목',
    });
  });
});

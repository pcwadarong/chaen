import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';

import { MarkdownToolbar } from '@/features/edit-markdown/ui/markdown-toolbar';
import { Textarea } from '@/shared/ui/textarea/textarea';

vi.mock('@/entities/editor/api/upload-editor-file', () => ({
  uploadEditorFile: vi.fn(async () => ({
    contentType: 'application/pdf',
    fileName: 'resume.pdf',
    fileSize: 2048,
    url: 'https://example.com/resume.pdf',
  })),
}));

/**
 * 툴바와 textarea를 함께 묶어 실제 편집 상호작용을 검증합니다.
 */
const ToolbarHarness = () => {
  const textareaRef = React.useRef<HTMLTextAreaElement | null>(null);
  const [value, setValue] = React.useState('');

  return (
    <>
      <MarkdownToolbar contentType="article" onChange={setValue} textareaRef={textareaRef} />
      <Textarea
        aria-label="본문 입력"
        autoResize={false}
        onChange={event => setValue(event.target.value)}
        ref={textareaRef}
        value={value}
      />
    </>
  );
};

describe('MarkdownToolbar', () => {
  it('링크 팝오버에서 제목 링크를 삽입한다', async () => {
    render(<ToolbarHarness />);

    const textarea = screen.getByRole('textbox', { name: '본문 입력' }) as HTMLTextAreaElement;

    fireEvent.click(screen.getByRole('button', { name: '링크 임베드' }));
    fireEvent.change(screen.getByRole('textbox', { name: '링크 URL' }), {
      target: { value: 'https://openai.com' },
    });
    fireEvent.click(screen.getByRole('button', { name: '제목 링크' }));

    await waitFor(() => {
      expect(textarea.value).toBe('[https://openai.com](https://openai.com/ "preview")');
    });
  });

  it('팝오버로 링크를 삽입한 뒤 textarea 포커스와 커서를 삽입 직후 위치로 복원한다', async () => {
    render(<ToolbarHarness />);

    const textarea = screen.getByRole('textbox', { name: '본문 입력' }) as HTMLTextAreaElement;
    fireEvent.change(textarea, { target: { value: 'Hello suffix' } });
    textarea.focus();
    textarea.setSelectionRange(6, 6);

    fireEvent.click(screen.getByRole('button', { name: '링크 임베드' }));
    fireEvent.change(screen.getByRole('textbox', { name: '링크 URL' }), {
      target: { value: 'https://openai.com' },
    });
    fireEvent.click(screen.getByRole('button', { name: '제목 링크' }));

    const insertedLink = '[https://openai.com](https://openai.com/ "preview")';

    await waitFor(() => {
      expect(textarea.value).toBe(`Hello ${insertedLink}suffix`);
      expect(document.activeElement).toBe(textarea);
      expect(textarea.selectionStart).toBe(6 + insertedLink.length);
      expect(textarea.selectionEnd).toBe(6 + insertedLink.length);
    });
  });

  it('이미지 URL이 추가되면, 이미지 삽입 모달은 markdown 이미지 문법을 삽입해야 한다', async () => {
    render(<ToolbarHarness />);

    const textarea = screen.getByRole('textbox', { name: '본문 입력' }) as HTMLTextAreaElement;

    fireEvent.click(screen.getByRole('button', { name: '이미지' }));
    fireEvent.change(screen.getByRole('textbox', { name: '웹 URL 추가' }), {
      target: { value: 'https://example.com/image.png' },
    });
    fireEvent.click(screen.getByRole('button', { name: '추가' }));
    fireEvent.click(screen.getByRole('button', { name: '개별 이미지로 삽입' }));

    await waitFor(() => {
      expect(textarea.value).toBe('![이미지 설명](https://example.com/image.png)');
    });
  });

  it('파일 팝오버로 업로드한 첨부 파일 markdown를 삽입한다', async () => {
    render(<ToolbarHarness />);

    const textarea = screen.getByRole('textbox', { name: '본문 입력' }) as HTMLTextAreaElement;

    fireEvent.click(screen.getByRole('button', { name: '파일 첨부' }));
    fireEvent.change(screen.getByLabelText('첨부 파일 업로드'), {
      target: {
        files: [new File(['pdf'], 'resume.pdf', { type: 'application/pdf' })],
      },
    });

    await waitFor(() => {
      expect(screen.getByDisplayValue('resume.pdf')).toBeTruthy();
    });

    fireEvent.click(screen.getByRole('button', { name: '삽입' }));

    await waitFor(() => {
      expect(textarea.value).toBe(
        '<Attachment href="https://example.com/resume.pdf" name="resume.pdf" size="2048" type="application/pdf" />',
      );
    });
  });

  it('수학 공식 팝오버에서 inline 수식 markdown를 삽입한다', async () => {
    render(<ToolbarHarness />);

    const textarea = screen.getByRole('textbox', { name: '본문 입력' }) as HTMLTextAreaElement;

    fireEvent.click(screen.getByRole('button', { name: '수학 공식' }));
    fireEvent.change(screen.getByRole('textbox', { name: 'LaTeX 수식' }), {
      target: { value: 'a^2 + b^2 = c^2' },
    });
    fireEvent.click(screen.getByRole('button', { name: '인라인' }));

    await waitFor(() => {
      expect(textarea.value).toBe('<Math>a^2 + b^2 = c^2</Math>');
    });
  });

  it('선택 텍스트의 앞뒤 공백도 링크 라벨에 포함한다', async () => {
    render(<ToolbarHarness />);

    const textarea = screen.getByRole('textbox', { name: '본문 입력' }) as HTMLTextAreaElement;
    fireEvent.change(textarea, { target: { value: '  OpenAI  ' } });
    textarea.setSelectionRange(0, textarea.value.length);

    fireEvent.click(screen.getByRole('button', { name: '링크 임베드' }));
    fireEvent.change(screen.getByRole('textbox', { name: '링크 URL' }), {
      target: { value: 'https://openai.com' },
    });
    fireEvent.click(screen.getByRole('button', { name: '하이퍼링크' }));

    await waitFor(() => {
      expect(textarea.value).toBe('[  OpenAI  ](https://openai.com/)');
    });
  });

  it('정렬 팝오버는 선택한 텍스트를 유지한 채 align block으로 감싼다', async () => {
    render(<ToolbarHarness />);

    const textarea = screen.getByRole('textbox', { name: '본문 입력' }) as HTMLTextAreaElement;
    fireEvent.change(textarea, { target: { value: '정렬할 내용' } });
    textarea.setSelectionRange(0, textarea.value.length);

    fireEvent.click(screen.getByRole('button', { name: '정렬' }));
    fireEvent.click(screen.getByRole('button', { name: '가운데 정렬' }));

    await waitFor(() => {
      expect(textarea.value).toBe(':::align center\n정렬할 내용\n:::');
      expect(textarea.selectionStart).toBe(':::align center\n'.length);
      expect(textarea.selectionEnd).toBe(':::align center\n정렬할 내용'.length);
    });
  });

  it('유효한 동영상 URL이 입력되면, 동영상 삽입은 textarea에 Video 문법을 삽입해야 한다', async () => {
    render(<ToolbarHarness />);

    const textarea = screen.getByRole('textbox', { name: '본문 입력' }) as HTMLTextAreaElement;

    fireEvent.click(screen.getByRole('button', { name: '영상' }));
    fireEvent.change(screen.getByRole('textbox', { name: '동영상 URL' }), {
      target: { value: 'https://youtu.be/dQw4w9WgXcQ/extra' },
    });
    fireEvent.click(screen.getByRole('button', { name: '삽입' }));

    await waitFor(() => {
      expect(textarea.value).toBe('<Video provider="youtube" id="dQw4w9WgXcQ" />');
    });
  });

  it('잘못된 동영상 URL이 입력되면, 동영상 삽입은 textarea 값을 변경해서는 안 된다', async () => {
    render(<ToolbarHarness />);

    const textarea = screen.getByRole('textbox', { name: '본문 입력' }) as HTMLTextAreaElement;
    textarea.setSelectionRange(0, 0);

    fireEvent.click(screen.getByRole('button', { name: '영상' }));
    fireEvent.change(screen.getByRole('textbox', { name: '동영상 URL' }), {
      target: { value: 'not-a-video-url' },
    });
    fireEvent.click(screen.getByRole('button', { name: '삽입' }));

    await waitFor(() => {
      expect(textarea.value).toBe('');
    });
  });

  it('리스트·인라인 코드·줄바꿈·토글 목록 버튼은 노출하지 않는다', () => {
    render(<ToolbarHarness />);

    expect(screen.queryByRole('button', { name: '목록' })).toBeNull();
    expect(screen.queryByRole('button', { name: '인라인 코드' })).toBeNull();
    expect(screen.queryByRole('button', { name: '줄바꿈' })).toBeNull();
    expect(screen.queryByRole('button', { name: '토글 목록' })).toBeNull();
    expect(screen.getByRole('button', { name: '토글 제목 4' })).toBeTruthy();
  });

  it('툴팁으로 액션 이름을 노출한다', async () => {
    render(<ToolbarHarness />);

    const boldButton = screen.getByRole('button', { name: '굵게' });
    fireEvent.focus(boldButton);

    expect(await screen.findByRole('tooltip', { name: '굵게' })).toBeTruthy();
  });
});

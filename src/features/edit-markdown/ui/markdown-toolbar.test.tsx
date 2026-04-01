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

/**
 * host app이 toolbar UI registry를 통해 popover labels를 덮어쓰는 시나리오를 검증합니다.
 */
const ToolbarWithCustomUiRegistryHarness = () => {
  const textareaRef = React.useRef<HTMLTextAreaElement | null>(null);
  const [value, setValue] = React.useState('');

  return (
    <>
      <MarkdownToolbar
        contentType="article"
        onChange={setValue}
        textareaRef={textareaRef}
        uiRegistry={{
          labels: {
            headingPopover: {
              panelLabel: '커스텀 제목 선택',
              triggerAriaLabel: '헤딩',
              triggerTooltip: '헤딩',
            },
            linkEmbedPopover: {
              panelLabel: '커스텀 링크 패널',
              triggerAriaLabel: '링크 추가',
              triggerTooltip: '링크 추가',
            },
          },
        }}
      />
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
  it('유효한 링크 URL이 입력되면, MarkdownToolbar는 제목 링크 문법을 삽입해야 한다', async () => {
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

  it('링크 팝오버로 문법을 삽입하면, MarkdownToolbar는 textarea 포커스와 커서를 삽입 직후로 복원해야 한다', async () => {
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

  it('웹 URL 이미지가 추가되면, MarkdownToolbar는 markdown 이미지 문법을 삽입해야 한다', async () => {
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

  it('업로드된 첨부 파일이 확인되면, MarkdownToolbar는 Attachment 문법을 삽입해야 한다', async () => {
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

  it('인라인 수식이 입력되면, MarkdownToolbar는 Math 문법을 삽입해야 한다', async () => {
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

  it('선택 텍스트에 앞뒤 공백이 포함되면, MarkdownToolbar는 공백까지 링크 라벨로 유지해야 한다', async () => {
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

  it('정렬 옵션을 선택하면, MarkdownToolbar는 선택 텍스트를 유지한 채 align block으로 감싸야 한다', async () => {
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

  it('유효한 동영상 URL이 입력되면, MarkdownToolbar는 Video 문법을 삽입해야 한다', async () => {
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

  it('잘못된 동영상 URL이 입력되면, MarkdownToolbar는 textarea 값을 변경하지 않아야 한다', async () => {
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

  it('기본 compact toolbar가 렌더링되면, MarkdownToolbar는 숨김 대상 버튼을 노출하지 않고 제목/토글 트리거만 보여야 한다', () => {
    render(<ToolbarHarness />);

    expect(screen.queryByRole('button', { name: '목록' })).toBeNull();
    expect(screen.queryByRole('button', { name: '인라인 코드' })).toBeNull();
    expect(screen.queryByRole('button', { name: '줄바꿈' })).toBeNull();
    expect(screen.queryByRole('button', { name: '토글 목록' })).toBeNull();
    expect(screen.queryByRole('button', { name: '제목 4' })).toBeNull();
    expect(screen.queryByRole('button', { name: '토글 제목 4' })).toBeNull();
    expect(screen.getByRole('button', { name: '제목' })).toBeTruthy();
    expect(screen.getByRole('button', { name: '토글' })).toBeTruthy();
  });

  it('툴바 액션에 포커스가 들어가면, MarkdownToolbar는 툴팁으로 액션 이름을 노출해야 한다', async () => {
    render(<ToolbarHarness />);

    const boldButton = screen.getByRole('button', { name: '굵게' });
    fireEvent.focus(boldButton);

    expect(await screen.findByRole('tooltip', { name: '굵게' })).toBeTruthy();
  });

  it('제목 팝오버에서 레벨을 선택하면, MarkdownToolbar는 heading 문법을 삽입해야 한다', async () => {
    render(<ToolbarHarness />);

    const textarea = screen.getByRole('textbox', { name: '본문 입력' }) as HTMLTextAreaElement;
    fireEvent.change(textarea, { target: { value: '섹션 제목' } });
    textarea.focus();
    textarea.setSelectionRange(0, 0);

    fireEvent.click(screen.getByRole('button', { name: '제목' }));
    fireEvent.click(screen.getByRole('button', { name: '제목 2' }));

    await waitFor(() => {
      expect(textarea.value).toBe('## 섹션 제목');
    });
  });

  it('토글 팝오버에서 레벨을 선택하면, MarkdownToolbar는 toggle 문법을 삽입해야 한다', async () => {
    render(<ToolbarHarness />);

    const textarea = screen.getByRole('textbox', { name: '본문 입력' }) as HTMLTextAreaElement;
    fireEvent.change(textarea, { target: { value: '토글 내용' } });
    textarea.focus();
    textarea.setSelectionRange(0, textarea.value.length);

    fireEvent.click(screen.getByRole('button', { name: '토글' }));
    fireEvent.click(screen.getByRole('button', { name: '토글 제목 3' }));

    await waitFor(() => {
      expect(textarea.value).toBe(':::toggle ### 토글 내용\n내용\n:::');
    });
  });

  it('host app이 toolbar ui registry를 주입하면, MarkdownToolbar는 커스텀 popover labels를 그대로 노출해야 한다', async () => {
    render(<ToolbarWithCustomUiRegistryHarness />);

    const headingTrigger = screen.getByRole('button', { name: '헤딩' });
    fireEvent.focus(headingTrigger);

    expect(await screen.findByRole('tooltip', { name: '헤딩' })).toBeTruthy();

    fireEvent.click(headingTrigger);

    expect(await screen.findByText('커스텀 제목 선택')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: '링크 추가' }));

    expect(await screen.findByText('커스텀 링크 패널')).toBeTruthy();
  });
});

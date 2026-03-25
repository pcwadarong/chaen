import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';

import { MarkdownToolbar } from '@/features/edit-markdown/ui/markdown-toolbar';
import { Textarea } from '@/shared/ui/textarea/textarea';

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
  it('선택한 텍스트를 굵게 감싼다', async () => {
    render(<ToolbarHarness />);

    const textarea = screen.getByRole('textbox', { name: '본문 입력' }) as HTMLTextAreaElement;
    fireEvent.change(textarea, { target: { value: 'OpenAI' } });
    textarea.setSelectionRange(0, 6);

    fireEvent.click(screen.getByRole('button', { name: '굵게' }));

    await waitFor(() => {
      expect(textarea.value).toBe('**OpenAI**');
      expect(textarea.selectionStart).toBe(2);
      expect(textarea.selectionEnd).toBe(8);
    });
  });

  it('헤딩 버튼은 같은 레벨이면 제거하고 다른 레벨이면 치환한다', async () => {
    render(<ToolbarHarness />);

    const textarea = screen.getByRole('textbox', { name: '본문 입력' }) as HTMLTextAreaElement;
    fireEvent.change(textarea, { target: { value: '## 제목' } });
    textarea.setSelectionRange(0, 5);

    fireEvent.click(screen.getByRole('button', { name: '제목 3' }));

    await waitFor(() => {
      expect(textarea.value).toBe('### 제목');
    });

    textarea.setSelectionRange(0, textarea.value.length);
    fireEvent.click(screen.getByRole('button', { name: '제목 3' }));

    await waitFor(() => {
      expect(textarea.value).toBe('제목');
    });
  });

  it('빈 줄에서 헤딩 버튼을 누르면 heading prefix만 삽입한다', async () => {
    render(<ToolbarHarness />);

    const textarea = screen.getByRole('textbox', { name: '본문 입력' }) as HTMLTextAreaElement;

    fireEvent.click(screen.getByRole('button', { name: '제목 4' }));

    await waitFor(() => {
      expect(textarea.value).toBe('#### ');
      expect(textarea.selectionStart).toBe(5);
      expect(textarea.selectionEnd).toBe(5);
    });
  });

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

  it('팝오버 삽입 뒤에도 textarea 포커스와 커서 위치를 유지한다', async () => {
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

  it('이미지 팝오버에서 URL을 입력해 markdown 이미지 문법을 삽입한다', async () => {
    render(<ToolbarHarness />);

    const textarea = screen.getByRole('textbox', { name: '본문 입력' }) as HTMLTextAreaElement;

    fireEvent.click(screen.getByRole('button', { name: '이미지' }));
    fireEvent.change(screen.getByRole('textbox', { name: '이미지' }), {
      target: { value: 'https://example.com/image.png' },
    });
    fireEvent.click(screen.getByRole('button', { name: '삽입' }));

    await waitFor(() => {
      expect(textarea.value).toBe('![이미지 설명](<https://example.com/image.png>)');
    });
  });

  it('링크 라벨은 선택한 공백을 그대로 유지한다', async () => {
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

  it('코드 블록 버튼은 placeholder를 삽입하고 코드 영역을 선택한다', async () => {
    render(<ToolbarHarness />);

    const textarea = screen.getByRole('textbox', { name: '본문 입력' }) as HTMLTextAreaElement;

    fireEvent.click(screen.getByRole('button', { name: '코드 블록' }));

    await waitFor(() => {
      expect(textarea.value).toBe('```ts\n코드를 입력하세요\n```');
      expect(textarea.selectionStart).toBe(6);
      expect(textarea.selectionEnd).toBe(15);
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

  it('유튜브 팝오버는 유효한 URL 입력을 textarea 삽입으로 연결한다', async () => {
    render(<ToolbarHarness />);

    const textarea = screen.getByRole('textbox', { name: '본문 입력' }) as HTMLTextAreaElement;

    fireEvent.click(screen.getByRole('button', { name: '유튜브' }));
    fireEvent.change(screen.getByRole('textbox', { name: 'YouTube URL' }), {
      target: { value: 'https://youtu.be/dQw4w9WgXcQ/extra' },
    });
    fireEvent.click(screen.getByRole('button', { name: '삽입' }));

    await waitFor(() => {
      expect(textarea.value).toBe('<YouTube id="dQw4w9WgXcQ" />');
    });
  });

  it('토글 버튼은 빈 상태에서도 textarea 삽입을 수행한다', async () => {
    render(<ToolbarHarness />);

    const textarea = screen.getByRole('textbox', { name: '본문 입력' }) as HTMLTextAreaElement;

    fireEvent.click(screen.getByRole('button', { name: '토글 제목 4' }));

    await waitFor(() => {
      expect(textarea.value).toContain(':::toggle #### ');
      expect(textarea.value).toContain(':::');
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

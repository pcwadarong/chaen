import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';

import { AdminEditorShell } from '@/widgets/admin-editor/ui/admin-editor-shell';

const availableTags = [
  { id: 'tag-1', slug: 'react' },
  { id: 'tag-2', slug: 'nextjs' },
];

describe('AdminEditorShell', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        json: async () => ({
          description: 'OpenAI description',
          favicon: 'https://openai.com/favicon.ico',
          image: 'https://openai.com/preview.png',
          siteName: 'OpenAI',
          title: 'OpenAI',
          url: 'https://openai.com/',
        }),
        ok: true,
      }),
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const openLinkPopover = () => {
    fireEvent.click(screen.getByRole('button', { name: '링크 삽입' }));
  };

  it('선택된 텍스트가 있으면 하이퍼링크 버튼으로 markdown 링크를 삽입한다', () => {
    render(<AdminEditorShell availableTags={availableTags} />);

    const textarea = screen.getByRole('textbox', { name: '본문 입력' }) as HTMLTextAreaElement;
    fireEvent.change(textarea, { target: { value: 'OpenAI' } });
    textarea.setSelectionRange(0, 6);

    openLinkPopover();
    fireEvent.change(screen.getByRole('textbox', { name: '링크 URL' }), {
      target: { value: 'https://openai.com' },
    });
    fireEvent.click(screen.getByRole('button', { name: '하이퍼링크' }));

    expect(textarea.value).toBe('[OpenAI](https://openai.com/)');
  });

  it('선택 텍스트가 없으면 하이퍼링크 버튼으로 URL 텍스트 링크를 삽입한다', () => {
    render(<AdminEditorShell availableTags={availableTags} />);

    const textarea = screen.getByRole('textbox', { name: '본문 입력' }) as HTMLTextAreaElement;

    openLinkPopover();
    fireEvent.change(screen.getByRole('textbox', { name: '링크 URL' }), {
      target: { value: 'https://github.com/openai/openai' },
    });
    fireEvent.click(screen.getByRole('button', { name: '하이퍼링크' }));

    expect(textarea.value).toBe(
      '[https://github.com/openai/openai](https://github.com/openai/openai)',
    );
  });

  it('선택 텍스트가 있을 때 URL을 붙여넣으면 markdown 링크로 바꾼다', () => {
    render(<AdminEditorShell availableTags={availableTags} />);

    const textarea = screen.getByRole('textbox', { name: '본문 입력' }) as HTMLTextAreaElement;
    fireEvent.change(textarea, { target: { value: 'OpenAI' } });
    textarea.setSelectionRange(0, 6);

    fireEvent.paste(textarea, {
      clipboardData: {
        getData: () => 'https://openai.com',
      },
    });

    expect(textarea.value).toBe('[OpenAI](https://openai.com/)');
  });

  it('텍스트와 URL을 함께 붙여넣으면 markdown 링크를 삽입한다', () => {
    render(<AdminEditorShell availableTags={availableTags} />);

    const textarea = screen.getByRole('textbox', { name: '본문 입력' }) as HTMLTextAreaElement;

    fireEvent.paste(textarea, {
      clipboardData: {
        getData: () => 'OpenAI https://openai.com',
      },
    });

    expect(textarea.value).toBe('[OpenAI](https://openai.com/)');
  });

  it('링크 생성 팝오버에서 제목 링크를 선택하면 preview 링크를 삽입한다', () => {
    render(<AdminEditorShell availableTags={availableTags} />);

    const textarea = screen.getByRole('textbox', { name: '본문 입력' }) as HTMLTextAreaElement;

    openLinkPopover();
    fireEvent.change(screen.getByRole('textbox', { name: '링크 URL' }), {
      target: { value: 'https://www.google.com' },
    });
    fireEvent.click(screen.getByRole('button', { name: '제목 링크' }));

    expect(textarea.value).toBe('[https://www.google.com/](https://www.google.com/ "preview")');
  });

  it('링크 생성 팝오버에서 OG 카드를 선택하면 card 링크를 삽입한다', () => {
    render(<AdminEditorShell availableTags={availableTags} />);

    const textarea = screen.getByRole('textbox', { name: '본문 입력' }) as HTMLTextAreaElement;

    openLinkPopover();
    fireEvent.change(screen.getByRole('textbox', { name: '링크 URL' }), {
      target: { value: 'https://openai.com' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'OG 카드' }));

    expect(textarea.value).toBe('[https://openai.com/](https://openai.com/ "card")');
  });

  it('링크 생성 팝오버는 세 가지의 버튼을 노출한다', () => {
    render(<AdminEditorShell availableTags={availableTags} />);

    openLinkPopover();

    expect(screen.getByRole('button', { name: '멘션' })).toBeTruthy();
    expect(screen.getByRole('button', { name: '링크' })).toBeTruthy();
    expect(screen.getByRole('button', { name: '카드' })).toBeTruthy();
  });
});

import {
  buildEditorLinkInsertion,
  createMarkdownLink,
  createMarkdownLinkByMode,
} from '@/shared/lib/editor/markdown-link';

describe('markdown-link utils', () => {
  it('선택된 텍스트와 URL이 있으면 markdown 링크를 만든다', () => {
    expect(
      buildEditorLinkInsertion({
        clipboardText: 'https://openai.com',
        selectedText: 'OpenAI',
      }),
    ).toEqual({
      text: '[OpenAI](https://openai.com/)',
      type: 'link',
    });
  });

  it('URL만 붙여넣으면 URL 텍스트를 가진 markdown 링크를 만든다', () => {
    expect(
      buildEditorLinkInsertion({
        clipboardText: 'https://openai.com',
        selectedText: '',
      }),
    ).toEqual({
      text: '[https://openai.com/](https://openai.com/)',
      type: 'link',
    });
  });

  it('텍스트와 URL을 함께 붙여넣으면 markdown 링크를 만든다', () => {
    expect(
      buildEditorLinkInsertion({
        clipboardText: 'OpenAI https://openai.com',
        selectedText: '',
      }),
    ).toEqual({
      text: '[OpenAI](https://openai.com/)',
      type: 'link',
    });
  });

  it('링크 생성 모드에 따라 preview, card, embed 문법을 만든다', () => {
    expect(createMarkdownLink('OpenAI', 'https://openai.com')).toBe(
      '[OpenAI](https://openai.com/)',
    );
    expect(
      createMarkdownLinkByMode({
        label: 'OpenAI',
        mode: 'preview',
        url: 'https://openai.com',
      }),
    ).toBe('[OpenAI](https://openai.com/ "preview")');
    expect(
      createMarkdownLinkByMode({
        label: 'OpenAI',
        mode: 'card',
        url: 'https://openai.com',
      }),
    ).toBe('[OpenAI](https://openai.com/ "card")');
    expect(
      createMarkdownLinkByMode({
        label: 'OpenAI',
        mode: 'embed',
        url: 'https://openai.com',
      }),
    ).toBe('[embed](https://openai.com/)');
  });
});

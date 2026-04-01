/** @vitest-environment node */

import {
  DEFAULT_MARKDOWN_TOOLBAR_PRESET,
  resolveMarkdownToolbarPresetSections,
} from '@/entities/editor-core/model/toolbar-preset';

describe('markdown toolbar preset', () => {
  it('기본 preset이 주어지면, resolveMarkdownToolbarPresetSections는 고정된 section 순서와 item 순서를 유지해야 한다', () => {
    expect(
      resolveMarkdownToolbarPresetSections({
        itemRegistry: {
          'background-color': 'background-color',
          bold: 'bold',
          'heading-popover': 'heading-popover',
          subtext: 'subtext',
          'toggle-popover': 'toggle-popover',
          'video-embed': 'video-embed',
        },
      }),
    ).toEqual([
      { items: ['heading-popover', 'subtext'], key: 'heading-and-subtext' },
      { items: ['bold'], key: 'text-emphasis' },
      { items: ['background-color'], key: 'highlight-and-alignment' },
      { items: ['toggle-popover'], key: 'block-syntax' },
      { items: ['video-embed'], key: 'embed-and-media' },
    ]);
  });

  it('일부 기능이 빠진 custom preset이 주어지면, resolveMarkdownToolbarPresetSections는 요청된 item key만 조합해야 한다', () => {
    expect(
      resolveMarkdownToolbarPresetSections({
        itemRegistry: {
          bold: 'bold',
          'heading-popover': 'heading-popover',
          'video-embed': 'video-embed',
        },
        preset: [
          {
            itemKeys: ['bold'],
            key: 'text-emphasis',
          },
          {
            itemKeys: ['video-embed', 'heading-popover'],
            key: 'embed-and-media',
          },
        ],
      }),
    ).toEqual([
      { items: ['bold'], key: 'text-emphasis' },
      { items: ['video-embed', 'heading-popover'], key: 'embed-and-media' },
    ]);
  });

  it('기본 preset 계약에서, DEFAULT_MARKDOWN_TOOLBAR_PRESET은 현재 기능 그룹 구성을 순수 데이터로 노출해야 한다', () => {
    expect(DEFAULT_MARKDOWN_TOOLBAR_PRESET).toEqual([
      { itemKeys: ['heading-popover', 'subtext'], key: 'heading-and-subtext' },
      { itemKeys: ['bold', 'italic', 'strike', 'underline'], key: 'text-emphasis' },
      {
        itemKeys: ['text-color', 'background-color', 'align'],
        key: 'highlight-and-alignment',
      },
      {
        itemKeys: ['horizontal-rule', 'quote', 'code-block', 'table', 'spoiler', 'toggle-popover'],
        key: 'block-syntax',
      },
      {
        itemKeys: ['math-embed', 'file-embed', 'image-embed', 'link-embed', 'video-embed'],
        key: 'embed-and-media',
      },
    ]);
  });
});

/** @vitest-environment node */

import {
  DEFAULT_MARKDOWN_TOOLBAR_PRESET,
  resolveMarkdownToolbarPresetSections,
} from '@/entities/editor-core/model/toolbar-preset';

describe('markdown toolbar preset', () => {
  it('Under the default preset, resolveMarkdownToolbarPresetSections must preserve the fixed section order and item order', () => {
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

  it('Under a custom preset without some features, resolveMarkdownToolbarPresetSections must compose only the requested item keys', () => {
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

  it('Under the default preset contract, DEFAULT_MARKDOWN_TOOLBAR_PRESET must expose the current feature grouping as pure data', () => {
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

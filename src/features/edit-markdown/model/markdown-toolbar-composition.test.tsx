/** @vitest-environment node */

import React from 'react';

import {
  createMarkdownToolbarSections,
  createToolbarActionItems,
  createToolbarCustomItem,
  createToolbarTokenOptions,
} from '@/features/edit-markdown/model/markdown-toolbar-composition';

describe('markdown-toolbar composition helpers', () => {
  it('Under tokenized toolbar actions, createToolbarTokenOptions must preserve action keys and tokens for popover options', () => {
    const onClick = vi.fn();

    expect(
      createToolbarTokenOptions([
        {
          key: 'heading-1',
          label: '제목 1',
          onClick,
          token: 'H1',
        },
      ]),
    ).toEqual([
      {
        key: 'heading-1',
        label: '제목 1',
        onClick,
        token: 'H1',
      },
    ]);
  });

  it('Under plain toolbar actions, createToolbarActionItems must wrap each action into the section item contract', () => {
    const onClick = vi.fn();

    expect(
      createToolbarActionItems([
        {
          key: 'bold',
          label: '굵게',
          onClick,
        },
      ]),
    ).toEqual([
      {
        action: {
          key: 'bold',
          label: '굵게',
          onClick,
        },
        key: 'bold',
        type: 'action',
      },
    ]);
  });

  it('Under grouped toolbar features, createMarkdownToolbarSections must compose the fixed preset section order', () => {
    const headingPopover = <div>heading</div>;
    const togglePopover = <div>toggle</div>;
    const embedItem = createToolbarCustomItem('video-embed', <div>video</div>);
    const highlightItem = createToolbarCustomItem('align', <div>align</div>);

    expect(
      createMarkdownToolbarSections({
        blockSyntaxActions: [],
        embedItems: [embedItem],
        headingPopover,
        highlightItems: [highlightItem],
        inlineFormatActions: [],
        textStructureActions: [],
        togglePopover,
      }).map(section => ({
        itemKeys: section.items.map(item => item.key),
        key: section.key,
      })),
    ).toEqual([
      { itemKeys: ['heading-popover'], key: 'heading-and-subtext' },
      { itemKeys: [], key: 'text-emphasis' },
      { itemKeys: ['align'], key: 'highlight-and-alignment' },
      { itemKeys: ['toggle-popover'], key: 'block-syntax' },
      { itemKeys: ['video-embed'], key: 'embed-and-media' },
    ]);
  });
});

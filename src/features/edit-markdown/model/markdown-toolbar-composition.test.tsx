/** @vitest-environment node */

import React from 'react';

import { DEFAULT_MARKDOWN_TOOLBAR_PRESET } from '@/entities/editor-core/model/toolbar-preset';
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

  it('Under the default preset registry, createMarkdownToolbarSections must compose sections from item keys without changing the fixed order', () => {
    const itemRegistry = {
      align: createToolbarCustomItem('align', <div>align</div>),
      'heading-popover': createToolbarCustomItem('heading-popover', <div>heading</div>),
      'toggle-popover': createToolbarCustomItem('toggle-popover', <div>toggle</div>),
      'video-embed': createToolbarCustomItem('video-embed', <div>video</div>),
    } as const;

    expect(
      createMarkdownToolbarSections({
        itemRegistry,
        preset: DEFAULT_MARKDOWN_TOOLBAR_PRESET,
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

  it('Under a reduced preset, createMarkdownToolbarSections must allow feature removal without changing hook logic', () => {
    expect(
      createMarkdownToolbarSections({
        itemRegistry: {
          'heading-popover': createToolbarCustomItem('heading-popover', <div>heading</div>),
          'video-embed': createToolbarCustomItem('video-embed', <div>video</div>),
        },
        preset: [
          {
            itemKeys: ['heading-popover'],
            key: 'heading-and-subtext',
          },
          {
            itemKeys: ['video-embed'],
            key: 'embed-and-media',
          },
        ],
      }),
    ).toEqual([
      {
        items: [
          {
            key: 'heading-popover',
            node: <div>heading</div>,
            type: 'custom',
          },
        ],
        key: 'heading-and-subtext',
      },
      {
        items: [
          {
            key: 'video-embed',
            node: <div>video</div>,
            type: 'custom',
          },
        ],
        key: 'embed-and-media',
      },
    ]);
  });
});

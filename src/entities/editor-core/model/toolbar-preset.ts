export type MarkdownToolbarSectionKey =
  | 'heading-and-subtext'
  | 'text-emphasis'
  | 'highlight-and-alignment'
  | 'block-syntax'
  | 'embed-and-media';

export type MarkdownToolbarPresetItemKey =
  | 'heading-popover'
  | 'subtext'
  | 'bold'
  | 'italic'
  | 'strike'
  | 'underline'
  | 'text-color'
  | 'background-color'
  | 'align'
  | 'horizontal-rule'
  | 'quote'
  | 'code-block'
  | 'table'
  | 'spoiler'
  | 'toggle-popover'
  | 'math-embed'
  | 'file-embed'
  | 'image-embed'
  | 'link-embed'
  | 'video-embed';

export type MarkdownToolbarPresetSection = {
  itemKeys: MarkdownToolbarPresetItemKey[];
  key: MarkdownToolbarSectionKey;
};

export type MarkdownToolbarResolvedSection<TItem> = {
  items: TItem[];
  key: MarkdownToolbarSectionKey;
};

/**
 * 현재 리포 기준 기본 markdown toolbar 조합 규칙입니다.
 * 실제 action 구현이나 UI node는 포함하지 않고, item key와 section 순서만 순수 데이터로 고정합니다.
 * 이후 host app이나 외부 package에서는 이 preset을 부분 수정하거나 교체해 기능 on/off와 순서를 조절할 수 있습니다.
 */
export const DEFAULT_MARKDOWN_TOOLBAR_PRESET: MarkdownToolbarPresetSection[] = [
  {
    itemKeys: ['heading-popover', 'subtext'],
    key: 'heading-and-subtext',
  },
  {
    itemKeys: ['bold', 'italic', 'strike', 'underline'],
    key: 'text-emphasis',
  },
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
];

/**
 * toolbar preset과 item registry를 결합해 최종 section 배열을 계산합니다.
 * preset에 정의된 순서는 유지하되 registry에 없는 item key는 자동으로 생략하므로,
 * 기능 제거 시 hook 본문이 아니라 preset만 바꿔도 안정적으로 조합할 수 있습니다.
 *
 * @param itemRegistry toolbar item key를 실제 section item으로 매핑한 레지스트리입니다.
 * @param preset 최종 toolbar 조합 규칙입니다. 생략 시 기본 preset을 사용합니다.
 * @returns preset 순서와 registry 존재 여부를 반영한 section 배열입니다.
 */
export const resolveMarkdownToolbarPresetSections = <TItem>({
  itemRegistry,
  preset = DEFAULT_MARKDOWN_TOOLBAR_PRESET,
}: {
  itemRegistry: Partial<Record<MarkdownToolbarPresetItemKey, TItem>>;
  preset?: MarkdownToolbarPresetSection[];
}): MarkdownToolbarResolvedSection<TItem>[] =>
  preset.map(section => ({
    items: section.itemKeys
      .map(itemKey => itemRegistry[itemKey])
      .filter((item): item is TItem => item !== undefined),
    key: section.key,
  }));

import type {
  ToolbarActionItem,
  ToolbarCustomItem,
  ToolbarSection,
  ToolbarSectionItem,
  ToolbarTokenOption,
} from '@/features/edit-markdown/model/markdown-toolbar.types';

type CreateMarkdownToolbarSectionsArgs = {
  blockSyntaxActions: ToolbarActionItem[];
  embedItems: ToolbarCustomItem[];
  headingPopover: React.ReactNode;
  highlightItems: ToolbarCustomItem[];
  inlineFormatActions: ToolbarActionItem[];
  textStructureActions: ToolbarActionItem[];
  togglePopover: React.ReactNode;
};

/**
 * token 기반 toolbar action 목록을 popover option 계약으로 변환합니다.
 *
 * @param actions token을 가진 toolbar action 목록입니다.
 * @returns token popover가 바로 사용할 수 있는 option 배열입니다.
 */
export const createToolbarTokenOptions = (actions: ToolbarActionItem[]): ToolbarTokenOption[] =>
  actions.map(action => ({
    key: action.key,
    label: action.label,
    onClick: action.onClick,
    token: action.token ?? '',
  }));

/**
 * 일반 toolbar action을 section item으로 감쌉니다.
 *
 * @param actions 같은 section에 배치할 toolbar action 목록입니다.
 * @returns toolbar section item 배열입니다.
 */
export const createToolbarActionItems = (actions: ToolbarActionItem[]): ToolbarSectionItem[] =>
  actions.map(action => ({
    action,
    key: action.key,
    type: 'action',
  }));

/**
 * custom node를 toolbar section item 계약으로 감쌉니다.
 *
 * @param key section item key입니다.
 * @param node toolbar 안에 바로 렌더링할 custom node입니다.
 * @returns custom toolbar section item입니다.
 */
export const createToolbarCustomItem = (key: string, node: React.ReactNode): ToolbarCustomItem => ({
  key,
  node,
  type: 'custom',
});

/**
 * markdown toolbar의 최종 section preset을 조립합니다.
 * 기능을 일부 제거하거나 순서를 바꿀 때는 이 함수의 입력만 교체하면 전체 hook 구조를 건드리지 않아도 됩니다.
 *
 * @param args 각 toolbar feature group과 custom trigger node 묶음입니다.
 * @returns 최종 toolbar section 배열입니다.
 */
export const createMarkdownToolbarSections = ({
  blockSyntaxActions,
  embedItems,
  headingPopover,
  highlightItems,
  inlineFormatActions,
  textStructureActions,
  togglePopover,
}: CreateMarkdownToolbarSectionsArgs): ToolbarSection[] => [
  {
    items: [
      createToolbarCustomItem('heading-popover', headingPopover),
      ...createToolbarActionItems(textStructureActions),
    ],
    key: 'heading-and-subtext',
  },
  {
    items: createToolbarActionItems(inlineFormatActions),
    key: 'text-emphasis',
  },
  {
    items: highlightItems,
    key: 'highlight-and-alignment',
  },
  {
    items: [
      ...createToolbarActionItems(blockSyntaxActions),
      createToolbarCustomItem('toggle-popover', togglePopover),
    ],
    key: 'block-syntax',
  },
  {
    items: embedItems,
    key: 'embed-and-media',
  },
];

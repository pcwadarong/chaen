import {
  type MarkdownToolbarPresetItemKey,
  type MarkdownToolbarPresetSection,
  resolveMarkdownToolbarPresetSections,
} from '@/entities/editor-core/model/toolbar-preset';
import type {
  ToolbarActionItem,
  ToolbarCustomItem,
  ToolbarSection,
  ToolbarSectionItem,
  ToolbarTokenOption,
} from '@/features/edit-markdown/model/markdown-toolbar.types';

type CreateMarkdownToolbarSectionsArgs = {
  itemRegistry: Partial<Record<MarkdownToolbarPresetItemKey, ToolbarSectionItem>>;
  preset?: MarkdownToolbarPresetSection[];
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
export const createToolbarCustomItem = (
  key: MarkdownToolbarPresetItemKey,
  node: React.ReactNode,
): ToolbarCustomItem => ({
  key,
  node,
  type: 'custom',
});

/**
 * markdown toolbar의 최종 section preset을 조립합니다.
 * hook은 action/custom node registry만 만들고, 실제 기능 노출 순서와 on/off는 core preset이 담당합니다.
 *
 * @param args toolbar item registry와 optional preset입니다.
 * @returns 최종 toolbar section 배열입니다.
 */
export const createMarkdownToolbarSections = ({
  itemRegistry,
  preset,
}: CreateMarkdownToolbarSectionsArgs): ToolbarSection[] =>
  resolveMarkdownToolbarPresetSections({
    itemRegistry,
    preset,
  });

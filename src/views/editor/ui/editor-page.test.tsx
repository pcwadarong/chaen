import { isValidElement, type ReactNode } from 'react';

import { EditorPage } from '@/views/editor/ui/editor-page';
import { createEmptyTranslations } from '@/widgets/editor/ui/core/editor-core.utils';

vi.mock('@/widgets/admin-console', () => ({
  AdminConsoleShell: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

describe('EditorPage', () => {
  it('client wrapper에 editor 초기 props를 전달한다', () => {
    const element = EditorPage({
      availableTags: [{ id: 'tag-1', label: '리액트', slug: 'react' }],
      contentType: 'article',
      hideAppFrameFooter: true,
      initialTranslations: createEmptyTranslations(),
    });

    expect(isValidElement(element)).toBe(true);
    expect(element.props.availableTags).toEqual([{ id: 'tag-1', label: '리액트', slug: 'react' }]);
    expect(element.props.contentType).toBe('article');
    expect(element.props.hideAppFrameFooter).toBe(true);
  });
});

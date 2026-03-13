import { isValidElement } from 'react';

import { EditorPage } from '@/views/editor/ui/editor-page';
import { createEmptyTranslations } from '@/widgets/editor/model/editor-core.utils';

describe('EditorPage', () => {
  it('client wrapper에 editor 초기 props를 전달한다', () => {
    const element = EditorPage({
      availableTags: [{ id: 'tag-1', label: '리액트', slug: 'react' }],
      contentType: 'article',
      initialTranslations: createEmptyTranslations(),
    });

    expect(isValidElement(element)).toBe(true);
    expect(element.props.availableTags).toEqual([{ id: 'tag-1', label: '리액트', slug: 'react' }]);
    expect(element.props.contentType).toBe('article');
  });
});

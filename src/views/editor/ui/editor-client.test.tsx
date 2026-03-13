import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';

import { EditorClient } from '@/views/editor/ui/editor-client';
import { createEmptyTranslations } from '@/widgets/editor/model/editor-core.utils';

import '@testing-library/jest-dom/vitest';

describe('EditorClient', () => {
  it('발행하기 버튼 클릭 시 publish panel을 연다', async () => {
    render(
      <EditorClient
        availableTags={[]}
        contentType="article"
        initialTranslations={createEmptyTranslations()}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: '발행하기' }));

    await waitFor(() => {
      expect(screen.getByRole('dialog', { name: '발행 설정' })).toBeTruthy();
    });
  });
});

import { render, screen } from '@testing-library/react';
import React from 'react';

import GuestLoading from '@/app/[locale]/guest/loading';

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => `Guest.${key}`,
}));

describe('GuestLoading', () => {
  it('방명록 전용 로딩 스켈레톤을 렌더링한다', () => {
    render(<GuestLoading />);

    expect(screen.getByRole('status')).toBeTruthy();
  });
});

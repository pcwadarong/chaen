import { render, screen } from '@testing-library/react';
import React from 'react';

import LocaleLoading from '@/app/[locale]/loading';

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => `Common.${key}`,
}));

describe('LocaleLoading', () => {
  it('개별 loading이 없는 라우트용 전역 fallback을 렌더링한다', () => {
    render(<LocaleLoading />);

    expect(screen.getByRole('status')).toBeTruthy();
  });
});

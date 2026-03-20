import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';

import GuestLoading from '@/app/[locale]/guest/loading';

vi.mock('next-intl/server', () => ({
  getTranslations: vi.fn(async () => (key: string) => `Guest.${key}`),
}));

describe('GuestLoading', () => {
  it('방명록 전용 로딩 스켈레톤을 렌더링한다', async () => {
    render(await GuestLoading());

    expect(screen.getByRole('status')).toBeTruthy();
  });
});

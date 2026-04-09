import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';

import { Tooltip } from '@/shared/ui/tooltip/tooltip';

describe('Tooltip', () => {
  it('tooltip을 document.body에 포털로 렌더링한다', async () => {
    render(
      <Tooltip content="링크">
        <button type="button">L</button>
      </Tooltip>,
    );

    fireEvent.focus(screen.getByRole('button', { name: 'L' }));

    const tooltip = await screen.findByRole('tooltip', { name: '링크' });

    expect(tooltip.parentElement).toBe(document.body);
  });

  it('portalClassName이 전달되면 tooltip 포털 요소 클래스에 병합되어야 한다', async () => {
    render(
      <Tooltip content="링크 복사" portalClassName="tooltip-portal-test">
        <button type="button">C</button>
      </Tooltip>,
    );

    const trigger = screen.getByRole('button', { name: 'C' });
    fireEvent.focus(trigger);

    const tooltip = await screen.findByRole('tooltip', { name: '링크 복사' });

    expect(tooltip.className).toContain('tooltip-portal-test');
  });
});

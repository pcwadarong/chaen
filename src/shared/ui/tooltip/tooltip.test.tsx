import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';

import { Tooltip } from '@/shared/ui/tooltip/tooltip';

describe('Tooltip', () => {
  it('focus 시 tooltip을 열고 trigger를 aria-describedby로 연결한다', async () => {
    render(
      <Tooltip content="굵게">
        <button type="button">B</button>
      </Tooltip>,
    );

    const trigger = screen.getByRole('button', { name: 'B' });
    fireEvent.focus(trigger);

    const tooltip = await screen.findByRole('tooltip', { name: '굵게' });

    expect(trigger.getAttribute('aria-describedby')).toBe(tooltip.id);
  });

  it('blur 시 tooltip을 닫는다', async () => {
    render(
      <Tooltip content="기울임">
        <button type="button">I</button>
      </Tooltip>,
    );

    const trigger = screen.getByRole('button', { name: 'I' });
    fireEvent.focus(trigger);
    await screen.findByRole('tooltip', { name: '기울임' });

    fireEvent.blur(trigger);

    await waitFor(() => {
      expect(screen.queryByRole('tooltip', { name: '기울임' })).toBeNull();
    });
  });

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
});

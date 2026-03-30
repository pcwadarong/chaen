'use client';

import React, { useState } from 'react';
import { css } from 'styled-system/css';

import { Button } from '@/shared/ui/button/button';
import { type ClosePopover, Popover } from '@/shared/ui/popover/popover';
import { Textarea } from '@/shared/ui/textarea/textarea';

type MathEmbedPopoverProps = {
  onApply: (formula: string, isBlock: boolean, closePopover?: ClosePopover) => void;
  onTriggerMouseDown?: React.MouseEventHandler<HTMLButtonElement>;
  triggerClassName?: string;
};

/**
 * toolbar 내부에서 LaTeX 수식을 입력받아 inline/block 문법으로 삽입하는 팝오버입니다.
 */
export const MathEmbedPopover = ({
  onApply,
  onTriggerMouseDown,
  triggerClassName,
}: MathEmbedPopoverProps) => {
  const [mathInput, setMathInput] = useState('');

  const handleApply = (isBlock: boolean, closePopover?: ClosePopover) => {
    const normalizedInput = mathInput.trim();
    if (!normalizedInput) return;

    onApply(normalizedInput, isBlock, closePopover);
    setMathInput('');
  };

  return (
    <Popover
      onTriggerMouseDown={onTriggerMouseDown}
      panelLabel="수학 공식 삽입"
      portalPlacement="start"
      renderInPortal
      triggerAriaLabel="수학 공식"
      triggerClassName={triggerClassName}
      triggerContent={<span className={triggerTokenClass}>fx</span>}
      triggerTooltip="수학 공식"
    >
      {({ closePopover }) => (
        <div className={popoverContentClass}>
          <Textarea
            aria-label="LaTeX 수식"
            autoResize={false}
            onChange={event => setMathInput(event.target.value)}
            onMouseDown={event => event.stopPropagation()}
            placeholder={
              '\\frac{a}{b} 또는 \\begin{cases} x, &x \\ge 0 \\\\ -x, &x < 0 \\end{cases}'
            }
            rows={4}
            value={mathInput}
          />
          <div className={actionRowClass}>
            <Button onClick={() => handleApply(false, closePopover)}>인라인</Button>
            <Button onClick={() => handleApply(true, closePopover)}>블록</Button>
          </div>
        </div>
      )}
    </Popover>
  );
};

const popoverContentClass = css({
  display: 'grid',
  gap: '3',
  minWidth: '[20rem]',
});

const actionRowClass = css({
  display: 'flex',
  gap: '2',
  justifyContent: 'flex-end',
  flexWrap: 'wrap',
});

const triggerTokenClass = css({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  minWidth: '7',
  fontSize: 'xs',
  fontWeight: 'bold',
  letterSpacing: '[-0.02em]',
});

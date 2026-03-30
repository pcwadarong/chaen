import React, { type ReactNode } from 'react';
import { css, cx } from 'styled-system/css';

type AdminTableProps = {
  children: ReactNode;
  className?: string;
  tableClassName?: string;
};

/**
 * 관리자 화면에서 재사용하는 compact 표 프레임을 렌더링합니다.
 */
export const AdminTable = ({ children, className, tableClassName }: AdminTableProps) => (
  <div className={cx(frameClass, className)}>
    <table className={cx(tableClass, tableClassName)}>{children}</table>
  </div>
);

const frameClass = css({
  width: 'full',
  overflowX: 'auto',
  border: '[1px solid var(--colors-border)]',
  borderRadius: '2xl',
  background: 'surface',
});

const tableClass = css({
  width: 'full',
  borderCollapse: 'collapse',
  '& th, & td': {
    px: '3',
    py: '3',
    borderBottom: '[1px solid var(--colors-border-subtle)]',
    textAlign: 'left',
    verticalAlign: 'middle',
  },
  '& th': {
    color: 'muted',
    fontSize: 'xs',
    fontWeight: 'semibold',
    letterSpacing: '[0.04em]',
    textTransform: 'uppercase',
  },
  '& tbody tr:last-child td': {
    borderBottom: 'none',
  },
});

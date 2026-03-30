import React from 'react';
import { css, cx } from 'styled-system/css';

import { ArrowUpIcon } from '@/shared/ui/icons/app-icons';

type CollapsiblePanelHeaderProps = {
  headerClassName?: string;
  className?: string;
  isCollapsed: boolean;
  onToggle: () => void;
  title: React.ReactNode;
  titleId?: string;
};

/**
 * 패널 제목과 접기/펼치기 토글 버튼을 함께 렌더링하는 공통 헤더 컴포넌트입니다.
 *
 * `isCollapsed`는 현재 패널 본문이 접혀 있는지 여부를 나타내는 boolean 값입니다.
 * `onToggle`은 사용자가 토글 버튼을 눌렀을 때 호출되는 콜백이며, 상태 변경은 호출자가 관리합니다.
 * `title`은 패널 제목으로 표시할 React 노드이며 문자열, JSX, 강조 텍스트 등을 모두 받을 수 있습니다.
 * `className`은 제목 `<h3>`에 추가로 합성할 스타일 클래스이고, `headerClassName`은 바깥 `<header>` 영역에 합성할 클래스입니다.
 * `titleId`를 넘기면 `<h3>`의 `id`로 연결되어 상위 `section`의 `aria-labelledby`에 사용할 수 있습니다.
 *
 * 접근성 측면에서 토글 버튼은 항상 `aria-expanded`를 통해 현재 펼침 상태를 노출합니다.
 * 기본 `<button type="button">`을 사용하므로 Tab, Enter, Space 기반 키보드 조작과 스크린리더 읽기 흐름을 그대로 따릅니다.
 *
 * 예:
 * `<CollapsiblePanelHeader isCollapsed={false} onToggle={toggle} title="PDF 로그" />`
 *
 * 이 컴포넌트는 부수 효과 없이 JSX만 반환합니다.
 */
export const CollapsiblePanelHeader = ({
  headerClassName,
  className,
  isCollapsed,
  onToggle,
  title,
  titleId,
}: CollapsiblePanelHeaderProps) => (
  <header className={cx(rootClass, headerClassName)}>
    <h3 className={cx(titleClass, className)} id={titleId}>
      {title}
    </h3>
    <button
      aria-expanded={!isCollapsed}
      className={toggleButtonClass}
      onClick={onToggle}
      type="button"
    >
      <span>{isCollapsed ? '열기' : '닫기'}</span>
      <ArrowUpIcon
        aria-hidden
        className={isCollapsed ? toggleIconCollapsedClass : toggleIconClass}
        color="muted"
        size="sm"
      />
    </button>
  </header>
);

const rootClass = css({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
});

const titleClass = css({
  margin: '0',
  fontSize: 'lg',
  lineHeight: 'tight',
});

const toggleButtonClass = css({
  display: 'inline-flex',
  alignItems: 'center',
  gap: '1.5',
  fontSize: 'sm',
  color: 'muted',
  _focusVisible: {
    outline: '[2px solid var(--colors-focus-ring)]',
    outlineOffset: '[2px]',
  },
});

const toggleIconClass = css({
  transition: 'transform',
});

const toggleIconCollapsedClass = css({
  transition: 'transform',
  transform: 'rotate(180deg)',
});

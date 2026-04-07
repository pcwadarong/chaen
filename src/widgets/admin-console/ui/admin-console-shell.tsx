'use client';

import Link from 'next/link';
import React, {
  type CSSProperties,
  type ReactNode,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { css, cva } from 'styled-system/css';

import { AdminSignOutButton } from '@/features/admin-session';
import {
  buildGlobalNavDockedPaddingTopValue,
  buildGlobalNavDockedTopValue,
  buildGlobalNavHeightVar,
  GLOBAL_NAV_DOCKED_TOP_CSS_VAR,
  GLOBAL_NAV_HEIGHT_CSS_VAR,
} from '@/shared/lib/dom/global-nav-layout-vars';
import {
  adminConsoleNavigationItems,
  type AdminConsoleSection,
} from '@/widgets/admin-console/model/navigation-config';

type AdminConsoleShellProps = {
  action?: ReactNode;
  activeSection: AdminConsoleSection;
  children: ReactNode;
  description?: ReactNode;
  signOutRedirectPath: string;
  summary?: ReactNode;
  title: ReactNode;
};

const ADMIN_MOBILE_NAV_HEIGHT_CSS_VAR = '--admin-mobile-nav-height';
const buildAdminMobileNavHeightVar = () => `var(${ADMIN_MOBILE_NAV_HEIGHT_CSS_VAR}, 0px)`;
const buildAdminMobileNavDockedTopValue = () =>
  `calc(${buildGlobalNavDockedTopValue()} + ${buildAdminMobileNavHeightVar()})`;
const buildAdminMobileWorkspacePaddingTopValue = (extraOffset = '0rem') =>
  `calc(${buildAdminMobileNavHeightVar()} + ${extraOffset})`;

/**
 * 관리자 전용 풀폭 작업 레이아웃과 좌측 사이드바를 제공합니다.
 */
export const AdminConsoleShell = ({
  action,
  activeSection,
  children,
  description,
  signOutRedirectPath,
  summary,
  title,
}: AdminConsoleShellProps) => {
  const hasHeaderContent = Boolean(title || description || action);
  const [mobileNavTop, setMobileNavTop] = useState<string>(() => buildGlobalNavHeightVar());
  const [mobileNavHeight, setMobileNavHeight] = useState('0px');
  const mobileNavRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const root = document.documentElement;

    const syncMobileNavTop = () => {
      const computedStyle = window.getComputedStyle(root);
      const nextTop =
        computedStyle.getPropertyValue(GLOBAL_NAV_DOCKED_TOP_CSS_VAR).trim() ||
        computedStyle.getPropertyValue(GLOBAL_NAV_HEIGHT_CSS_VAR).trim() ||
        '0px';

      setMobileNavTop(currentTop => (currentTop === nextTop ? currentTop : nextTop));
    };

    syncMobileNavTop();

    const observer = new MutationObserver(syncMobileNavTop);
    observer.observe(root, {
      attributeFilter: ['style'],
      attributes: true,
    });
    window.addEventListener('resize', syncMobileNavTop);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', syncMobileNavTop);
    };
  }, []);

  useEffect(() => {
    const mobileNavElement = mobileNavRef.current;

    if (!mobileNavElement || typeof window === 'undefined') return;

    const syncMobileNavHeight = () => {
      const nextHeight = `${mobileNavElement.offsetHeight}px`;
      setMobileNavHeight(currentHeight =>
        currentHeight === nextHeight ? currentHeight : nextHeight,
      );
    };

    syncMobileNavHeight();

    const resizeObserver = new ResizeObserver(syncMobileNavHeight);
    resizeObserver.observe(mobileNavElement);
    window.addEventListener('resize', syncMobileNavHeight);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', syncMobileNavHeight);
    };
  }, []);

  const shellStyle = useMemo(
    () =>
      ({
        [ADMIN_MOBILE_NAV_HEIGHT_CSS_VAR]: mobileNavHeight,
      }) as CSSProperties,
    [mobileNavHeight],
  );
  const mobileNavStyle = useMemo(() => ({ top: mobileNavTop }), [mobileNavTop]);

  return (
    <main className={shellClass} style={shellStyle}>
      <div className={mobileNavShellClass} ref={mobileNavRef} style={mobileNavStyle}>
        <nav aria-label="관리자 섹션" className={mobileNavClass}>
          {adminConsoleNavigationItems.map(item => (
            <Link
              aria-current={item.section === activeSection ? 'page' : undefined}
              className={mobileNavItemClass({ active: item.section === activeSection })}
              href={item.href}
              key={`mobile-${item.href}`}
            >
              {item.label}
            </Link>
          ))}
          <AdminSignOutButton redirectPath={signOutRedirectPath} />
        </nav>
      </div>
      <aside className={sidebarClass}>
        <nav aria-label="관리자 섹션" className={navClass}>
          {adminConsoleNavigationItems.map(item => (
            <Link
              aria-current={item.section === activeSection ? 'page' : undefined}
              className={navItemClass({ active: item.section === activeSection })}
              href={item.href}
              key={item.href}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className={sidebarFooterClass}>
          <AdminSignOutButton redirectPath={signOutRedirectPath} />
        </div>
      </aside>
      <section
        className={workspaceClass({ condensedTop: !hasHeaderContent })}
        data-app-scroll-viewport="true"
      >
        {hasHeaderContent ? (
          <header className={workspaceHeaderClass}>
            <div className={workspaceHeadlineClass}>
              {title ? <h1 className={workspaceTitleClass}>{title}</h1> : null}
              {description ? <p className={workspaceDescriptionClass}>{description}</p> : null}
            </div>
            {action ? <div className={workspaceActionClass}>{action}</div> : null}
          </header>
        ) : null}
        {summary ? <section className={summaryWrapClass}>{summary}</section> : null}
        <section className={contentWrapClass}>{children}</section>
      </section>
    </main>
  );
};

const shellClass = css({
  display: 'grid',
  gap: '0',
  width: 'full',
  minHeight: '0',
  alignItems: 'stretch',
  px: '5',
  gridTemplateColumns: '[16rem minmax(0, 1fr)]',
  paddingTop: '0',
  _desktopUp: {
    flex: '[1 1 auto]',
    height: 'auto',
    minHeight: '0',
    overflow: 'hidden',
  },
  _tabletDown: {
    px: '4',
    py: '0',
    gridTemplateColumns: '1fr',
    paddingTop: `[${buildGlobalNavDockedPaddingTopValue('0.1rem')}]`,
    paddingBottom: '8',
    transitionProperty: '[padding-top]',
    transitionDuration: '[240ms]',
    transitionTimingFunction: '[ease]',
  },
});

const mobileNavShellClass = css({
  display: 'none',
  position: 'fixed',
  top: '0',
  left: '0',
  right: '0',
  zIndex: '9',
  borderBottom: '[1px solid var(--colors-border)]',
  backgroundColor: '[color-mix(in srgb, var(--colors-surface) 92%, transparent)]',
  backdropFilter: '[blur(14px)]',
  boxShadow: '[0 14px 32px rgba(15,23,42,0.08)]',
  willChange: 'top, background-color, box-shadow',
  transitionProperty: '[top, background-color, box-shadow]',
  transitionDuration: '[240ms]',
  transitionTimingFunction: '[ease]',
  _dark: {
    boxShadow: '[0 14px 32px rgba(0,0,0,0.32)]',
  },
  _tabletDown: {
    display: 'block',
  },
});

const mobileNavClass = css({
  display: 'flex',
  gap: '5',
  overflowX: 'auto',
  overscrollBehaviorX: 'contain',
  whiteSpace: 'nowrap',
  px: '4',
  py: '3',
  '&::-webkit-scrollbar': {
    display: 'none',
  },
});

const mobileNavItemClass = cva({
  base: {
    display: 'inline-flex',
    alignItems: 'center',
    minHeight: '8',
    whiteSpace: 'nowrap',
    color: 'muted',
    textDecoration: 'none',
    _focusVisible: {
      outline: '[2px solid var(--colors-focus-ring)]',
      outlineOffset: '[2px]',
    },
  },
  variants: {
    active: {
      true: {
        color: 'primary',
        fontWeight: 'semibold',
      },
      false: {
        _hover: {
          color: 'primary',
        },
      },
    },
  },
});

const sidebarClass = css({
  display: 'grid',
  alignContent: 'start',
  gap: '5',
  pt: '5',
  pr: '5',
  mr: '5',
  borderRight: '[1px solid var(--colors-border)]',
  alignSelf: 'stretch',
  minHeight: '0',
  height: 'full',
  overflowY: 'auto',
  overscrollBehaviorY: 'contain',
  scrollbarGutter: 'stable',
  _tabletDown: {
    display: 'none',
  },
});

const navClass = css({
  display: 'grid',
  gap: '2',
});

const navItemClass = cva({
  base: {
    display: 'flex',
    alignItems: 'center',
    minHeight: '9',
    px: '0',
    color: 'muted',
    transition: 'common',
    textDecoration: 'none',
    _focusVisible: {
      outline: '[2px solid var(--colors-focus-ring)]',
      outlineOffset: '[2px]',
    },
  },
  variants: {
    active: {
      true: {
        color: 'primary',
        fontWeight: 'semibold',
      },
      false: {
        _hover: {
          color: 'primary',
        },
      },
    },
  },
});

const sidebarFooterClass = css({
  display: 'flex',
  justifyContent: 'flex-start',
  marginTop: 'auto',
  paddingTop: '6',
});

const workspaceClass = cva({
  base: {
    display: 'grid',
    alignContent: 'start',
    gap: '4',
    minWidth: '0',
    minHeight: '0',
    height: 'full',
    overflowY: 'auto',
    overscrollBehaviorY: 'contain',
    scrollbarGutter: 'stable',
    _tabletDown: {
      height: 'auto',
      overflowY: 'visible',
      overscrollBehaviorY: 'auto',
      scrollbarGutter: 'auto',
      paddingTop: `[${buildAdminMobileWorkspacePaddingTopValue('1rem')}]`,
    },
  },
  variants: {
    condensedTop: {
      false: {},
      true: {
        paddingTop: '5',
        _tabletDown: {
          paddingTop: `[${buildAdminMobileWorkspacePaddingTopValue('1rem')}]`,
        },
      },
    },
  },
  defaultVariants: {
    condensedTop: false,
  },
});

const workspaceHeaderClass = css({
  display: 'grid',
  gridTemplateColumns: '[minmax(0,1fr) auto]',
  gap: '4',
  alignItems: 'start',
  position: 'sticky',
  top: '0',
  zIndex: '4',
  backgroundColor: 'surface',
  paddingTop: '6',
  paddingBottom: '4',
  transitionProperty: '[top, padding-top]',
  transitionDuration: '[240ms]',
  transitionTimingFunction: '[ease]',
  _tabletDown: {
    position: 'sticky',
    top: `[${buildAdminMobileNavDockedTopValue()}]`,
    paddingTop: '5',
    paddingBottom: '3',
  },
});

const workspaceHeadlineClass = css({
  display: 'grid',
  gap: '2',
});

const workspaceTitleClass = css({
  m: '0',
  fontSize: '4xl',
  lineHeight: 'none',
  letterSpacing: '[-0.04em]',
});

const workspaceDescriptionClass = css({
  m: '0',
  color: 'muted',
});

const workspaceActionClass = css({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'flex-end',
  gap: '2',
  minWidth: '0',
  flexWrap: 'wrap',
  _desktopDown: {
    flexWrap: 'nowrap',
  },
});

const summaryWrapClass = css({
  display: 'grid',
  gap: '3',
});

const contentWrapClass = css({
  display: 'grid',
  gap: '3',
  minWidth: '0',
});

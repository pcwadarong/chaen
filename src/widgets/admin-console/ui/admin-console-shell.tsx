import React, { type ReactNode } from 'react';
import { css, cva } from 'styled-system/css';

import { AdminSignOutButton, buildAdminPath } from '@/features/admin-session';
import { Link } from '@/i18n/navigation';

type AdminConsoleSection = 'content' | 'dashboard' | 'drafts' | 'photo' | 'resume';

type AdminConsoleShellProps = {
  action?: ReactNode;
  activeSection: AdminConsoleSection;
  children: ReactNode;
  description?: ReactNode;
  locale: string;
  summary?: ReactNode;
  title: ReactNode;
};

const adminNavItems: Array<{
  href: string;
  label: string;
  section: AdminConsoleSection;
}> = [
  { href: '/admin', label: 'Dashboard', section: 'dashboard' },
  { href: '/admin/content', label: 'Content', section: 'content' },
  { href: '/admin/photo', label: 'Photo', section: 'photo' },
  { href: '/admin/resume/edit', label: 'Resume', section: 'resume' },
  { href: '/admin/drafts', label: 'Drafts', section: 'drafts' },
];

/**
 * 관리자 전용 풀폭 작업 레이아웃과 좌측 사이드바를 제공합니다.
 */
export const AdminConsoleShell = ({
  action,
  activeSection,
  children,
  description,
  locale,
  summary,
  title,
}: AdminConsoleShellProps) => {
  const hasHeaderContent = Boolean(title || description || action);

  return (
    <main className={shellClass}>
      <div className={mobileNavShellClass}>
        <nav aria-label="관리자 섹션" className={mobileNavClass}>
          {adminNavItems.map(item => (
            <Link
              aria-current={item.section === activeSection ? 'page' : undefined}
              className={mobileNavItemClass({ active: item.section === activeSection })}
              href={item.href}
              key={`mobile-${item.href}`}
            >
              {item.label}
            </Link>
          ))}
          <AdminSignOutButton redirectPath={buildAdminPath({ locale, section: 'login' })} />
        </nav>
      </div>
      <aside className={sidebarClass}>
        <nav aria-label="관리자 섹션" className={navClass}>
          {adminNavItems.map(item => (
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
          <AdminSignOutButton redirectPath={buildAdminPath({ locale, section: 'login' })} />
        </div>
      </aside>
      <section className={workspaceClass({ condensedTop: !hasHeaderContent })}>
        {hasHeaderContent ? (
          <header className={workspaceHeaderClass}>
            <div className={workspaceHeadlineClass}>
              {title ? <h2 className={workspaceTitleClass}>{title}</h2> : null}
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
  minHeight: '[calc(100dvh - 5.5625rem)]',
  alignItems: 'stretch',
  px: '5',
  py: '5',
  gridTemplateColumns: '[16rem minmax(0, 1fr)]',
  paddingTop: '0',
  _tabletDown: {
    px: '4',
    py: '0',
    gridTemplateColumns: '1fr',
    paddingTop: '[calc(var(--global-nav-height, 0px) + var(--global-nav-offset, 0px) + 0.1rem)]',
    paddingBottom: '8',
  },
});

const mobileNavShellClass = css({
  display: 'none',
  position: 'fixed',
  top: '[calc(var(--global-nav-height, 0px) + var(--global-nav-offset, 0px))]',
  left: '0',
  right: '0',
  zIndex: '9',
  borderBottom: '[1px solid var(--colors-border)]',
  background: '[rgba(255,255,255,0.92)]',
  backdropFilter: '[blur(14px)]',
  boxShadow: '[0 14px 32px rgba(15,23,42,0.08)]',
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
  py: '5',
  pr: '5',
  mr: '5',
  borderRight: '[1px solid var(--colors-border)]',
  position: 'sticky',
  top: '0',
  alignSelf: 'stretch',
  minHeight: 'full',
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
  },
  variants: {
    condensedTop: {
      false: {},
      true: {
        paddingTop: '5',
        _tabletDown: {
          paddingTop: '4',
        },
      },
    },
  },
});

const workspaceHeaderClass = css({
  display: 'grid',
  gridTemplateColumns: '[minmax(0,1fr) auto]',
  gap: '4',
  alignItems: 'start',
  paddingTop: '6',
  paddingBottom: '4',
  _tabletDown: {
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

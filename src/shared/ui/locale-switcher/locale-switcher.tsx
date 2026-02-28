'use client';

import { useSearchParams } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import type { CSSProperties } from 'react';
import { useMemo, useTransition } from 'react';

import { usePathname, useRouter } from '@/i18n/navigation';
import { type AppLocale, routing } from '@/i18n/routing';
import { SwitcherPopover } from '@/shared/ui/switcher-popover/switcher-popover';

/**
 * 현재 경로를 유지한 채 locale을 전환하는 세그먼트형 스위처입니다.
 */
export const LocaleSwitcher = () => {
  const t = useTranslations('Switchers.locale');
  const locale = useLocale() as AppLocale;
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const href = useMemo(() => {
    const query = searchParams?.toString() ?? '';

    return query ? `${pathname}?${query}` : pathname;
  }, [pathname, searchParams]);

  /**
   * 현재 경로를 유지하면서 locale만 교체합니다.
   */
  const handleLocaleChange = (nextLocale: AppLocale, closePopover: () => void) => {
    if (nextLocale === locale) {
      closePopover();
      return;
    }

    startTransition(() => {
      router.replace(href, { locale: nextLocale });
    });

    closePopover();
  };

  return (
    <SwitcherPopover label={t('label')} panelLabel={t('ariaLabel')} value={t(locale)}>
      {({ closePopover }) => (
        <div aria-busy={isPending} style={listStyle}>
          {routing.locales.map(option => {
            const isActive = locale === option;

            return (
              <button
                aria-pressed={isActive}
                disabled={isPending}
                key={option}
                onClick={() => handleLocaleChange(option, closePopover)}
                style={{
                  ...optionStyle,
                  ...(isActive ? optionActiveStyle : null),
                }}
                type="button"
              >
                <span style={optionCodeStyle}>{option.toUpperCase()}</span>
                <span>{t(option)}</span>
              </button>
            );
          })}
        </div>
      )}
    </SwitcherPopover>
  );
};

const listStyle: CSSProperties = {
  display: 'grid',
  gap: '0.2rem',
};

const optionStyle: CSSProperties = {
  minHeight: '2.8rem',
  width: '100%',
  padding: '0.7rem 0.8rem',
  borderRadius: 'var(--radius-sm)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '0.75rem',
  fontSize: '0.92rem',
  color: 'rgb(var(--color-text))',
  backgroundColor: 'transparent',
  transition: 'background-color 160ms ease, color 160ms ease',
};

const optionActiveStyle: CSSProperties = {
  backgroundColor: 'rgb(var(--color-text))',
  color: 'rgb(var(--color-bg))',
};

const optionCodeStyle: CSSProperties = {
  fontSize: '0.76rem',
  fontWeight: 700,
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
};

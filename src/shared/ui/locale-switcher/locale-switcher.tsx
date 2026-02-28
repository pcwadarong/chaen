'use client';

import { useSearchParams } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import type { CSSProperties } from 'react';
import { useMemo, useTransition } from 'react';

import { usePathname, useRouter } from '@/i18n/navigation';
import { type AppLocale, routing } from '@/i18n/routing';

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
  const handleLocaleChange = (nextLocale: AppLocale) => {
    if (nextLocale === locale) {
      return;
    }

    startTransition(() => {
      router.replace(href, { locale: nextLocale });
    });
  };

  return (
    <div aria-label={t('ariaLabel')} role="group" style={switcherStyle}>
      <span style={labelStyle}>{t('label')}</span>
      <div aria-busy={isPending} style={optionGroupStyle}>
        {routing.locales.map(option => {
          const isActive = locale === option;

          return (
            <button
              aria-pressed={isActive}
              disabled={isPending}
              key={option}
              onClick={() => handleLocaleChange(option)}
              style={{
                ...optionStyle,
                ...(isActive ? optionActiveStyle : null),
              }}
              type="button"
            >
              {option.toUpperCase()}
            </button>
          );
        })}
      </div>
    </div>
  );
};

const switcherStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '0.5rem',
  flexWrap: 'wrap',
};

const labelStyle: CSSProperties = {
  fontSize: '0.78rem',
  fontWeight: 700,
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
  color: 'rgb(var(--color-muted))',
};

const optionGroupStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '0.25rem',
  padding: '0.25rem',
  borderRadius: 'var(--radius-pill)',
  border: '1px solid rgb(var(--color-border) / 0.7)',
  backgroundColor: 'rgb(var(--color-surface) / 0.86)',
};

const optionStyle: CSSProperties = {
  minHeight: '2.2rem',
  minWidth: '3.1rem',
  padding: '0 0.75rem',
  borderRadius: 'var(--radius-pill)',
  fontSize: '0.84rem',
  fontWeight: 700,
  letterSpacing: '0.08em',
  color: 'rgb(var(--color-muted))',
  transition: 'background-color 160ms ease, color 160ms ease',
};

const optionActiveStyle: CSSProperties = {
  backgroundColor: 'rgb(var(--color-text))',
  color: 'rgb(var(--color-bg))',
};

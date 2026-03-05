'use client';

import { css } from '@emotion/react';
import { useSearchParams } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { useMemo, useTransition } from 'react';

import { usePathname, useRouter } from '@/i18n/navigation';
import { type AppLocale, routing } from '@/i18n/routing';
import { SwitcherPopover } from '@/shared/ui/switcher-popover/switcher-popover';

/**
 * 현재 경로를 유지한 채 locale을 전환하는 팝오버형 스위처입니다.
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
        <div aria-busy={isPending} css={listStyle}>
          {routing.locales.map(option => {
            const isActive = locale === option;

            return (
              <button
                aria-pressed={isActive}
                disabled={isPending}
                key={option}
                onClick={() => handleLocaleChange(option, closePopover)}
                css={[optionStyle, isActive && optionActiveStyle]}
                type="button"
              >
                <span css={optionCodeStyle}>{option.toUpperCase()}</span>
                <span>{t(option)}</span>
              </button>
            );
          })}
        </div>
      )}
    </SwitcherPopover>
  );
};

const listStyle = css`
  display: grid;
  gap: 0.2rem;
`;

const optionStyle = css`
  min-height: 2.8rem;
  width: 100%;
  padding: 0.7rem 0.8rem;
  border-radius: var(--radius-sm);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  font-size: 0.92rem;
  color: rgb(var(--color-text));
  background-color: transparent;
  transition:
    background-color 160ms ease,
    color 160ms ease;
`;

const optionActiveStyle = css`
  background-color: rgb(var(--color-text));
  color: rgb(var(--color-bg));
`;

const optionCodeStyle = css`
  font-size: 0.76rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
`;

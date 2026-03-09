'use client';

import { useSearchParams } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { useMemo, useTransition } from 'react';
import { css } from 'styled-system/css';

import { usePathname, useRouter } from '@/i18n/navigation';
import { type AppLocale, routing } from '@/i18n/routing';
import { Button } from '@/shared/ui/button/button';
import { SwitcherPopover } from '@/shared/ui/switcher-popover/switcher-popover';

const headerLocaleCodeMap: Partial<Record<AppLocale, string>> = {
  en: 'EN',
  fr: 'FR',
  ja: 'JA',
  ko: 'KO',
};

/**
 * 헤더 트리거에 표시할 locale 약어 코드를 반환합니다.
 */
const getHeaderLocaleCode = (locale: AppLocale) =>
  headerLocaleCodeMap[locale] ?? locale.toUpperCase();

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
    <SwitcherPopover
      label={t('label')}
      panelLabel={t('ariaLabel')}
      triggerContent={<span className={triggerCodeClass}>{getHeaderLocaleCode(locale)}</span>}
    >
      {({ closePopover }) => (
        <div aria-busy={isPending} className={listClass}>
          {routing.locales.map(option => {
            const isActive = locale === option;

            return (
              <Button
                aria-pressed={isActive}
                className={optionClass}
                disabled={isPending}
                key={option}
                onClick={() => handleLocaleChange(option, closePopover)}
                tone={isActive ? 'black' : 'white'}
                type="button"
                variant={isActive ? 'solid' : 'ghost'}
              >
                <span className={optionCodeClass}>{option.toUpperCase()}</span>
                <span>{t(option)}</span>
              </Button>
            );
          })}
        </div>
      )}
    </SwitcherPopover>
  );
};

const listClass = css({
  display: 'grid',
  gap: '1',
});

const optionCodeClass = css({
  fontSize: 'xs',
  fontWeight: 'bold',
  letterSpacing: '[0.12em]',
  textTransform: 'uppercase',
  marginRight: '3',
});

const triggerCodeClass = css({
  fontSize: 'md',
  fontWeight: 'semibold',
  letterSpacing: '[0.05em]',
});

const optionClass = css({
  width: 'full',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '3',
});

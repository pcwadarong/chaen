import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';
import type { ReactNode } from 'react';

import { isValidLocale, routing } from '@/i18n/routing';
import { ThemeProvider } from '@/shared/providers';
import { GlobalNav } from '@/widgets/global-nav/ui/global-nav';

import { d2Coding, pretendard, pretendardJp } from '../fonts';

import '../globals.css';

export const metadata: Metadata = {
  title: {
    default: 'chaen',
    template: '%s | chaen',
  },
  description: 'Frontend workspace for main, guest, blog, and work pages.',
};

/**
 * 정적 locale 세그먼트를 미리 생성합니다.
 */
export const generateStaticParams = () => routing.locales.map(locale => ({ locale }));

type LocaleLayoutProps = Readonly<{
  children: ReactNode;
  params: Promise<{
    locale: string;
  }>;
}>;

/**
 * locale별 루트 레이아웃입니다.
 */
const LocaleLayout = async ({ children, params }: LocaleLayoutProps) => {
  const { locale } = await params;

  if (!locale || !isValidLocale(locale)) {
    notFound();
  }

  setRequestLocale(locale);

  const messages = await getMessages({ locale });

  return (
    <html
      className={`${pretendard.variable} ${pretendardJp.variable} ${d2Coding.variable}`}
      lang={locale}
      suppressHydrationWarning
    >
      <body>
        <NextIntlClientProvider locale={locale} messages={messages}>
          <ThemeProvider>
            <GlobalNav />
            {children}
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
};

export default LocaleLayout;

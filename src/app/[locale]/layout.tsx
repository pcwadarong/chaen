import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';
import type { ReactNode } from 'react';

import { isValidLocale, routing } from '@/i18n/routing';
import { getServerAuthState } from '@/shared/lib/auth/get-server-auth-state';
import { AuthProvider, ThemeProvider } from '@/shared/providers';
import { AppFrame } from '@/widgets/app-frame/app-frame';
import { GlobalNav } from '@/widgets/global-nav/ui/global-nav';

export const metadata: Metadata = {
  title: {
    default: 'chaen',
    template: '%s | chaen',
  },
  description: 'Frontend workspace for main, guest, articles, and project pages.',
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

  if (!locale || !isValidLocale(locale)) notFound();

  setRequestLocale(locale);

  const messages = await getMessages({ locale });
  const authState = await getServerAuthState();

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <ThemeProvider>
        <AuthProvider value={authState}>
          <div lang={locale}>
            <AppFrame>
              <GlobalNav />
              {children}
            </AppFrame>
          </div>
        </AuthProvider>
      </ThemeProvider>
    </NextIntlClientProvider>
  );
};

export default LocaleLayout;

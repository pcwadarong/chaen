import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { type ReactNode, Suspense } from 'react';

import { ADMIN_LOCALE } from '@/features/admin-session/model/admin-path';
import { getSupabaseAdminEnvOptional } from '@/shared/lib/supabase/config';
import { AuthProvider, ThemeProvider } from '@/shared/providers';
import { RouteAwareAppFrame } from '@/widgets/app-frame/ui/route-aware-app-frame';
import { GlobalNav } from '@/widgets/global-nav/ui/global-nav';

type AdminLayoutProps = Readonly<{
  children: ReactNode;
}>;

const navFallbackStyle = {
  minHeight: '5.5625rem',
  width: '100%',
} as const;

/**
 * 관리자 전용 non-localized 레이아웃입니다.
 * 관리자 UI 텍스트만 한국어 메시지 번들로 고정 공급합니다.
 */
const AdminLayout = async ({ children }: AdminLayoutProps) => {
  const messages = await getMessages({ locale: ADMIN_LOCALE });
  const { adminUserId } = getSupabaseAdminEnvOptional();

  return (
    <NextIntlClientProvider locale={ADMIN_LOCALE} messages={messages}>
      <ThemeProvider>
        <AuthProvider adminUserId={adminUserId}>
          <div lang={ADMIN_LOCALE}>
            <RouteAwareAppFrame
              nav={
                <Suspense fallback={<div aria-hidden style={navFallbackStyle} />}>
                  <GlobalNav />
                </Suspense>
              }
            >
              {children}
            </RouteAwareAppFrame>
          </div>
        </AuthProvider>
      </ThemeProvider>
    </NextIntlClientProvider>
  );
};

export default AdminLayout;

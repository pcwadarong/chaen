import type { Metadata } from 'next';
import type { ReactNode } from 'react';

import { d2Coding, pretendard, pretendardJp } from './fonts';

import './globals.css';

export const metadata: Metadata = {
  verification: {
    google: 'rblhpthEHMjnCUXO4X7CsGUhLuENAPIs9Q7tA7HtHF8',
  },
};

type RootLayoutProps = Readonly<{
  children: ReactNode;
}>;

/**
 * 앱 전체를 감싸는 루트 레이아웃입니다.
 */
const RootLayout = ({ children }: RootLayoutProps) => (
  <html
    className={`${pretendard.variable} ${pretendardJp.variable} ${d2Coding.variable}`}
    suppressHydrationWarning
  >
    <body>{children}</body>
  </html>
);

export default RootLayout;

import type { Metadata } from 'next';
import type { ReactNode } from 'react';

import { d2Coding, pretendard, pretendardJp } from '@/app/fonts';
import { SceneAssetPreloader } from '@/entities/scene/ui/scene-asset-preloader';

import './globals.css';
import 'katex/dist/katex.min.css';

export const metadata: Metadata = {
  verification: {
    google: '3UTJWRAv_ZKFjyxdzQSTJ0E4twrRsQ-IBJc86xfFHwQ',
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
    <body>
      <SceneAssetPreloader />
      {children}
    </body>
  </html>
);

export default RootLayout;

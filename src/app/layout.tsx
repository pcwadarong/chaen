import type { Metadata } from 'next';

import { d2Coding, pretendard, pretendardJp } from './fonts';

import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'chaen',
    template: '%s | chaen',
  },
  description: 'Frontend workspace for main, guest, blog, and work pages.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ko"
      className={`${pretendard.variable} ${pretendardJp.variable} ${d2Coding.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}

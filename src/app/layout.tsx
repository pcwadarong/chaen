import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'chaen',
  description: 'Project setup for Next.js + tooling stack',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}

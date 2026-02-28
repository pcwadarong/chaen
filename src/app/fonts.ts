import localFont from 'next/font/local';

export const pretendard = localFont({
  src: [
    {
      path: '../fonts/PretendardVariable.woff2',
      style: 'normal',
      weight: '45 920',
    },
  ],
  display: 'swap',
  preload: true,
  variable: '--font-pretendard',
});

export const pretendardJp = localFont({
  src: [
    {
      path: '../fonts/PretendardJPVariable.woff2',
      style: 'normal',
      weight: '45 920',
    },
  ],
  display: 'swap',
  preload: false,
  variable: '--font-pretendard-jp',
});

export const d2Coding = localFont({
  src: [
    {
      path: '../fonts/D2codingLigatureSubset.woff2',
      style: 'normal',
      weight: '400',
    },
  ],
  display: 'swap',
  preload: false,
  variable: '--font-d2coding',
});

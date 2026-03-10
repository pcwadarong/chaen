import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import React from 'react';

import { type AppLocale, locales } from '@/i18n/routing';
import { buildLocaleAlternates, buildLocalizedPathname } from '@/shared/lib/seo/metadata';
import { buildDefaultOgImageUrl } from '@/shared/lib/seo/og-image';
import { buildAbsoluteSiteUrl } from '@/shared/lib/seo/site-url';
import { getHomePageData, HomePage } from '@/views/home';

type HomeRouteProps = {
  params: Promise<{
    locale: string;
  }>;
};

/**
 * 홈 메타데이터를 생성합니다.
 */
export const generateMetadata = async ({ params }: HomeRouteProps): Promise<Metadata> => {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'Home' });
  const homePath = buildLocalizedPathname({
    locale: locale as AppLocale,
  });
  const ogImageUrl = buildDefaultOgImageUrl();

  return {
    title: t('eyebrow'),
    description: t('description'),
    alternates: buildLocaleAlternates({
      canonicalLocale: locale as AppLocale,
      pathnameByLocale: Object.fromEntries(
        locales.map(candidateLocale => [
          candidateLocale,
          buildLocalizedPathname({ locale: candidateLocale }),
        ]),
      ) as Partial<Record<AppLocale, string>>,
    }),
    openGraph: {
      description: t('description'),
      images: [ogImageUrl],
      title: t('eyebrow'),
      type: 'website',
      url: buildAbsoluteSiteUrl(homePath),
    },
    twitter: {
      card: 'summary_large_image',
      description: t('description'),
      images: [ogImageUrl],
      title: t('eyebrow'),
    },
  };
};

/** 홈 페이지 엔트리입니다. */
const HomeRoute = async ({ params }: HomeRouteProps) => {
  const { locale } = await params;
  const pageData = await getHomePageData({ locale });

  return <HomePage {...pageData} />;
};

export default HomeRoute;

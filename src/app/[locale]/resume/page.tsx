import type { Metadata } from 'next';
import React from 'react';

import { type AppLocale, isValidLocale, locales } from '@/i18n/routing';
import { buildLocaleAlternates, buildLocalizedPathname } from '@/shared/lib/seo/metadata';
import { buildDefaultOgImageUrl } from '@/shared/lib/seo/og-image';
import { buildAbsoluteSiteUrl } from '@/shared/lib/seo/site-url';
import { getResumePageData, ResumePage } from '@/views/resume';

type ResumeRouteProps = {
  params: Promise<{
    locale: string;
  }>;
};

/**
 * 이력서 페이지 메타데이터를 생성합니다.
 */
export const generateMetadata = async ({ params }: ResumeRouteProps): Promise<Metadata> => {
  const { locale } = await params;
  const pageData = await getResumePageData({ locale });
  const canonicalLocale = isValidLocale(pageData.content.locale)
    ? pageData.content.locale
    : (locale as AppLocale);
  const resumePath = buildLocalizedPathname({
    locale: canonicalLocale,
    pathname: '/resume',
  });
  const ogImageUrl = buildDefaultOgImageUrl();
  const alternates =
    canonicalLocale === locale
      ? buildLocaleAlternates({
          canonicalLocale,
          pathnameByLocale: Object.fromEntries(
            locales.map(candidateLocale => [
              candidateLocale,
              buildLocalizedPathname({
                locale: candidateLocale,
                pathname: '/resume',
              }),
            ]),
          ) as Partial<Record<AppLocale, string>>,
        })
      : {
          canonical: buildAbsoluteSiteUrl(resumePath),
        };

  return {
    title: pageData.content.title,
    description: pageData.content.description,
    alternates,
    openGraph: {
      description: pageData.content.description,
      images: [ogImageUrl],
      title: pageData.content.title,
      type: 'profile',
      url: buildAbsoluteSiteUrl(resumePath),
    },
    twitter: {
      card: 'summary_large_image',
      description: pageData.content.description,
      images: [ogImageUrl],
      title: pageData.content.title,
    },
  };
};

/** 이력서 페이지 엔트리입니다. */
const ResumeRoute = async ({ params }: ResumeRouteProps) => {
  const { locale } = await params;
  const pageData = await getResumePageData({ locale });

  return <ResumePage {...pageData} />;
};

export default ResumeRoute;

import type { Metadata } from 'next';
import React from 'react';

import { getGuestPageData, GuestPage } from '@/views/guest';

export const metadata: Metadata = {
  robots: {
    follow: false,
    index: false,
  },
};

/** 방명록 페이지 엔트리입니다. */
const GuestRoute = async ({
  params,
}: {
  params: Promise<{
    locale: string;
  }>;
}) => {
  const { locale } = await params;
  const pageData = await getGuestPageData({ locale });

  return <GuestPage {...pageData} />;
};

export default GuestRoute;

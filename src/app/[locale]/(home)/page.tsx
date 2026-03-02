import React from 'react';

import { getProjects } from '@/entities/project/api/get-projects';
import { HomePage } from '@/views/home';

/** 홈 페이지 엔트리입니다. */
const HomeRoute = async ({
  params,
}: {
  params: Promise<{
    locale: string;
  }>;
}) => {
  const { locale } = await params;
  const items = await getProjects(locale);

  return <HomePage items={items.slice(0, 3)} />;
};

export default HomeRoute;

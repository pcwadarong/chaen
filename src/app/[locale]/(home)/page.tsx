import React from 'react';

import { getProjects } from '@/entities/project/api/get-projects';
import { HomePage } from '@/views/home';

/** 홈 페이지 엔트리입니다. */
const HomeRoute = async () => {
  const items = await getProjects();

  return <HomePage items={items.slice(0, 3)} />;
};

export default HomeRoute;

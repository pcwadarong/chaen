import React from 'react';

import { projectItems } from '@/entities/project/model/project-items';
import { WorkListPage } from '@/views/work-list';

/** 프로젝트 목록 페이지 엔트리입니다. */
const WorkRoute = () => <WorkListPage items={projectItems} />;

export default WorkRoute;

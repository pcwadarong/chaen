import { projectItems } from '@/entities/project/model/project-items';
import { WorkListPage } from '@/views/work-list';

const WorkRoute = () => <WorkListPage items={projectItems} />;

export default WorkRoute;

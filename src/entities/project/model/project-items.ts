export type ProjectItem = {
  deliverableKeys: string[];
  id: string;
  year: string;
};

export const projectItems: ProjectItem[] = [
  {
    deliverableKeys: ['motionTokens', 'interactionSpec', 'storybookFoundation'],
    id: 'motion-library',
    year: '2026',
  },
  {
    deliverableKeys: ['authFlow', 'storageStrategy', 'publishingDashboard'],
    id: 'supabase-editorial',
    year: '2025',
  },
  {
    deliverableKeys: ['landingNarrative', 'ctaExperiment', 'analyticsHooks'],
    id: 'guest-campaign',
    year: '2024',
  },
];

export const findProjectItem = (id: string) => projectItems.find(project => project.id === id);

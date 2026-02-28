export type ArticleItem = {
  tags: string[];
  id: string;
};

export const articleItems: ArticleItem[] = [
  {
    id: 'typography-rhythm',
    tags: ['typography', 'i18n', 'designSystem'],
  },
  {
    id: 'svgr-turbopack',
    tags: ['nextjs', 'svg', 'buildTooling'],
  },
  {
    id: 'supabase-ssr-boundary',
    tags: ['supabase', 'ssr', 'architecture'],
  },
];
